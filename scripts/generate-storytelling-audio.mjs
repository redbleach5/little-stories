/**
 * Russian Fairy Tale Audio Generator v4
 * 
 * Strategy: For each page, generate 1-3 large segments (not 5+ tiny ones).
 * - Pages with only narration: 1 TTS call
 * - Pages with dialogue: 2 calls (narration + dialogue parts combined)
 * - Pages with songs: 3 calls (intro + song + outro)
 * 
 * This reduces API calls from ~30 to ~12 for Kolobok, avoiding rate limits.
 */

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const AUDIO_DIR = '/home/z/my-project/public/audio';
const TMP_DIR = '/tmp/tts_chunks';

const NARRATION_VOICE = 'tongtong';
const DRAMATIC_VOICE = 'luodo';

const DELAY_MS = 3000;
const MAX_RETRIES = 5;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function ttsWithRetry(zai, params, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await zai.audio.tts.create(params);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(arrayBuffer));
      if (buffer.length < 100) {
        throw new Error('Empty audio response');
      }
      return buffer;
    } catch (e) {
      if (attempt < retries) {
        const isRateLimit = e.message && (e.message.includes('429') || e.message.includes('rate'));
        const backoff = isRateLimit ? DELAY_MS * Math.pow(2, attempt) : DELAY_MS;
        console.log(`      ⏳ Retry ${attempt+1}/${retries} in ${backoff}ms...`);
        await sleep(backoff);
      } else {
        throw e;
      }
    }
  }
}

/**
 * Smart segmentation: combine lines of same emotion into larger chunks.
 * This produces more natural-sounding audio and reduces API calls.
 */
function smartSegment(pageText) {
  const lines = pageText.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];
  
  // Classify each line
  const classified = lines.map(line => {
    const t = line.trim();
    const isDialogue = /^[—–-]\s/.test(t);
    const isSong = t.startsWith('«') || t.startsWith('И запел');
    const hasExclamation = t.includes('!');
    const hasQuestion = t.endsWith('?');
    const isDramatic = t.includes('ам!') || t.includes('прыг') || t.includes('...');
    const isEnding = t.includes('И стали жить') || t.includes('Всем было радость');
    
    let emotion = 'narration';
    let voice = NARRATION_VOICE;
    let speed = 0.72;
    let volume = 1.0;
    
    if (isDramatic) {
      emotion = 'dramatic'; voice = DRAMATIC_VOICE; speed = 0.60; volume = 0.8;
    } else if (isEnding) {
      emotion = 'ending'; voice = NARRATION_VOICE; speed = 0.65; volume = 1.3;
    } else if (isSong) {
      emotion = 'song'; voice = NARRATION_VOICE; speed = 0.55; volume = 1.2;
    } else if (isDialogue && hasExclamation) {
      emotion = 'exclamation'; voice = DRAMATIC_VOICE; speed = 0.85; volume = 2.5;
    } else if (isDialogue && hasQuestion) {
      emotion = 'question'; voice = NARRATION_VOICE; speed = 0.78; volume = 1.5;
    } else if (isDialogue) {
      emotion = 'dialogue'; voice = NARRATION_VOICE; speed = 0.80; volume = 1.5;
    } else if (hasExclamation && t.includes('большая-пребольшая')) {
      emotion = 'exclamation'; voice = DRAMATIC_VOICE; speed = 0.85; volume = 2.5;
    }
    
    return { text: t, emotion, voice, speed, volume };
  });
  
  // Merge consecutive lines with same voice into larger segments
  const segments = [];
  let current = null;
  
  for (const line of classified) {
    if (current && current.voice === line.voice && Math.abs(current.speed - line.speed) < 0.1) {
      // Same voice and similar speed — merge
      current.text += '\n' + line.text;
      // Use the more extreme speed
      current.speed = Math.min(current.speed, line.speed);
      // Use the higher volume
      current.volume = Math.max(current.volume, line.volume);
    } else {
      if (current) segments.push(current);
      current = { ...line };
    }
  }
  if (current) segments.push(current);
  
  // Check text length — if > 1024 chars, split
  const finalSegments = [];
  for (const seg of segments) {
    if (seg.text.length <= 1024) {
      finalSegments.push(seg);
    } else {
      // Split at sentence boundaries
      const sentences = seg.text.match(/[^.!?]+[.!?]+/g) || [seg.text];
      let chunk = '';
      for (const s of sentences) {
        if ((chunk + s).length > 1000) {
          if (chunk) finalSegments.push({ ...seg, text: chunk.trim() });
          chunk = s;
        } else {
          chunk += s;
        }
      }
      if (chunk) finalSegments.push({ ...seg, text: chunk.trim() });
    }
  }
  
  return finalSegments;
}

async function generatePage(zai, storyId, pageNum, pageText) {
  const segments = smartSegment(pageText);
  console.log(`  ${segments.length} segment(s):`);
  
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  
  const chunkFiles = [];
  const pauses = [];
  
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const pn = String(pageNum).padStart(2, '0');
    const idx = String(i).padStart(3, '0');
    const filepath = path.join(TMP_DIR, `${storyId}_${pn}_chunk_${idx}.wav`);
    
    const label = `[${seg.emotion}] v=${seg.voice} s=${seg.speed}`;
    console.log(`    ${label} | "${seg.text.substring(0, 60)}"`);
    
    try {
      const buffer = await ttsWithRetry(zai, {
        input: seg.text,
        voice: seg.voice,
        speed: seg.speed,
        volume: seg.volume,
        response_format: 'wav',
        stream: false,
      });
      
      fs.writeFileSync(filepath, buffer);
      chunkFiles.push(filepath);
      // Pause between segments: longer for dramatic/song, shorter for narration
      const pause = seg.emotion === 'dramatic' ? 600 :
                    seg.emotion === 'song' ? 500 :
                    seg.emotion === 'exclamation' ? 400 :
                    seg.emotion === 'ending' ? 700 : 300;
      pauses.push(pause);
      console.log(`      ✓ ${buffer.length} bytes`);
    } catch (e) {
      console.error(`      ✗ FAILED: ${e.message.substring(0, 80)}`);
    }
    
    await sleep(DELAY_MS);
  }
  
  if (chunkFiles.length === 0) {
    throw new Error('No chunks generated');
  }
  
  // Concatenate with pauses
  const concatList = [];
  for (let i = 0; i < chunkFiles.length; i++) {
    if (i > 0 && pauses[i] > 0) {
      const silenceFile = path.join(TMP_DIR, `silence_${pageNum}_${i}.wav`);
      const dur = pauses[i] / 1000;
      try {
        execSync(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t ${dur} -q:a 0 "${silenceFile}" 2>/dev/null`);
        concatList.push(`file '${silenceFile}'`);
      } catch(e) {}
    }
    concatList.push(`file '${chunkFiles[i]}'`);
  }
  
  const concatFilePath = path.join(TMP_DIR, `concat_${storyId}_${pageNum}.txt`);
  fs.writeFileSync(concatFilePath, concatList.join('\n'));
  
  const pn = String(pageNum).padStart(2, '0');
  const outputPath = path.join(AUDIO_DIR, `${storyId}_${pn}.mp3`);
  
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFilePath}" ` +
    `-codec:a libmp3lame -b:a 64k -ar 24000 "${outputPath}" 2>/dev/null`
  );
  
  // Cleanup chunk files for this page
  for (const f of chunkFiles) {
    try { fs.unlinkSync(f); } catch {}
  }
  try { fs.unlinkSync(concatFilePath); } catch {}
  
  const size = fs.statSync(outputPath).size;
  return { path: outputPath, size, segments: segments.length, generated: chunkFiles.length };
}

// ── Story data ───────────────────────────────────────────────────────
const STORIES = {
  kolobok: [
    "Жили-были дед да баба. Вот и просит дед:\n— Испеки мне, бабка, колобок!\nБабка по сусекам поскребла, по амбару помела, и набралось муки горсти две.",
    "Замесила бабка тесто, испекла колобок и поставила на окошко простывать. Колобок полежал-полежал, да и покатился — с окна на завалинку, с завалинки на травку, с травки на дорожку.",
    "Катится колобок по дороге, а навстречу ему заяц:\n— Колобок, колобок, я тебя съем!\n— Не ешь меня, зайка, я тебе песенку спою!",
    "И запел колобок:\n«Я колобок, колобок,\nПо амбару метён, по сусекам скребён,\nЯ от дедушки ушёл, я от бабушки ушёл,\nЯ от зайца ушёл...»",
    "Покатился колобок дальше. Навстречу ему волк:\n— Колобок, колобок, я тебя съем!\n— Не ешь меня, серый волк, я тебе песенку спою!",
    "И запел колобок:\n«Я колобок, колобок,\nЯ от дедушки ушёл, я от бабушки ушёл,\nЯ от зайца ушёл, я от волка ушёл...»\nИ покатился дальше.",
    "Навстречу ему медведь:\n— Колобок, колобок, я тебя съем!\n— Не ешь меня, мишка, я тебе песенку спою!",
    "И запел колобок:\n«Я колобок, колобок,\nЯ от дедушки ушёл, я от бабушки ушёл,\nЯ от зайца ушёл, я от волка ушёл, я от медведя ушёл...»",
    "Покатился колобок дальше. Навстречу ему лиса:\n— Здравствуй, колобок! Какой ты пригожий!\n— А я от всех ушёл!",
    "А лиса говорит:\n— Сядь ко мне на носок, да спой ещё разок!\nКолобок прыг лисе на нос — а лиса его — ам! — и съела!",
  ],
  teremok: [
    "Стоит в поле теремок-теремок. Он не низок, не высок, не высок. Бежит мимо мышка-норушка. Увидела теремок, остановилась и спрашивает:\n— Терем-теремок! Кто в тереме живёт?",
    "Никто не отзывается. Вошла мышка в теремок и стала там жить.\nПрибежала лягушка-квакушка и спрашивает:\n— Терем-теремок! Кто в тереме живёт?\n— Я, мышка-норушка! А ты кто?\n— А я лягушка-квакушка!",
    "Стали они вдвоём жить. Бежит мимо зайчик-побегайчик. Остановился и спрашивает:\n— Терем-теремок! Кто в тереме живёт?\n— Я, мышка-норушка! Я, лягушка-квакушка! А ты кто?\n— А я зайчик-побегайчик!",
    "Стали они втроём жить. Идёт мимо лисичка-сестричка. Постучала в окошко и спрашивает:\n— Терем-теремок! Кто в тереме живёт?",
    "— Я, мышка-норушка! Я, лягушка-квакушка! Я, зайчик-побегайчик! А ты кто?\n— А я лисичка-сестричка!\nСтали они вчетвером жить. Пришёл волчок-серый бочок.",
    "— Терем-теремок! Кто в тереме живёт?\n— Я, мышка-норушка! Я, лягушка-квакушка! Я, зайчик-побегайчик! Я, лисичка-сестричка! А ты кто?\n— А я волчок-серый бочок!",
    "Стали они впятером жить. Вот идут они все и видят — идёт медведь косолапый.\n— Терем-теремок! Кто в тереме живёт?",
    "— Я, мышка-норушка! Я, лягушка-квакушка! Я, зайчик-побегайчик! Я, лисичка-сестричка! Я, волчок-серый бочок! А ты кто?\n— А я медведь косолапый!",
    "Медведь влез на крышу и давай топтать — теремок и развалился! Еле-еле все успели выскочить.",
    "Потом все вместе построили новый теремок — большой и просторный. И стали жить-поживать да добра наживать!",
  ],
  repka: [
    "Посадил дед репку. Выросла репка большая-пребольшая. Стал дед репку из земли тащить: тянет-потянет, вытянуть не может!",
    "Позвал дед бабку:\n— Бабка, помоги репку тянуть!\nБабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!",
    "Позвала бабка внучку:\n— Внучка, помоги репку тянуть!\nВнучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!",
    "Позвала внучка Жучку:\n— Жучка, помоги репку тянуть!\nЖучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!",
    "Позвала Жучка кошку:\n— Кошка, помоги репку тянуть!\nКошка за Жучку, Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!",
    "Позвала кошка мышку:\n— Мышка, помоги репку тянуть!\nМышка за кошку, кошка за Жучку, Жучка за внучку, бабка за дедку, дедка за репку — тянут-потянут... Вытянули репку!",
  ],
  ryaba: [
    "Жили-были дед да баба. И была у них курочка Ряба. Снесла курочка яичко — не простое, а золотое!",
    "Дед бил-бил — не разбил. Баба била-била — не разбила. Яичко было крепкое, золотое — никак не ломалось!",
    "Мышка бежала, хвостиком махнула, яичко упало и разбилось! Плачет дед, плачет баба...",
    "А курочка Ряба говорит:\n— Не плачь, дед! Не плачь, баба! Я снесу вам яичко не золотое, а простое!\nИ снесла курочка простое яичко. Всем было радость!",
  ],
  masha: [
    "Жили-были дедушка да бабушка. Была у них внучка Машенька. Собрались раз подружки в лес по грибы да по ягоды. Пришли звать с собой и Машеньку.",
    "Дедушка с бабушкой не хотели её отпускать, но Машенька упросила: «Пустили!» — и побежала с подружками в лес.",
    "Машенька деревце за деревце, кустик за кустик — и дальше от подружек ушла. Стала кричать — никто не отзывается. Стала аукаться — никто не откликается.",
    "Шла, шла Машенька и вышла к избушке. Дверь открыта. Вошла она в избушку, села на лавку. А в той избушке жил медведь!",
    "Вернулся медведь и обрадовался: «Вот мне гостинец! Буду тебя держать, не пущу домой. Будешь мне печь топить, кашу варить, щи хлебать!» Заплакала Машенька.",
    "Стала Машенька у медведя жить. Медведь в лес пойдёт — Машеньке наказывает: «Без меня из избушки не выходи!» А Машенька всё думала, как бы ей домой вернуться.",
    "Придумала! Испекла Машенька пирожки и говорит медведю:\n— Отнеси бабушке с дедушкой пирожки! Я пирожки в короб положу, а ты снеси их!\nМедведь согласился.",
    "А Машенька сама в короб залезла, а сверху пирожками закрылась. Медведь взял короб и пошёл в деревню.",
    "Шёл медведь, устал, захотел сесть и пирожок съесть. А Машенька из короба кричит:\n— Вижу, вижу! Не садись на пенёк, не ешь пирожок! Неси бабушке, неси дедушке!",
    "Медведь испугался и пошёл быстрее. Принёс короб в деревню. Открыли бабушка с дедушкой короб, а там Машенька! Обрадовались все и стали жить-поживать!",
  ],
};

async function main() {
  const storyId = process.argv[2] || 'kolobok';
  const pageArg = process.argv[3];
  
  const zai = await ZAI.create();
  
  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  
  const pages = STORIES[storyId];
  if (!pages) { console.error(`Unknown story: ${storyId}`); process.exit(1); }
  
  const pagesToGenerate = pageArg ? [parseInt(pageArg) - 1] : pages.map((_, i) => i);
  
  console.log(`\n🎙️ ${storyId} (${pagesToGenerate.length} pages)\n`);
  
  let ok = 0, fail = 0;
  
  for (const pageIndex of pagesToGenerate) {
    const text = pages[pageIndex];
    const pageNum = pageIndex + 1;
    console.log(`📄 Page ${pageNum}:`);
    
    try {
      const result = await generatePage(zai, storyId, pageNum, text);
      const pn = String(pageNum).padStart(2, '0');
      console.log(`  ✅ ${storyId}_${pn}.mp3 (${(result.size/1024).toFixed(0)}KB, ${result.generated}/${result.segments} segments)`);
      ok++;
    } catch (e) {
      console.error(`  ❌ FAILED: ${e.message.substring(0, 100)}`);
      fail++;
    }
    
    await sleep(2000);
  }
  
  console.log(`\n✅ ${ok} ok, ${fail} failed`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
