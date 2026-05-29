#!/usr/bin/env python3
"""Generate high-quality Russian audio for fairy tales using Microsoft Edge Neural TTS.

Uses ru-RU-SvetlanaNeural (warm female voice) with SSML for expressive storytelling.
Replaces espeak-ng robotic voice with natural, warm narration.
"""

import asyncio
import os
import re
import edge_tts

AUDIO_DIR = "/home/z/my-project/public/audio"

# Voice settings for warm storytelling
VOICE = "ru-RU-SvetlanaNeural"
RATE = "-5%"      # Slightly slower for storytelling warmth
PITCH = "-2Hz"    # Slightly lower for a cozy, warm tone
VOLUME = "+10%"   # A bit louder for clarity

# Stories with full narrative text matching client-storage.ts
STORIES = {
    "kolobok": [
        "Жили-были дед да баба. Вот и просит дед:\n— Испеки мне, бабка, колобок!\nБабка по сусекам поскребла, по амбару помела, и набралось муки горсти две.",
        "Замесила бабка тесто, испекла колобок и поставила на окошко простывать. Колобок полежал-полежал, да и покатился — с окна на завалинку, с завалинки на травку, с травки на дорожку.",
        "Катится колобок по дороге, а навстречу ему заяц:\n— Колобок, колобок, я тебя съем!\n— Не ешь меня, зайка, я тебе песенку спою!",
        "И запел колобок:\n«Я колобок, колобок,\nПо амбару метён, по сусекам скребён,\nЯ от дедушки ушёл, я от бабушки ушёл,\nЯ от зайца ушёл...»",
        "Покатился колобок дальше. Навстречу ему волк:\n— Колобок, колобок, я тебя съём!\n— Не ешь меня, серый волк, я тебе песенку спою!",
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
        "Позвала Жучка кошку:\n— Кошка, помоги репку тянуть!\nКошка за Жучку, Жучку за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!",
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


def text_to_ssml(text: str) -> str:
    """Convert plain fairy tale text to SSML with expressive pauses and prosody.

    Adds:
    - Natural pauses at dialogue boundaries (em-dash —)
    - Longer pauses at sentence endings
    - Short pauses at commas within dialogue
    - Slight slow-down for quoted speech and songs
    - Emphasis on exclamation marks
    """
    # Escape XML special characters
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")

    # Split by lines to handle structure
    lines = text.split("\n")
    ssml_parts = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check if this line starts with em-dash (dialogue)
        if line.startswith("—") or line.startswith("–") or line.startswith("-"):
            # This is dialogue - add a pause before it and slight emphasis
            ssml_parts.append(f'<break time="400ms"/>')
            # Dialogue gets slightly slower rate and more expression
            ssml_parts.append(f'<prosody rate="-8%">{line}</prosody>')
        elif line.startswith("«") and "»" in line:
            # This is a quoted section (like a song) - slower, more melodic
            ssml_parts.append(f'<break time="300ms"/>')
            ssml_parts.append(f'<prosody rate="-12%" pitch="+3Hz">{line}</prosody>')
        else:
            # Narrative text - add pauses at sentence endings
            # Replace sentence-ending punctuation with punctuation + pause
            processed = line
            # Add pause after exclamation marks (excited moments)
            processed = re.sub(r'!\s', '!<break time="350ms"/>', processed)
            # Add pause after question marks
            processed = re.sub(r'\?\s', '?<break time="400ms"/>', processed)
            # Add pause after periods (but not in abbreviations)
            processed = re.sub(r'\.\s', '.<break time="300ms"/>', processed)
            # Add pause after ellipsis (dramatic pause)
            processed = processed.replace("...", "...<break time=\"500ms\"/>")
            # Add shorter pause after commas in lists
            processed = re.sub(r',\s', ',<break time="150ms"/>', processed)
            # Add pause before em-dash (dialogue start within line)
            processed = re.sub(r'\s—\s', '<break time="400ms"/>—', processed)

            ssml_parts.append(processed)

    # Add a gentle closing pause
    ssml_parts.append('<break time="300ms"/>')

    ssml_body = "\n".join(ssml_parts)

    return f"""<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="{RATE}" pitch="{PITCH}" volume="{VOLUME}">
{ssml_body}
</prosody>
</speak>"""


async def generate_single(story_id: str, page_num: int, text: str, force: bool = False) -> tuple[str, int]:
    """Generate a single audio file using Edge TTS neural voice."""
    filename = f"{story_id}_{page_num:02d}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)

    if os.path.exists(filepath) and not force:
        size = os.path.getsize(filepath)
        return filename, size

    ssml = text_to_ssml(text)

    communicate = edge_tts.Communicate(ssml, VOICE)
    await communicate.save(filepath)

    size = os.path.getsize(filepath)
    return filename, size


async def generate_all(force: bool = False):
    """Generate all audio files for all stories."""
    os.makedirs(AUDIO_DIR, exist_ok=True)

    total = 0
    total_size = 0
    failed = 0

    for story_id, pages in STORIES.items():
        print(f"\n📖 Generating audio for: {story_id}")
        for i, text in enumerate(pages):
            try:
                filename, size = await generate_single(story_id, i + 1, text, force=force)
                print(f"  ✓ Page {i+1}: {filename} ({size//1024}KB)")
                total += 1
                total_size += size
            except Exception as e:
                print(f"  ✗ Page {i+1}: FAILED - {e}")
                failed += 1

    print(f"\n✅ Generated {total} audio files")
    if failed:
        print(f"⚠️  Failed: {failed}")
    print(f"📦 Total audio size: {total_size // 1024}KB ({total_size / (1024*1024):.1f}MB)")
    print(f"🎙️  Voice: {VOICE} (Neural TTS)")


if __name__ == "__main__":
    import sys
    force = "--force" in sys.argv
    asyncio.run(generate_all(force=force))
