#!/usr/bin/env python3
"""
Neural Fairy Tale Audio Generator — Bark (Suno.ai)
Uses Bark neural network (by Suno.ai team) for expressive Russian speech generation.

Bark is a transformer-based text-to-audio model that generates:
- Natural intonation and rhythm
- Emotional expression (pauses, emphasis, breathing)
- Consistent voice characteristics with speaker prompts

Key differences from TTS engines (edge-tts, Piper):
- Bark is a full neural network, not a TTS engine
- It understands context and generates appropriate prosody
- It can add natural pauses, breathing, emotional coloring
- It's the same technology behind suno.ai music generation
"""

import os
import sys
import subprocess
import json
import time
import numpy as np

# Force offline mode for cached models
os.environ['SUNO_OFFLINE'] = '1'
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'

AUDIO_DIR = "/home/z/my-project/public/audio"
SAMPLE_RATE = 24000  # Bark's native sample rate
OUTPUT_SAMPLE_RATE = 44100  # Android-compatible sample rate
OUTPUT_BITRATE = "128k"  # MP3 bitrate

# ── Story texts ───────────────────────────────────────────────────────

STORIES = {
    "kolobok": [
        "Жили-были дед да баба. Вот и просит дед:\n— Испеки мне, бабка, колобок!\nБабка по сусекам поскребла, по амбару помела, и набралось муки горсти две.",
        "Замесила бабка тесто, испекла колобок и поставила на окошко простывать. Колобок полежал-полежал, да и покатился — с окна на завалинку, с завалинки на травку, с травки на дорожку.",
        "Катится колобок по дороге, а навстречу ему заяц:\n— Колобок, колобок, я тебя съем!\n— Не ешь меня, зайка, я тебе песенку спою!",
        "И запел колобок:\n«Я колобок, колобок,\nПо амбару метён, по сусекам скребён,\nЯ от дедушки ушёл, я от бабушки ушёл,\nЯ от зайца ушёл...»",
        "Покатился колобок дальше. Навстречу ему волк:\n— Колобок, колобок, я тебя съем!\n— Не ешь меня, серый волк, я тебе песенку спою!",
        "И запел колобок:\n«Я колобок, колобок,\nЯ от дедушки ушёл, я от бабушки ушёл,\nЯ от зайца ушёл, я от волка ушёл...»\nИ покатился дальше.",
        "Навстречу ему медведь:\n— Колобок, колобок, я тебя съел!\n— Не ешь меня, мишка, я тебе песенку спою!",
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


def prepare_text_for_bark(text: str) -> str:
    """Prepare Russian text for Bark generation.
    
    Bark handles Russian well, but we need to:
    1. Keep text under ~200 chars for best quality
    2. Add [clears throat] and [pause] markers for storytelling effect
    3. Use proper punctuation for natural prosody
    """
    # Replace em-dashes with regular dashes for better tokenization
    text = text.replace('—', '-')
    text = text.replace('–', '-')
    # Replace guillemets with quotes
    text = text.replace('«', '"').replace('»', '"')
    return text.strip()


def generate_with_bark(text: str, speaker_prompt=None) -> np.ndarray:
    """Generate audio using Bark neural network."""
    import bark.generation as gen
    gen.USE_SMALL_MODELS = True
    
    from bark import generate_audio, SAMPLE_RATE
    
    prepared = prepare_text_for_bark(text)
    
    # Generate with optional speaker prompt for voice consistency
    if speaker_prompt is not None:
        audio = generate_audio(prepared, history_prompt=speaker_prompt)
    else:
        audio = generate_audio(prepared)
    
    return audio


def normalize_audio(audio: np.ndarray) -> np.ndarray:
    """Normalize audio to [-1, 1] range."""
    audio = audio.astype(np.float32)
    max_val = max(abs(audio.max()), abs(audio.min()))
    if max_val > 0:
        audio = audio / max_val * 0.95  # Leave some headroom
    return audio


def apply_warm_post_processing(input_path: str, output_path: str):
    """Apply warm storytelling post-processing with ffmpeg.
    
    - Gentle bass boost for warmth
    - Subtle reverb for atmosphere  
    - Normalization for consistent volume
    - Resample to 44100Hz for Android compatibility
    """
    filter_str = (
        'bass=g=2:f=200:w=0.8,'     # Gentle bass boost for warmth
        'treble=g=-1:f=4000:w=0.8,'  # Slightly soften highs
        'aecho=0.8:0.88:40:0.12,'    # Very subtle reverb for atmosphere
        'loudnorm=I=-16:TP=-1.5:LRA=11,'  # Normalize loudness
        'volume=1.1'                   # Slight volume boost
    )
    
    cmd = [
        'ffmpeg', '-y', '-i', input_path,
        '-af', filter_str,
        '-ar', str(OUTPUT_SAMPLE_RATE),
        '-codec:a', 'libmp3lame',
        '-b:a', OUTPUT_BITRATE,
        '-ac', '1',  # Mono
        output_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, timeout=30)
    if result.returncode != 0:
        # Fallback: just resample without effects
        print("  ⚠️ Post-processing failed, using basic conversion")
        cmd = [
            'ffmpeg', '-y', '-i', input_path,
            '-ar', str(OUTPUT_SAMPLE_RATE),
            '-codec:a', 'libmp3lame',
            '-b:a', OUTPUT_BITRATE,
            '-ac', '1',
            output_path
        ]
        subprocess.run(cmd, capture_output=True, timeout=30)


def generate_page(story_id: str, page_num: int, page_text: str, speaker_prompt=None):
    """Generate one page of audio with Bark neural network."""
    import scipy.io.wavfile as wavfile
    
    tmp_wav = f"/tmp/bark_{story_id}_{page_num:02d}.wav"
    output_path = os.path.join(AUDIO_DIR, f"{story_id}_{page_num:02d}.mp3")
    
    # Generate raw audio with Bark
    print(f"  🧠 Bark neural network generating...")
    start_time = time.time()
    
    audio = generate_with_bark(page_text, speaker_prompt)
    elapsed = time.time() - start_time
    duration_sec = len(audio) / SAMPLE_RATE
    
    print(f"  ⏱️ Generated {duration_sec:.1f}s of audio in {elapsed:.1f}s")
    
    # Normalize
    audio = normalize_audio(audio)
    
    # Save as WAV temporarily
    wavfile.write(tmp_wav, SAMPLE_RATE, audio)
    
    # Apply warm post-processing and convert to MP3
    apply_warm_post_processing(tmp_wav, output_path)
    
    # Cleanup temp file
    try:
        os.unlink(tmp_wav)
    except:
        pass
    
    size = os.path.getsize(output_path)
    return output_path, size, duration_sec


def generate_story_voice_prompt(story_id: str, text: str):
    """Generate a speaker prompt (voice sample) for consistent voice across pages.
    
    This generates the first page and uses it as the voice prompt for subsequent pages.
    """
    import scipy.io.wavfile as wavfile
    import tempfile
    
    print(f"  🎙️ Generating voice prompt for {story_id}...")
    
    # Use a short narration snippet as the voice prompt
    prompt_text = "В некотором царстве, в некотором государстве."  # Classic fairy tale opener
    
    audio = generate_with_bark(prompt_text)
    audio = normalize_audio(audio)
    
    # Save as numpy array for use as history_prompt
    # Bark expects history_prompt as a numpy array or string path
    prompt_path = f"/tmp/bark_prompt_{story_id}.npz"
    np.savez(prompt_path, audio=audio)
    
    return audio


def main():
    story_id = sys.argv[1] if len(sys.argv) > 1 else 'kolobok'
    page_arg = sys.argv[2] if len(sys.argv) > 2 else None  # optional: single page number (1-based)
    
    pages = STORIES.get(story_id)
    if not pages:
        print(f"Unknown story: {story_id}")
        print(f"Available: {', '.join(STORIES.keys())}")
        sys.exit(1)
    
    if page_arg:
        pages_to_gen = [int(page_arg) - 1]  # Convert to 0-based
    else:
        pages_to_gen = list(range(len(pages)))
    
    os.makedirs(AUDIO_DIR, exist_ok=True)
    
    total_pages = len(list(pages_to_gen))
    print(f"\n🧠 Bark Neural Network Audio Generator (by Suno.ai)")
    print(f"📖 Story: {story_id} ({total_pages} pages)")
    print(f"🎵 Sample rate: {OUTPUT_SAMPLE_RATE}Hz, Bitrate: {OUTPUT_BITRATE}")
    print(f"⚠️ CPU mode — each page takes ~30-60 seconds\n")
    
    ok = fail = 0
    total_duration = 0
    total_time = 0
    
    for idx in pages_to_gen:
        text = pages[idx]
        page_num = idx + 1
        print(f"📄 Page {page_num}/{len(pages)}:")
        print(f"   Text: {text[:60]}...")
        
        try:
            path, size, duration = generate_page(story_id, page_num, text)
            total_duration += duration
            total_time += 0  # Already timed in function
            print(f"  ✅ {os.path.basename(path)} ({size//1024}KB, {duration:.1f}s)\n")
            ok += 1
        except Exception as e:
            print(f"  ❌ FAILED: {e}\n")
            fail += 1
    
    print(f"{'='*50}")
    print(f"✅ {ok} ok, {fail} failed")
    print(f"🎵 Total audio: {total_duration:.1f}s ({total_duration/60:.1f}min)")


if __name__ == "__main__":
    main()
