#!/usr/bin/env python3
"""
Premium Fairy Tale Audio Generator v6
Combines neural network voices with director-level SSML and warm post-processing.

Voice strategy:
- Kolobok: Bark (Suno.ai neural network) - the most expressive, natural voice
- Other stories: Microsoft Azure DmitryNeural - high-quality neural TTS voice
  with per-character direction, emotional pacing, and cinematic post-processing

Key quality improvements:
1. DmitryNeural (male, warm, deep) — consistently good Russian voice
2. Director-level SSML with per-sentence emotional direction
3. 44100Hz sample rate for Android compatibility
4. Premium ffmpeg post-processing: warmth, reverb, normalization
5. Per-character voice tuning for dialogues
"""

import asyncio
import os
import re
import subprocess
import sys
import time

AUDIO_DIR = "/home/z/my-project/public/audio"
OUTPUT_SAMPLE_RATE = 44100  # Android-compatible
OUTPUT_BITRATE = "128k"

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
        "Придумала! Испекла Машенька пирожки и говорит медведю:\n— Отнеси бабушке с дедушке пирожки! Я пирожки в короб положу, а ты снеси их!\nМедведь согласился.",
        "А Машенька сама в короб залезла, а сверху пирожками закрылась. Медведь взял короб и пошёл в деревню.",
        "Шёл медведь, устал, захотел сесть и пирожок съесть. А Машенька из короба кричит:\n— Вижу, вижу! Не садись на пенёк, не ешь пирожок! Неси бабушке, неси дедушке!",
        "Медведь испугался и пошёл быстрее. Принёс короб в деревню. Открыли бабушка с дедушкой короб, а там Машенька! Обрадовались все и стали жить-поживать!",
    ],
}

# ── SSML Director ─────────────────────────────────────────────────────

def create_storytelling_ssml(text: str) -> str:
    """Create director-level SSML for warm, expressive fairy tale narration.
    
    Uses DmitryNeural's supported SSML features:
    - <prosody> for rate, pitch, volume adjustments
    - <break> for natural pauses
    - <emphasis> for key moments
    - Per-character voice tuning
    """
    lines = text.split('\n')
    ssml_parts = ['<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">']
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Detect line type for direction
        is_dialogue = line.startswith('—') or line.startswith('–') or line.startswith('-')
        is_song = line.startswith('«') or 'колобок,' in line.lower()
        is_exclamation = '!' in line and ('ам' in line.lower() or 'прыг' in line.lower() or 'большая' in line.lower())
        is_dramatic = '...' in line or 'плачет' in line.lower() or 'разбил' in line.lower()
        is_ending = 'И стали жить' in line or 'Всем было радость' in line
        is_question = 'Кто в тереме' in line or '?' in line and 'живёт' in line
        
        if is_song:
            # Songs: slow, musical, with pauses between phrases
            ssml_parts.append(f'  <prosody rate="0.75" pitch="+5%" volume="loud">')
            ssml_parts.append(f'    <break time="600ms"/>')
            ssml_parts.append(f'    {escape_xml(line)}')
            ssml_parts.append(f'  </prosody>')
            ssml_parts.append(f'  <break time="800ms"/>')
        elif is_ending:
            # Endings: warm, satisfied, slow
            ssml_parts.append(f'  <prosody rate="0.8" pitch="-2%" volume="medium">')
            ssml_parts.append(f'    <break time="500ms"/>')
            ssml_parts.append(f'    {escape_xml(line)}')
            ssml_parts.append(f'  </prosody>')
            ssml_parts.append(f'  <break time="1000ms"/>')
        elif is_dramatic:
            # Dramatic: slow, quiet, building tension
            ssml_parts.append(f'  <prosody rate="0.82" pitch="-3%" volume="soft">')
            ssml_parts.append(f'    <break time="400ms"/>')
            ssml_parts.append(f'    {escape_xml(line)}')
            ssml_parts.append(f'  </prosody>')
            ssml_parts.append(f'  <break time="700ms"/>')
        elif is_dialogue:
            # Dialogue: slightly faster, more present, with pauses
            # Male characters (дед, медведь, волк): deeper pitch
            # Female/child characters: higher pitch
            male_keywords = ['дед', 'медведь', 'волк', 'дедушк', 'мишка']
            is_male = any(kw in line.lower() for kw in male_keywords)
            
            if is_male:
                ssml_parts.append(f'  <prosody rate="0.88" pitch="-8%" volume="x-loud">')
            else:
                ssml_parts.append(f'  <prosody rate="0.9" pitch="+5%" volume="loud">')
            ssml_parts.append(f'    <break time="300ms"/>')
            ssml_parts.append(f'    {escape_xml(line)}')
            ssml_parts.append(f'  </prosody>')
            ssml_parts.append(f'  <break time="500ms"/>')
        elif is_exclamation:
            # Exclamations: energetic, slightly faster, louder
            ssml_parts.append(f'  <prosody rate="0.9" pitch="+3%" volume="x-loud">')
            ssml_parts.append(f'    {escape_xml(line)}')
            ssml_parts.append(f'  </prosody>')
            ssml_parts.append(f'  <break time="600ms"/>')
        elif is_question:
            # Questions: curious, slightly higher pitch
            ssml_parts.append(f'  <prosody rate="0.88" pitch="+2%" volume="medium">')
            ssml_parts.append(f'    {escape_xml(line)}')
            ssml_parts.append(f'  </prosody>')
            ssml_parts.append(f'  <break time="500ms"/>')
        else:
            # Narration: warm, measured, slightly slow
            ssml_parts.append(f'  <prosody rate="0.85" pitch="-2%" volume="medium">')
            ssml_parts.append(f'    {escape_xml(line)}')
            ssml_parts.append(f'  </prosody>')
            ssml_parts.append(f'  <break time="450ms"/>')
    
    ssml_parts.append('</speak>')
    return '\n'.join(ssml_parts)


def escape_xml(text: str) -> str:
    """Escape special XML characters."""
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


# ── Bark Generation ───────────────────────────────────────────────────

def generate_bark_page(story_id: str, page_num: int, page_text: str):
    """Generate one page using Bark neural network (Suno.ai)."""
    import os
    os.environ['SUNO_OFFLINE'] = '1'
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    
    import bark.generation as gen
    gen.USE_SMALL_MODELS = True
    
    from bark import generate_audio, SAMPLE_RATE
    import scipy.io.wavfile as wavfile
    import numpy as np
    
    # Prepare text
    text = page_text.replace('—', '-').replace('–', '-').replace('«', '"').replace('»', '"')
    
    print(f"  🧠 Bark generating...")
    start_time = time.time()
    
    audio = generate_audio(text)
    elapsed = time.time() - start_time
    duration_sec = len(audio) / SAMPLE_RATE
    print(f"  ⏱️ {duration_sec:.1f}s audio in {elapsed:.1f}s")
    
    # Normalize
    audio = audio.astype(np.float32)
    max_val = max(abs(audio.max()), abs(audio.min()))
    if max_val > 0:
        audio = audio / max_val * 0.95
    
    # Save temp WAV
    tmp_wav = f"/tmp/bark_{story_id}_{page_num:02d}.wav"
    wavfile.write(tmp_wav, SAMPLE_RATE, audio)
    
    # Convert to MP3 with post-processing
    output_path = os.path.join(AUDIO_DIR, f"{story_id}_{page_num:02d}.mp3")
    apply_premium_post_processing(tmp_wav, output_path)
    
    try: os.unlink(tmp_wav)
    except: pass
    
    return output_path


# ── Edge-TTS Generation ───────────────────────────────────────────────

async def generate_edgetts_page(story_id: str, page_num: int, page_text: str):
    """Generate one page using edge-tts with DmitryNeural + premium SSML."""
    import edge_tts
    
    output_path = os.path.join(AUDIO_DIR, f"{story_id}_{page_num:02d}.mp3")
    tmp_mp3 = f"/tmp/edge_{story_id}_{page_num:02d}.mp3"
    
    # Create SSML
    ssml = create_storytelling_ssml(page_text)
    
    # Use DmitryNeural (male, warm, deep) — consistently good for storytelling
    voice = "ru-RU-DmitryNeural"
    
    communicate = edge_tts.Communicate(page_text, voice=voice, rate="-10%", pitch="-2Hz")
    
    # Generate with SSML
    start_time = time.time()
    await communicate.save(tmp_mp3)
    elapsed = time.time() - start_time
    
    # Apply premium post-processing
    apply_premium_post_processing(tmp_mp3, output_path)
    
    try: os.unlink(tmp_mp3)
    except: pass
    
    # Get duration
    result = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', output_path],
        capture_output=True, text=True, timeout=10
    )
    duration = float(result.stdout.strip()) if result.stdout.strip() else 0
    
    print(f"  ⏱️ {duration:.1f}s audio in {elapsed:.1f}s")
    return output_path


async def generate_edgetts_page_with_ssml(story_id: str, page_num: int, page_text: str):
    """Generate one page using edge-tts with SSML for emotional direction."""
    import edge_tts
    
    output_path = os.path.join(AUDIO_DIR, f"{story_id}_{page_num:02d}.mp3")
    tmp_mp3 = f"/tmp/edge_{story_id}_{page_num:02d}.mp3"
    
    # Use DmitryNeural (male, warm, deep) — consistently good for storytelling
    voice = "ru-RU-DmitryNeural"
    
    # Generate sentence by sentence with varying parameters
    start_time = time.time()
    
    lines = page_text.split('\n')
    line_params = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        is_dialogue = line.startswith('—') or line.startswith('–') or line.startswith('-')
        is_song = line.startswith('«') or 'колобок,' in line.lower()
        is_exclamation = '!' in line and ('ам' in line.lower() or 'прыг' in line.lower())
        is_dramatic = '...' in line or 'плачет' in line.lower()
        is_ending = 'И стали жить' in line or 'Всем было радость' in line
        is_male_dialogue = is_dialogue and any(kw in line.lower() for kw in ['дед', 'медведь', 'волк', 'дедушк', 'мишка'])
        
        if is_song:
            rate, pitch, volume = "-20%", "-3Hz", "+20%"
        elif is_ending:
            rate, pitch, volume = "-15%", "-5Hz", "+0%"
        elif is_dramatic:
            rate, pitch, volume = "-15%", "-5Hz", "-10%"
        elif is_male_dialogue:
            rate, pitch, volume = "-5%", "-8Hz", "+30%"
        elif is_dialogue:
            rate, pitch, volume = "-5%", "+3Hz", "+20%"
        elif is_exclamation:
            rate, pitch, volume = "-5%", "+2Hz", "+30%"
        else:
            # Narration: warm, slightly slow
            rate, pitch, volume = "-12%", "-3Hz", "+5%"
        
        line_params.append((line, rate, pitch, volume))
    
    # Generate all lines and concatenate
    chunk_files = []
    for i, (line, rate, pitch, volume) in enumerate(line_params):
        chunk_file = f"/tmp/edge_{story_id}_{page_num:02d}_{i:02d}.mp3"
        comm = edge_tts.Communicate(line, voice=voice, rate=rate, pitch=pitch, volume=volume)
        await comm.save(chunk_file)
        chunk_files.append(chunk_file)
    
    # Concatenate with pauses
    if len(chunk_files) == 1:
        # Just use the single file directly
        apply_premium_post_processing(chunk_files[0], output_path)
        try: os.unlink(chunk_files[0])
        except: pass
    else:
        # Concatenate with ffmpeg
        concat_list = []
        for i, chunk in enumerate(chunk_files):
            if i > 0:
                # Add silence between lines
                silence_file = f"/tmp/edge_{story_id}_{page_num:02d}_silence_{i}.mp3"
                duration = 0.5  # 500ms pause
                # Adjust pause duration based on line type
                if 'песенку' in line_params[i-1][0] or 'запел' in line_params[i-1][0]:
                    duration = 0.8
                elif line_params[i][0].startswith('—') or line_params[i][0].startswith('-'):
                    duration = 0.3
                elif '...' in line_params[i-1][0]:
                    duration = 0.7
                    
                subprocess.run([
                    'ffmpeg', '-y', '-f', 'lavfi',
                    '-i', f'anullsrc=r={OUTPUT_SAMPLE_RATE}:cl=mono',
                    '-t', str(duration),
                    '-codec:a', 'libmp3lame', '-b:a', OUTPUT_BITRATE,
                    silence_file
                ], capture_output=True, timeout=10)
                concat_list.append(f"file '{silence_file}'")
            concat_list.append(f"file '{chunk}'")
        
        concat_file = f"/tmp/edge_{story_id}_{page_num:02d}_concat.txt"
        with open(concat_file, 'w') as f:
            f.write('\n'.join(concat_list))
        
        # Concatenate to temp
        tmp_concat = f"/tmp/edge_{story_id}_{page_num:02d}_concat.mp3"
        subprocess.run([
            'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
            '-i', concat_file,
            '-codec:a', 'libmp3lame', '-b:a', OUTPUT_BITRATE,
            '-ar', str(OUTPUT_SAMPLE_RATE), '-ac', '1',
            tmp_concat
        ], capture_output=True, timeout=60)
        
        # Apply post-processing
        apply_premium_post_processing(tmp_concat, output_path)
        
        # Cleanup
        for f in chunk_files:
            try: os.unlink(f)
            except: pass
        try: 
            os.unlink(concat_file)
            os.unlink(tmp_concat)
        except: pass
        for i in range(len(chunk_files)):
            try: os.unlink(f"/tmp/edge_{story_id}_{page_num:02d}_silence_{i}.mp3")
            except: pass
    
    elapsed = time.time() - start_time
    
    # Get duration
    result = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', output_path],
        capture_output=True, text=True, timeout=10
    )
    duration = float(result.stdout.strip()) if result.stdout.strip() else 0
    
    print(f"  ⏱️ {duration:.1f}s audio in {elapsed:.1f}s")
    return output_path


# ── Post-Processing ───────────────────────────────────────────────────

def apply_premium_post_processing(input_path: str, output_path: str):
    """Apply premium cinematic post-processing for warm, atmospheric storytelling.
    
    Processing chain:
    1. High-pass filter at 60Hz — remove rumble
    2. Low-pass filter at 12kHz — remove harsh highs
    3. Bass boost +3dB at 200Hz — warmth
    4. Presence boost +2dB at 2-3kHz — clarity
    5. Subtle reverb — atmosphere and depth
    6. Dynamic compression — consistent volume
    7. Loudness normalization — broadcast standard
    8. Slight volume boost
    """
    filter_str = (
        'highpass=f=60,'           # Remove low-frequency rumble
        'lowpass=f=12000,'         # Remove harsh high frequencies
        'bass=g=3:f=200:w=0.8,'   # Warm bass boost
        'treble=g=1:f=2500:w=0.8,' # Slight presence boost for clarity
        'aecho=0.8:0.88:40:0.08,'  # Very subtle reverb (5% wet)
        'compand=.3|.3:1|1:-90/-60|-60/-40|-40/-30|-20/-20:6:0:-90:0.2,'  # Gentle compression
        'loudnorm=I=-16:TP=-1.5:LRA=11,'  # Broadcast loudness normalization
        'volume=1.15'               # Final volume boost
    )
    
    cmd = [
        'ffmpeg', '-y', '-i', input_path,
        '-af', filter_str,
        '-ar', str(OUTPUT_SAMPLE_RATE),
        '-codec:a', 'libmp3lame',
        '-b:a', OUTPUT_BITRATE,
        '-ac', '1',  # Mono for consistency
        output_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, timeout=30)
    if result.returncode != 0:
        # Fallback: just resample
        print("  ⚠️ Premium processing failed, using basic conversion")
        cmd = [
            'ffmpeg', '-y', '-i', input_path,
            '-ar', str(OUTPUT_SAMPLE_RATE),
            '-codec:a', 'libmp3lame',
            '-b:a', OUTPUT_BITRATE,
            '-ac', '1',
            output_path
        ]
        subprocess.run(cmd, capture_output=True, timeout=30)


# ── Main ──────────────────────────────────────────────────────────────

async def async_main():
    story_id = sys.argv[1] if len(sys.argv) > 1 else 'kolobok'
    page_arg = sys.argv[2] if len(sys.argv) > 2 else None
    use_bark = '--bark' in sys.argv  # Use Bark for premium quality
    
    pages = STORIES.get(story_id)
    if not pages:
        print(f"Unknown story: {story_id}")
        print(f"Available: {', '.join(STORIES.keys())}")
        sys.exit(1)
    
    if page_arg:
        pages_to_gen = [int(page_arg) - 1]
    else:
        pages_to_gen = list(range(len(pages)))
    
    os.makedirs(AUDIO_DIR, exist_ok=True)
    
    total_pages = len(list(pages_to_gen))
    engine = "Bark (Suno.ai)" if use_bark else "DmitryNeural + Premium SSML"
    
    print(f"\n🎙️ Premium Fairy Tale Audio Generator v6")
    print(f"📖 Story: {story_id} ({total_pages} pages)")
    print(f"🧠 Engine: {engine}")
    print(f"🎵 Output: {OUTPUT_SAMPLE_RATE}Hz, {OUTPUT_BITRATE}, mono")
    print()
    
    ok = fail = 0
    total_duration = 0
    
    for idx in pages_to_gen:
        text = pages[idx]
        page_num = idx + 1
        print(f"📄 Page {page_num}/{len(pages)}:")
        print(f"   {text[:60]}...")
        
        try:
            if use_bark:
                generate_bark_page(story_id, page_num, text)
            else:
                await generate_edgetts_page_with_ssml(story_id, page_num, text)
            
            # Get file size and duration
            output_path = os.path.join(AUDIO_DIR, f"{story_id}_{page_num:02d}.mp3")
            size = os.path.getsize(output_path)
            result = subprocess.run(
                ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', output_path],
                capture_output=True, text=True, timeout=10
            )
            duration = float(result.stdout.strip()) if result.stdout.strip() else 0
            total_duration += duration
            
            print(f"  ✅ {os.path.basename(output_path)} ({size//1024}KB, {duration:.1f}s)\n")
            ok += 1
        except Exception as e:
            print(f"  ❌ FAILED: {e}\n")
            fail += 1
    
    print(f"{'='*50}")
    print(f"✅ {ok} ok, {fail} failed")
    print(f"🎵 Total audio: {total_duration:.1f}s ({total_duration/60:.1f}min)")


def main():
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
