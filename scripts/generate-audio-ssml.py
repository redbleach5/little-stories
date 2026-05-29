#!/usr/bin/env python3
"""Generate expressive Russian fairy tale narration using Edge Neural TTS with SSML.

Key principles for storytelling narration:
1. Narration is calm and measured — slower than normal speech
2. Dialogue gets a brief pause before, slightly different energy
3. Songs/verses are slower and more melodic
4. Exclamation marks get emphasis and a longer pause after
5. Ellipsis gets a dramatic pause
6. Key emotional words get subtle emphasis
7. Repetitive structures (like "тянет-потянут") get rhythmic pacing
"""

import asyncio
import os
import re
import edge_tts

AUDIO_DIR = "/home/z/my-project/public/audio"

# ── Voice configuration ──────────────────────────────────────────────────
# SvetlanaNeural — warm female voice, good for maternal storytelling
# DmitryNeural — male voice, deeper, more traditional narrator feel
VOICE = "ru-RU-SvetlanaNeural"

# ── SSML Builder ─────────────────────────────────────────────────────────

def build_ssml(text: str) -> str:
    """Convert fairy tale text into rich SSML with storytelling direction.

    Handles:
    - \n— Dialogue lines (em-dash): pause before, slight prosody shift
    - \n«...» Quoted speech/songs: slower, higher pitch, musical feel
    - ! Exclamation: emphasis + longer pause
    - ? Question: rising pause
    - ... Ellipsis: dramatic pause (500ms+)
    - , Comma: short pause
    - . Period: standard sentence pause
    - Repetitive phrases: rhythmic pacing
    """
    # Escape XML entities FIRST (before any markup)
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")

    # Split text into structural blocks by newlines
    lines = text.split("\n")
    ssml_parts = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # ── Detect line type ───────────────────────────────────────

        is_dialogue = line.startswith("—") or line.startswith("–") or line.startswith("-")
        is_song = line.startswith("«") and "»" in line

        if is_dialogue:
            # DIALOGUE: pause before, slightly more animated
            ssml_parts.append(f'<break time="450ms"/>')
            # Dialogue is more lively — slightly faster rate, higher pitch
            processed = _process_punctuation(line)
            ssml_parts.append(
                f'<prosody rate="+2%" pitch="+2Hz" volume="+5%">{processed}</prosody>'
            )

        elif is_song:
            # SONG/VERSE: much slower, musical, higher pitch
            ssml_parts.append(f'<break time="500ms"/>')
            processed = _process_punctuation(line, is_song=True)
            ssml_parts.append(
                f'<prosody rate="-15%" pitch="+5Hz" volume="+3%">{processed}</prosody>'
            )

        else:
            # NARRATION: calm, measured storytelling pace
            processed = _process_punctuation(line)
            ssml_parts.append(processed)

    # Add a gentle closing pause
    ssml_parts.append('<break time="400ms"/>')

    body = "\n".join(ssml_parts)

    # Wrap in root prosody — overall storytelling is slower and warmer
    return (
        f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">\n'
        f'<prosody rate="-8%" pitch="-1Hz" volume="+5%">\n'
        f'{body}\n'
        f'</prosody>\n'
        f'</speak>'
    )


def _process_punctuation(text: str, is_song: bool = False) -> str:
    """Add SSML breaks and emphasis based on punctuation."""
    result = text

    # 1. Ellipsis — dramatic pause (most important, process first)
    result = result.replace("...", '<break time="600ms"/>')

    # 2. Exclamation — excitement + pause
    if is_song:
        result = re.sub(r'!\s', '!<break time="350ms"/>', result)
    else:
        result = re.sub(
            r'!\s',
            '!<break time="400ms"/></prosody><prosody rate="+0%" pitch="+0Hz"><break time="50ms"/>',
            result,
        )

    # 3. Question — thoughtful pause
    result = re.sub(r'\?\s', '?<break time="450ms"/>', result)

    # 4. Period — standard sentence boundary pause
    # Longer for song lines
    period_pause = "400ms" if is_song else "350ms"
    result = re.sub(r'\.\s', f'.<break time="{period_pause}"/>', result)
    # Period at end of line
    result = re.sub(r'\.$', f'.<break time="{period_pause}"/>', result)

    # 5. Comma — brief pause (rhythm)
    comma_pause = "200ms" if is_song else "180ms"
    result = re.sub(r',\s', f',<break time="{comma_pause}"/>', result)

    # 6. Em-dash within line (dialogue starts mid-line)
    result = re.sub(
        r'\s(—|–)\s',
        '<break time="400ms"/>—',
        result,
    )

    # 7. Key storytelling words — subtle emphasis
    emphasis_words = [
        "большая-пребольшая",
        "ам!",
        "прыг",
        "тихо",
        "вдруг",
        "косолапый",
        "серый",
    ]
    for word in emphasis_words:
        if word in result.lower():
            # Find the actual word with original case
            pattern = re.compile(re.escape(word), re.IGNORECASE)
            result = pattern.sub(
                lambda m: f'<emphasis level="moderate">{m.group()}</emphasis>',
                result,
            )

    return result


# ── Story texts (matching client-storage.ts exactly) ─────────────────────

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
        "Позвала Жучка кошку:\n— Кошка, помоги репку тянуть!\nКошка за Жучку, Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!",
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


async def generate_page(story_id: str, page_num: int, text: str) -> tuple[str, int]:
    """Generate a single audio file with full SSML direction."""
    filename = f"{story_id}_{page_num:02d}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)

    ssml = build_ssml(text)

    communicate = edge_tts.Communicate(ssml, VOICE)
    await communicate.save(filepath)

    size = os.path.getsize(filepath)
    return filename, size


async def generate_story(story_id: str, pages: list[str]) -> None:
    """Generate all pages for one story."""
    print(f"\n📖 {story_id}")
    for i, text in enumerate(pages):
        filename = f"{story_id}_{i+1:02d}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)
        try:
            ssml = build_ssml(text)
            communicate = edge_tts.Communicate(ssml, VOICE)
            await communicate.save(filepath)
            size = os.path.getsize(filepath)
            print(f"  ✓ Page {i+1}: {filename} ({size//1024}KB)")
        except Exception as e:
            print(f"  ✗ Page {i+1}: FAILED - {e}")


async def main():
    import sys
    story_filter = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != "--all" else None

    os.makedirs(AUDIO_DIR, exist_ok=True)

    for story_id, pages in STORIES.items():
        if story_filter and story_id != story_filter:
            continue
        await generate_story(story_id, pages)

    # Summary
    total_size = 0
    total_files = 0
    for f in sorted(os.listdir(AUDIO_DIR)):
        if f.endswith(".mp3"):
            total_size += os.path.getsize(os.path.join(AUDIO_DIR, f))
            total_files += 1
    print(f"\n✅ {total_files} files, {total_size // 1024}KB ({total_size / (1024*1024):.1f}MB)")
    print(f"🎙️  Voice: {VOICE}")
    print(f"🎭  SSML: Full storytelling direction with pauses, prosody, emphasis")


if __name__ == "__main__":
    asyncio.run(main())
