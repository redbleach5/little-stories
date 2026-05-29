#!/usr/bin/env python3
"""
Neural Fairy Tale Audio Generator v5
Uses Piper TTS (ONNX neural network) with LLM-directed emotional segmentation
and ffmpeg post-processing for warm, atmospheric storytelling.

Key improvements over previous approaches:
1. Piper TTS — native Russian neural network, not a Chinese/English TTS
2. LLM-directed segmentation — AI understands emotional context
3. Audio post-processing — reverb for warmth, EQ for presence, 
   dynamic tempo for dramatic pacing
"""

import json
import os
import subprocess
import sys
import time
import wave
import tempfile

import torchaudio
import torch

AUDIO_DIR = "/home/z/my-project/public/audio"
TMP_DIR = "/home/z/my-project/.tmp/neural_tts"
PIPER_DIR = "/home/z/my-project/.piper"

# Use Irina (female, warm) as primary storytelling voice
PRIMARY_VOICE = f"{PIPER_DIR}/ru_RU-irina-medium.onnx"
# Use Dmitry (male, deeper) for male character dialogue
SECONDARY_VOICE = f"{PIPER_DIR}/ru_RU-dmitri-medium.onnx"

# ── Story texts ───────────────────────────────────────────────────────

STORIES = {
    "kolobok": [
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
    "teremok": [
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
    "repka": [
        "Посадил дед репку. Выросла репка большая-пребольшая. Стал дед репку из земли тащить: тянет-потянет, вытянуть не может!",
        "Позвал дед бабку:\n— Бабка, помоги репку тянуть!\nБабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!",
        "Позвала бабка внучку:\n— Внучка, помоги репку тянуть!\nВнучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!",
        "Позвала внучка Жучку:\n— Жучка, помоги репку тянуть!\nЖучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!",
        "Позвала Жучка кошку:\n— Кошка, помоги репку тянуть!\nКошка за Жучку, Жучка за внучку, внучку за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!",
        "Позвала кошка мышку:\n— Мышка, помоги репку тянуть!\nМышка за кошку, кошка за Жучку, Жучка за внучку, бабка за дедку, дедка за репку — тянут-потянут... Вытянули репку!",
    ],
    "ryaba": [
        "Жили-были дед да баба. И была у них курочка Ряба. Снесла курочка яичко — не простое, а золотое!",
        "Дед бил-бил — не разбил. Баба била-била — не разбила. Яичко было крепкое, золотое — никак не ломалось!",
        "Мышка бежала, хвостиком махнула, яичко упало и разбилось! Плачет дед, плачет баба...",
        "А курочка Ряба говорит:\n— Не плачь, дед! Не плачь, баба! Я снесу вам яичко не золотое, а простое!\nИ снесла курочка простое яичко. Всем было радость!",
    ],
    "masha": [
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
}


def get_llm_segments(zai_module, text):
    """Use LLM to create director's script with emotional segmentation."""
    import subprocess
    
    # Use Node.js to call z-ai SDK (more reliable than Python)
    prompt = f"""Разбей текст русской сказки на фрагменты для озвучки. Каждый фрагмент — короткая фраза с указанием эмоции. Формат: JSON массив с полями text, emotion (narration/dialogue/song/exclamation/dramatic/whisper/ending), pause_ms (пауза после в миллисекундах), voice (irina или dmitri).

Правила:
- Повествование: irina, спокойная интонация, пауза 400-600мс
- Диалог мужчин: dmitri, живой, пауза 500-700мс  
- Диалог женщин/детей: irina, оживлённый, пауза 500-700мс
- Песня: irina, медленная, пауза 800мс
- Восклицание: соответствующий голос, энергичный, пауза 600мс
- Драматический момент: тихий, замедленный, пауза 800мс
- Финал: irina, тёплый, satisfied, пауза 1000мс
- Фрагменты до 150 символов

Текст:
{text}"""

    script = f"""const ZAI = require('z-ai-web-dev-sdk').default;
async function main() {{
  const zai = await ZAI.create();
  const result = await zai.chat.completions.create({{
    messages: [
      {{ role: 'system', content: 'Ты режиссёр озвучки детских сказок. Отвечай ТОЛЬКО валидным JSON.' }},
      {{ role: 'user', content: {json.dumps(prompt)} }}
    ],
    temperature: 0.5,
  }});
  const content = result.choices[0].message.content;
  // Extract JSON from markdown code blocks if present
  const jsonMatch = content.match(/```(?:json)?\\s*([\\s\\S]*?)```/) || [null, content];
  console.log(jsonMatch[1].trim());
}}
main().catch(e => console.error(e.message));
"""
    
    result = subprocess.run(
        ['node', '-e', script],
        capture_output=True, text=True, cwd='/home/z/my-project',
        timeout=60
    )
    
    try:
        segments = json.loads(result.stdout.strip())
        return segments
    except json.JSONDecodeError:
        print(f"  ⚠️ LLM returned invalid JSON, using fallback segmentation")
        return fallback_segment(text)


def fallback_segment(text):
    """Fallback segmentation without LLM."""
    segments = []
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        is_dialogue = line.startswith('—') or line.startswith('–') or line.startswith('-')
        is_song = line.startswith('«')
        
        if is_dialogue:
            segments.append({
                "text": line,
                "emotion": "dialogue",
                "pause_ms": 600,
                "voice": "dmitri" if any(w in line.lower() for w in ['дед', 'медведь', 'волк', 'дедушк']) else "irina"
            })
        elif is_song:
            segments.append({
                "text": line,
                "emotion": "song",
                "pause_ms": 800,
                "voice": "irina"
            })
        elif '!' in line and ('ам' in line or 'прыг' in line or 'большая' in line):
            segments.append({
                "text": line,
                "emotion": "dramatic",
                "pause_ms": 800,
                "voice": "irina"
            })
        elif '...' in line:
            segments.append({
                "text": line,
                "emotion": "dramatic",
                "pause_ms": 800,
                "voice": "irina"
            })
        elif 'И стали жить' in line or 'Всем было радость' in line:
            segments.append({
                "text": line,
                "emotion": "ending",
                "pause_ms": 1000,
                "voice": "irina"
            })
        else:
            segments.append({
                "text": line,
                "emotion": "narration",
                "pause_ms": 500,
                "voice": "irina"
            })
    
    return segments


def generate_segment_audio(piper_voice, text, output_path):
    """Generate audio for one segment using Piper TTS."""
    with wave.open(output_path, "wb") as wf:
        piper_voice.synthesize_wav(text, wf)
    return output_path


def apply_emotion_ffmpeg(input_wav, output_wav, emotion):
    """Apply audio post-processing based on emotion type."""
    
    if emotion == "narration":
        # Warm, slightly slower, with gentle reverb
        filter_str = (
            'atempo=0.88,'
            'aecho=0.8:0.88:60:0.2,'
            'bass=g=3:f=200:w=0.5,'
            'volume=1.2'
        )
    elif emotion == "dialogue":
        # Present, clear, slight presence boost
        filter_str = (
            'atempo=0.92,'
            'bass=g=2:f=200:w=0.5,'
            'treble=g=2:f=3000:w=0.5,'
            'volume=1.4'
        )
    elif emotion == "song":
        # Slow, spacious, reverberant
        filter_str = (
            'atempo=0.75,'
            'aecho=0.8:0.9:80:0.3,'
            'bass=g=4:f=150:w=0.5,'
            'volume=1.3'
        )
    elif emotion == "exclamation":
        # Energetic, louder, bright
        filter_str = (
            'atempo=0.95,'
            'treble=g=3:f=2000:w=0.5,'
            'volume=1.6'
        )
    elif emotion == "dramatic":
        # Slow, quiet, intimate, very warm
        filter_str = (
            'atempo=0.72,'
            'aecho=0.7:0.85:100:0.4,'
            'bass=g=5:f=150:w=0.8,'
            'volume=0.9'
        )
    elif emotion == "whisper":
        # Very quiet, very intimate
        filter_str = (
            'atempo=0.68,'
            'aecho=0.6:0.85:120:0.5,'
            'bass=g=6:f=100:w=0.8,'
            'volume=0.7'
        )
    elif emotion == "ending":
        # Warm, satisfied, spacious
        filter_str = (
            'atempo=0.80,'
            'aecho=0.9:0.92:70:0.25,'
            'bass=g=4:f=150:w=0.5,'
            'volume=1.3'
        )
    else:
        filter_str = 'atempo=0.88,volume=1.2'
    
    cmd = [
        'ffmpeg', '-y', '-i', input_wav,
        '-af', filter_str,
        '-ar', '24000',
        output_wav
    ]
    
    result = subprocess.run(cmd, capture_output=True, timeout=30)
    if result.returncode != 0:
        # Fallback: just resample without effects
        cmd = ['ffmpeg', '-y', '-i', input_wav, '-ar', '24000', output_wav]
        subprocess.run(cmd, capture_output=True, timeout=30)


def concatenate_with_pauses(chunk_files, pauses, output_path):
    """Concatenate audio chunks with silence pauses between them."""
    concat_list = []
    
    for i, chunk in enumerate(chunk_files):
        if i > 0 and pauses[i] > 0:
            silence_file = os.path.join(TMP_DIR, f"silence_{i}.wav")
            duration = pauses[i] / 1000.0
            subprocess.run([
                'ffmpeg', '-y', '-f', 'lavfi',
                '-i', f'anullsrc=r=24000:cl=mono',
                '-t', str(duration),
                '-q:a', '0', silence_file
            ], capture_output=True, timeout=10)
            concat_list.append(f"file '{silence_file}'")
        concat_list.append(f"file '{chunk}'")
    
    concat_file = os.path.join(TMP_DIR, 'concat.txt')
    with open(concat_file, 'w') as f:
        f.write('\n'.join(concat_list))
    
    subprocess.run([
        'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
        '-i', concat_file,
        '-codec:a', 'libmp3lame', '-b:a', '64k',
        '-ar', '24000',
        output_path
    ], capture_output=True, timeout=60)
    
    # Cleanup
    for f in chunk_files:
        try: os.unlink(f)
        except: pass


def generate_page(story_id, page_num, page_text, use_llm=True):
    """Generate one page of audio with emotional segmentation."""
    from piper import PiperVoice
    
    os.makedirs(TMP_DIR, exist_ok=True)
    
    # Load voices
    irina = PiperVoice.load(PRIMARY_VOICE)
    dmitri = PiperVoice.load(SECONDARY_VOICE)
    
    # Get segments (from LLM or fallback)
    if use_llm:
        try:
            segments = get_llm_segments(None, page_text)
            print(f"  🎬 LLM directed: {len(segments)} segments")
        except Exception as e:
            print(f"  ⚠️ LLM failed: {e}, using fallback")
            segments = fallback_segment(page_text)
    else:
        segments = fallback_segment(page_text)
        print(f"  📝 Fallback: {len(segments)} segments")
    
    # Generate each segment
    chunk_files = []
    pauses = [0]  # First segment has no preceding pause
    
    for i, seg in enumerate(segments):
        text = seg.get('text', '').strip()
        emotion = seg.get('emotion', 'narration')
        pause_ms = seg.get('pause_ms', 500)
        voice_name = seg.get('voice', 'irina')
        
        if not text:
            continue
        
        voice = dmitri if voice_name == 'dmitri' else irina
        
        # Generate raw audio
        raw_path = os.path.join(TMP_DIR, f"{story_id}_{page_num:02d}_raw_{i:02d}.wav")
        processed_path = os.path.join(TMP_DIR, f"{story_id}_{page_num:02d}_proc_{i:02d}.wav")
        
        try:
            generate_segment_audio(voice, text, raw_path)
            # Apply emotional post-processing
            apply_emotion_ffmpeg(raw_path, processed_path, emotion)
            chunk_files.append(processed_path)
            pauses.append(pause_ms)
            print(f"    [{emotion:12s}] {voice_name:6s} | \"{text[:50]}\"")
            # Cleanup raw
            try: os.unlink(raw_path)
            except: pass
        except Exception as e:
            print(f"    ✗ FAILED: {e}")
    
    if not chunk_files:
        raise Exception("No audio chunks generated")
    
    # Concatenate with pauses
    pn = f"{page_num:02d}"
    output_path = os.path.join(AUDIO_DIR, f"{story_id}_{pn}.mp3")
    concatenate_with_pauses(chunk_files, pauses, output_path)
    
    size = os.path.getsize(output_path)
    return output_path, size


def main():
    story_id = sys.argv[1] if len(sys.argv) > 1 else 'kolobok'
    page_arg = sys.argv[2]  # optional: single page
    
    pages = STORIES.get(story_id)
    if not pages:
        print(f"Unknown story: {story_id}")
        sys.exit(1)
    
    pages_to_gen = [int(page_arg) - 1] if page_arg else range(len(pages))
    
    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(TMP_DIR, exist_ok=True)
    
    print(f"\n🎙️ Neural TTS: {story_id} ({len(list(pages_to_gen))} pages)")
    print(f"🧠 Piper TTS (ONNX) + LLM direction + ffmpeg post-processing\n")
    
    ok = fail = 0
    for idx in pages_to_gen:
        text = pages[idx]
        page_num = idx + 1
        print(f"📄 Page {page_num}:")
        
        try:
            path, size = generate_page(story_id, page_num, text, use_llm=True)
            print(f"  ✅ {os.path.basename(path)} ({size//1024}KB)\n")
            ok += 1
        except Exception as e:
            print(f"  ❌ FAILED: {e}\n")
            fail += 1
    
    # Cleanup
    try: import shutil; shutil.rmtree(TMP_DIR, ignore_errors=True)
    except: pass
    
    print(f"✅ {ok} ok, {fail} failed")


if __name__ == "__main__":
    main()
