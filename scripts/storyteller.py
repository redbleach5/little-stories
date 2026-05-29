#!/usr/bin/env python3
"""
Professional Russian Fairy Tale Narration Generator
====================================================

Philosophy: Each page is a mini-performance, not text-to-speech.

Voice: ru-RU-DmitryNeural (deep, warm male — traditional Russian storyteller)

Key techniques:
- Character voice differentiation via prosody shifts
- Emotional arc pacing (slow opening → steady middle → dramatic climax → warm ending)
- "Сказ" rhythm — the characteristic Russian fairy tale cadence
- Post-processing: warmth EQ, gentle compression, subtle room reverb, loudness normalization
"""

import asyncio
import os
import re
import subprocess
import edge_tts

AUDIO_DIR = "/home/z/my-project/public/audio"
VOICE = "ru-RU-DmitryNeural"

# ── Character Voice Profiles ─────────────────────────────────────────────
# Each character gets a distinct prosody: pitch, rate, volume shift
# Based on Russian fairy tale storytelling tradition

CHARACTERS = {
    # Narrator: warm, measured, authoritative — the "сказочник"
    "narrator": {"pitch": "+0Hz", "rate": "-5%", "volume": "+0%"},

    # Bear: very low, slow, rumbling
    "bear": {"pitch": "-8Hz", "rate": "-20%", "volume": "+5%"},

    # Wolf: low, slightly gruff, threatening
    "wolf": {"pitch": "-4Hz", "rate": "-10%", "volume": "+8%"},

    # Fox: higher, melodic, sly — slight singsong
    "fox": {"pitch": "+6Hz", "rate": "+5%", "volume": "+0%"},

    # Hare: high, quick, nervous
    "hare": {"pitch": "+10Hz", "rate": "+15%", "volume": "-5%"},

    # Mouse: very high, very quick, squeaky
    "mouse": {"pitch": "+14Hz", "rate": "+20%", "volume": "-10%"},

    # Frog: mid-high, bouncy
    "frog": {"pitch": "+4Hz", "rate": "+5%", "volume": "-3%"},

    # Ded (Grandfather): low, slow, grumbling
    "ded": {"pitch": "-3Hz", "rate": "-8%", "volume": "+2%"},

    # Babka (Grandmother): mid, warm, matronly
    "babka": {"pitch": "+2Hz", "rate": "-5%", "volume": "+2%"},

    # Masha: high, bright, young girl
    "masha": {"pitch": "+8Hz", "rate": "+5%", "volume": "+0%"},

    # Kolobok: cheerful, confident, singsong
    "kolobok": {"pitch": "+5Hz", "rate": "+0%", "volume": "+3%"},

    # Ryaba (Hen): calm, matter-of-fact, reassuring
    "ryaba": {"pitch": "+3Hz", "rate": "-3%", "volume": "+0%"},

    # Generic child
    "child": {"pitch": "+6Hz", "rate": "+8%", "volume": "-2%"},
}


def char_prosody(character: str) -> str:
    """Generate <prosody> opening tag for a character."""
    c = CHARACTERS.get(character, CHARACTERS["narrator"])
    return f'<prosody rate="{c["rate"]}" pitch="{c["pitch"]}" volume="{c["volume"]}">'


def char_prosody_close() -> str:
    """Close prosody tag."""
    return "</prosody>"


# ── SSML Builder — Per-Page Storytelling Direction ────────────────────────

def build_kolobok_ssml() -> list[str]:
    """Колобок — each page directed individually."""
    return [
        # Page 1: Opening — calm, warm, inviting
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Жили-были дед да баба.<break time="400ms"/>
Вот и просит дед:<break time="450ms"/>
{char_prosody("ded")}— Испеки мне, бабка, колобок!{char_prosody_close()}<break time="400ms"/>
Бабка по сусекам поскребла,<break time="200ms"/> по амбару помела,<break time="200ms"/>
и набралось муки горсти две.<break time="350ms"/>
</prosody>
</speak>''',

        # Page 2: Action — slightly faster, rolling rhythm
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-3%" pitch="+0Hz" volume="+5%">
Замесила бабка тесто,<break time="200ms"/> испекла колобок<break time="250ms"/>
и поставила на окошко простывать.<break time="450ms"/>
Колобок полежал-полежал,<break time="300ms"/>
да и покатился<break time="200ms"/>
— с окна на завалинку,<break time="180ms"/>
с завалинки на травку,<break time="180ms"/>
с травки на дорожку.<break time="400ms"/>
</prosody>
</speak>''',

        # Page 3: Meeting the hare — tension then relief
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-3%" pitch="+0Hz" volume="+5%">
Катится колобок по дороге,<break time="300ms"/>
а навстречу ему заяц:<break time="450ms"/>
{char_prosody("hare")}— Колобок, колобок, я тебя съем!{char_prosody_close()}<break time="400ms"/>
{char_prosody("kolobok")}— Не ешь меня, зайка, я тебе песенку спою!{char_prosody_close()}<break time="350ms"/>
</prosody>
</speak>''',

        # Page 4: Kolobok's song — cheerful, singsong
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
И запел колобок:<break time="500ms"/>
{char_prosody("kolobok")}
<prosody rate="-12%" pitch="+4Hz" volume="+3%">
«Я колобок, колобок,<break time="300ms"/>
По амбару метён, по сусекам скребён,<break time="300ms"/>
Я от дедушки ушёл,<break time="200ms"/> я от бабушки ушёл,<break time="250ms"/>
Я от зайца ушёл...»<break time="400ms"/>
</prosody>
{char_prosody_close()}
</prosody>
</speak>''',

        # Page 5: Wolf encounter — more threatening
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-4%" pitch="+0Hz" volume="+5%">
Покатился колобок дальше.<break time="400ms"/>
Навстречу ему волк:<break time="500ms"/>
{char_prosody("wolf")}— Колобок, колобок, я тебя съем!{char_prosody_close()}<break time="400ms"/>
{char_prosody("kolobok")}— Не ешь меня, серый волк, я тебе песенку спою!{char_prosody_close()}<break time="350ms"/>
</prosody>
</speak>''',

        # Page 6: Song again — more confident
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-4%" pitch="+0Hz" volume="+5%">
И запел колобок:<break time="500ms"/>
{char_prosody("kolobok")}
<prosody rate="-10%" pitch="+4Hz" volume="+3%">
«Я колобок, колобок,<break time="300ms"/>
Я от дедушки ушёл,<break time="200ms"/> я от бабушки ушёл,<break time="250ms"/>
Я от зайца ушёл,<break time="200ms"/> я от волка ушёл...»<break time="400ms"/>
</prosody>
{char_prosody_close()}
И покатился дальше.<break time="350ms"/>
</prosody>
</speak>''',

        # Page 7: Bear — deep, slow
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Навстречу ему медведь:<break time="500ms"/>
{char_prosody("bear")}— Колобок, колобок, я тебя съем!{char_prosody_close()}<break time="450ms"/>
{char_prosody("kolobok")}— Не ешь меня, мишка, я тебе песенку спою!{char_prosody_close()}<break time="350ms"/>
</prosody>
</speak>''',

        # Page 8: Song — even more triumphant
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
И запел колобок:<break time="500ms"/>
{char_prosody("kolobok")}
<prosody rate="-10%" pitch="+4Hz" volume="+5%">
«Я колобок, колобок,<break time="300ms"/>
Я от дедушки ушёл,<break time="200ms"/> я от бабушки ушёл,<break time="250ms"/>
Я от зайца ушёл,<break time="200ms"/> я от волка ушёл,<break time="200ms"/> я от медведя ушёл...»<break time="500ms"/>
</prosody>
{char_prosody_close()}
</prosody>
</speak>''',

        # Page 9: Fox — sly, sweet, dangerous
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Покатился колобок дальше.<break time="400ms"/>
Навстречу ему лиса:<break time="500ms"/>
{char_prosody("fox")}— Здравствуй, колобок!<break time="300ms"/> Какой ты пригожий!{char_prosody_close()}<break time="400ms"/>
{char_prosody("kolobok")}— А я от всех ушёл!{char_prosody_close()}<break time="400ms"/>
</prosody>
</speak>''',

        # Page 10: Climax — dramatic, then sudden
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
А лиса говорит:<break time="400ms"/>
{char_prosody("fox")}
<prosody rate="-15%" volume="-5%">— Сядь ко мне на носок,<break time="300ms"/> да спой ещё разок!</prosody>
{char_prosody_close()}<break time="600ms"/>
Колобок прыг лисе на нос<break time="500ms"/>
<prosody rate="-20%" volume="+10%">— а лиса его — ам!</prosody><break time="600ms"/>
<prosody rate="-10%" volume="-10%">— и съела!</prosody><break time="500ms"/>
</prosody>
</speak>''',
    ]


def build_teremok_ssml() -> list[str]:
    """Теремок — repetitive structure with progressive animal voices."""
    pages = []

    # Page 1: Opening — dreamy, setting the scene
    pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-6%" pitch="+0Hz" volume="+5%">
Стоит в поле теремок-теремок.<break time="400ms"/>
Он не низок,<break time="200ms"/> не высок,<break time="200ms"/> не высок.<break time="500ms"/>
Бежит мимо мышка-норушка.<break time="400ms"/>
Увидела теремок,<break time="250ms"/> остановилась<break time="250ms"/>
и спрашивает:<break time="450ms"/>
{char_prosody("mouse")}— Терем-теремок! Кто в тереме живёт?{char_prosody_close()}<break time="500ms"/>
</prosody>
</speak>''')

    # Page 2: Mouse + Frog
    pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Никто не отзывается.<break time="500ms"/>
Вошла мышка в теремок и стала там жить.<break time="500ms"/>
Прибежала лягушка-квакушка и спрашивает:<break time="400ms"/>
{char_prosody("frog")}— Терем-теремок! Кто в тереме живёт?{char_prosody_close()}<break time="400ms"/>
{char_prosody("mouse")}— Я, мышка-норушка! А ты кто?{char_prosody_close()}<break time="350ms"/>
{char_prosody("frog")}— А я лягушка-квакушка!{char_prosody_close()}<break time="350ms"/>
</prosody>
</speak>''')

    # Page 3: + Hare
    pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Стали они вдвоём жить.<break time="400ms"/>
Бежит мимо зайчик-побегайчик.<break time="350ms"/>
Остановился и спрашивает:<break time="400ms"/>
{char_prosody("hare")}— Терем-теремок! Кто в тереме живёт?{char_prosody_close()}<break time="350ms"/>
{char_prosody("mouse")}— Я, мышка-норушка!{char_prosody_close()}<break time="250ms"/>
{char_prosody("frog")}Я, лягушка-квакушка! А ты кто?{char_prosody_close()}<break time="350ms"/>
{char_prosody("hare")}— А я зайчик-побегайчик!{char_prosody_close()}<break time="350ms"/>
</prosody>
</speak>''')

    # Page 4: + Fox
    pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Стали они втроём жить.<break time="400ms"/>
Идёт мимо лисичка-сестричка.<break time="350ms"/>
Постучала в окошко и спрашивает:<break time="450ms"/>
{char_prosody("fox")}— Терем-теремок! Кто в тереме живёт?{char_prosody_close()}<break time="500ms"/>
</prosody>
</speak>''')

    # Page 5: Fox response + Wolf arrives
    pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
{char_prosody("mouse")}— Я, мышка-норушка!{char_prosody_close()}<break time="200ms"/>
{char_prosody("frog")}Я, лягушка-квакушка!{char_prosody_close()}<break time="200ms"/>
{char_prosody("hare")}Я, зайчик-побегайчик! А ты кто?{char_prosody_close()}<break time="350ms"/>
{char_prosody("fox")}— А я лисичка-сестричка!{char_prosody_close()}<break time="400ms"/>
Стали они вчетвером жить.<break time="400ms"/>
Пришёл волчок-серый бочок.<break time="350ms"/>
</prosody>
</speak>''')

    # Page 6: Wolf asks
    pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
{char_prosody("wolf")}— Терем-теремок! Кто в тереме живёт?{char_prosody_close()}<break time="400ms"/>
{char_prosody("mouse")}— Я, мышка-норушка!{char_prosody_close()}<break time="200ms"/>
{char_prosody("frog")}Я, лягушка-квакушка!{char_prosody_close()}<break time="200ms"/>
{char_prosody("hare")}Я, зайчик-побегайчик!{char_prosody_close()}<break time="200ms"/>
{char_prosody("fox")}Я, лисичка-сестричка! А ты кто?{char_prosody_close()}<break time="350ms"/>
{char_prosody("wolf")}— А я волчок-серый бочок!{char_prosody_close()}<break time="350ms"/>
</prosody>
</speak>''')

    # Page 7: Bear approaches — tension building
    pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Стали они впятером жить.<break time="400ms"/>
Вот идут они все и видят<break time="300ms"/>
<prosody rate="-10%">— идёт медведь косолапый.</prosody><break time="500ms"/>
{char_prosody("bear")}— Терем-теремок! Кто в тереме живёт?{char_prosody_close()}<break time="500ms"/>
</prosody>
</speak>''')

    # Page 8: Bear introduces himself — dramatic
    pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
{char_prosody("mouse")}— Я, мышка-норушка!{char_prosody_close()}<break time="200ms"/>
{char_prosody("frog")}Я, лягушка-квакушка!{char_prosody_close()}<break time="200ms"/>
{char_prosody("hare")}Я, зайчик-побегайчик!{char_prosody_close()}<break time="200ms"/>
{char_prosody("fox")}Я, лисичка-сестричка!{char_prosody_close()}<break time="200ms"/>
{char_prosody("wolf")}Я, волчок-серый бочок! А ты кто?{char_prosody_close()}<break time="400ms"/>
{char_prosody("bear")}— А я медведь косолапый!{char_prosody_close()}<break time="400ms"/>
</prosody>
</speak>''')

    # Page 9: Climax — house collapses
    pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-3%" pitch="+0Hz" volume="+5%">
Медведь влез на крышу<break time="300ms"/>
и давай топтать<break time="400ms"/>
<prosody rate="+5%" volume="+10%">— теремок и развалился!</prosody><break time="500ms"/>
Еле-еле все успели выскочить.<break time="400ms"/>
</prosody>
</speak>''')

    # Page 10: Happy ending — warm, gentle resolution
    pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-8%" pitch="+0Hz" volume="+5%">
Потом все вместе<break time="250ms"/>
построили новый теремок<break time="300ms"/>
— большой и просторный.<break time="500ms"/>
<prosody rate="-5%" pitch="+2Hz">И стали жить-поживать<break time="300ms"/> да добра наживать!</prosody><break time="500ms"/>
</prosody>
</speak>''')

    return pages


def build_repka_ssml() -> list[str]:
    """Репка — building rhythm with each pull."""
    pages = []

    # Page 1: Planting — calm opening
    pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Посадил дед репку.<break time="400ms"/>
Выросла репка <prosody rate="-15%" volume="+5%">большая-пребольшая.</prosody><break time="500ms"/>
Стал дед репку из земли тащить:<break time="300ms"/>
тянет-потянет,<break time="350ms"/>
<prosody rate="-10%">вытянуть не может!</prosody><break time="500ms"/>
</prosody>
</speak>''')

    # Pages 2-6: Progressive pulling — each gets more rhythmic
    pull_textes = [
        ("бабку", "Бабка за дедку, дедка за репку", "ded"),
        ("внучку", "Внучка за бабку, бабка за дедку, дедка за репку", "child"),
        ("Жучку", "Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку", "narrator"),
        ("кошку", "Кошка за Жучку, Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку", "narrator"),
        ("мышку", "Мышка за кошку, кошка за Жучку, Жучка за внучку, бабка за дедку, дедка за репку", "narrator"),
    ]

    char_map = {"ded": "ded", "child": "child", "narrator": "narrator"}

    for i, (who, chain, asker_char) in enumerate(pull_textes):
        char_tag = char_map.get(asker_char, "narrator")
        is_last = (i == 4)  # Mouse page — the successful pull!

        if is_last:
            pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Позвала кошка мышку:<break time="350ms"/>
{char_prosody("mouse")}— Мышка, помоги репку тянуть!{char_prosody_close()}<break time="400ms"/>
Мышка за кошку,<break time="200ms"/> кошка за Жучку,<break time="200ms"/>
Жучка за внучку,<break time="200ms"/> бабка за дедку,<break time="200ms"/> дедка за репку<break time="350ms"/>
<prosody rate="-10%">— тянут-потянут...</prosody><break time="700ms"/>
<prosody rate="+10%" volume="+15%">Вытянули репку!</prosody><break time="500ms"/>
</prosody>
</speak>''')
        else:
            call_char = "babka" if i == 0 else "child" if i == 1 else "narrator"
            call_prosody = char_prosody("ded" if i == 0 else "babka" if i == 1 else "child" if i == 2 else "narrator")
            pages.append(f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Позвал{"а" if i > 0 else ""} {"дед" if i == 0 else "бабка" if i == 1 else "внучка" if i == 2 else "Жучка" if i == 3 else "кошка"} {who}:<break time="350ms"/>
{call_prosody}— {"Бабка" if i == 0 else "Внучка" if i == 1 else "Жучка" if i == 2 else "Кошка" if i == 3 else ""}, помоги репку тянуть!{char_prosody_close()}<break time="400ms"/>
{chain}<break time="300ms"/>
— тянут-потянут,<break time="350ms"/>
вытянуть не могут!<break time="400ms"/>
</prosody>
</speak>''')

    return pages


def build_ryaba_ssml() -> list[str]:
    """Курочка Ряба — gentle, warm, with a surprise twist."""
    return [
        # Page 1: Opening + golden egg
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-6%" pitch="+0Hz" volume="+5%">
Жили-были дед да баба.<break time="400ms"/>
И была у них курочка Ряба.<break time="500ms"/>
Снесла курочка яичко<break time="300ms"/>
— не простое,<break time="350ms"/>
<prosody rate="-15%" volume="+10%">а золотое!</prosody><break time="500ms"/>
</prosody>
</speak>''',

        # Page 2: Trying to break — comic
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-4%" pitch="+0Hz" volume="+5%">
{char_prosody("ded")}Дед бил-бил — не разбил.{char_prosody_close()}<break time="350ms"/>
{char_prosody("babka")}Баба била-била — не разбила.{char_prosody_close()}<break time="400ms"/>
Яичко было крепкое,<break time="250ms"/> золотое<break time="300ms"/>
— никак не ломалось!<break time="400ms"/>
</prosody>
</speak>''',

        # Page 3: The break — dramatic
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-3%" pitch="+0Hz" volume="+5%">
Мышка бежала,<break time="250ms"/> хвостиком махнула<break time="350ms"/>
<prosody rate="-15%" volume="+8%">— яичко упало и разбилось!</prosody><break time="600ms"/>
<prosody rate="-8%" volume="-5%">Плачет дед,<break time="300ms"/> плачет баба...</prosody><break time="500ms"/>
</prosody>
</speak>''',

        # Page 4: Resolution — warm, comforting
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-7%" pitch="+0Hz" volume="+5%">
А курочка Ряба говорит:<break time="400ms"/>
{char_prosody("ryaba")}
<prosody rate="-5%">— Не плачь, дед!<break time="300ms"/> Не плачь, баба!</prosody><break time="400ms"/>
<prosody rate="-3%">Я снесу вам яичко не золотое, а простое!</prosody>
{char_prosody_close()}<break time="500ms"/>
И снесла курочка простое яичко.<break time="400ms"/>
<prosody rate="-10%" pitch="+2Hz">Всем было радость!</prosody><break time="500ms"/>
</prosody>
</speak>''',
    ]


def build_masha_ssml() -> list[str]:
    """Маша и Медведь — adventure story with dramatic moments."""
    return [
        # Page 1: Opening
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-6%" pitch="+0Hz" volume="+5%">
Жили-были дедушка да бабушка.<break time="400ms"/>
Была у них внучка Машенька.<break time="500ms"/>
Собрались раз подружки в лес<break time="200ms"/>
по грибы да по ягоды.<break time="400ms"/>
Пришли звать с собой и Машеньку.<break time="400ms"/>
</prosody>
</speak>''',

        # Page 2: Persuading grandparents
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Дедушка с бабушкой не хотели её отпускать,<break time="300ms"/>
но Машенька упросила:<break time="400ms"/>
{char_prosody("masha")}«Пустили!»{char_prosody_close()}<break time="350ms"/>
— и побежала с подружками в лес.<break time="400ms"/>
</prosody>
</speak>''',

        # Page 3: Getting lost — worry
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-6%" pitch="+0Hz" volume="+5%">
Машенька деревце за деревце,<break time="200ms"/>
кустик за кустик<break time="300ms"/>
— и дальше от подружек ушла.<break time="500ms"/>
<prosody rate="-8%">Стала кричать — никто не отзывается.</prosody><break time="400ms"/>
<prosody rate="-10%">Стала аукаться — никто не откликается.</prosody><break time="500ms"/>
</prosody>
</speak>''',

        # Page 4: Finding the hut — suspense
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Шла, шла Машенька<break time="300ms"/>
и вышла к избушке.<break time="400ms"/>
Дверь открыта.<break time="350ms"/>
Вошла она в избушку,<break time="250ms"/> села на лавку.<break time="500ms"/>
А в той избушке<break time="300ms"/>
<prosody rate="-15%" volume="+10%">жил медведь!</prosody><break time="500ms"/>
</prosody>
</speak>''',

        # Page 5: Bear captures — dramatic
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Вернулся медведь и обрадовался:<break time="400ms"/>
{char_prosody("bear")}«Вот мне гостинец!<break time="300ms"/>
Буду тебя держать, не пущу домой.<break time="300ms"/>
Будешь мне печь топить,<break time="200ms"/> кашу варить,<break time="200ms"/> щи хлебать!»{char_prosody_close()}<break time="500ms"/>
<prosody rate="-8%" volume="-5%">Заплакала Машенька.</prosody><break time="400ms"/>
</prosody>
</speak>''',

        # Page 6: Living with bear — thoughtful
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-6%" pitch="+0Hz" volume="+5%">
Стала Машенька у медведя жить.<break time="400ms"/>
Медведь в лес пойдёт<break time="250ms"/>
— Машеньке наказывает:<break time="400ms"/>
{char_prosody("bear")}«Без меня из избушки не выходи!»{char_prosody_close()}<break time="500ms"/>
А Машенька всё думала,<break time="300ms"/>
как бы ей домой вернуться.<break time="400ms"/>
</prosody>
</speak>''',

        # Page 7: The plan! — excitement
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-3%" pitch="+0Hz" volume="+5%">
<prosody rate="-10%" volume="+5%">Придумала!</prosody><break time="500ms"/>
Испекла Машенька пирожки<break time="250ms"/>
и говорит медведю:<break time="400ms"/>
{char_prosody("masha")}— Отнеси бабушке с дедушке пирожки!<break time="300ms"/>
Я пирожки в короб положу,<break time="250ms"/> а ты снеси их!{char_prosody_close()}<break time="400ms"/>
Медведь согласился.<break time="350ms"/>
</prosody>
</speak>''',

        # Page 8: Hiding in the box — clever
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-4%" pitch="+0Hz" volume="+5%">
А Машенька сама в короб залезла,<break time="300ms"/>
а сверху пирожками закрылась.<break time="400ms"/>
Медведь взял короб<break time="250ms"/>
и пошёл в деревню.<break time="400ms"/>
</prosody>
</speak>''',

        # Page 9: The warning — fun, rhythmic
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-4%" pitch="+0Hz" volume="+5%">
Шёл медведь, устал,<break time="250ms"/>
захотел сесть и пирожок съесть.<break time="500ms"/>
А Машенька из короба кричит:<break time="400ms"/>
{char_prosody("masha")}
<prosody rate="+10%">— Вижу, вижу!</prosody><break time="300ms"/>
Не садись на пенёк,<break time="250ms"/> не ешь пирожок!<break time="300ms"/>
Неси бабушке,<break time="200ms"/> неси дедушке!</prosody>
{char_prosody_close()}<break time="400ms"/>
</prosody>
</speak>''',

        # Page 10: Happy ending — warm resolution
        f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">
<prosody rate="-5%" pitch="+0Hz" volume="+5%">
Медведь испугался<break time="250ms"/>
и пошёл быстрее.<break time="400ms"/>
Принёс короб в деревню.<break time="400ms"/>
Открыли бабушка с дедушкой короб<break time="350ms"/>
<prosody rate="-15%">— а там Машенька!</prosody><break time="600ms"/>
<prosody rate="-8%" pitch="+2Hz">Обрадовались все<break time="300ms"/>
и стали жить-поживать!</prosody><break time="500ms"/>
</prosody>
</speak>''',
    ]


# ── All stories ──────────────────────────────────────────────────────────

STORIES_SSML = {
    "kolobok": build_kolobok_ssml,
    "teremok": build_teremok_ssml,
    "repka": build_repka_ssml,
    "ryaba": build_ryaba_ssml,
    "masha": build_masha_ssml,
}


# ── Audio Post-Processing ────────────────────────────────────────────────

def post_process_audio(input_path: str, output_path: str) -> bool:
    """Apply professional audio post-processing chain:
    1. High-pass 80Hz (remove rumble)
    2. Low-pass 11kHz (remove TTS harshness)
    3. Warmth EQ +3dB @ 250Hz
    4. Presence EQ +2dB @ 3.5kHz
    5. Nasal cut -2dB @ 1.8kHz
    6. Gentle compression
    7. Subtle room reverb (aecho)
    8. Loudness normalization -20 LUFS (audiobook standard)
    """
    try:
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-af",
            "highpass=f=80,"
            "lowpass=f=11000,"
            "equalizer=f=250:t=q:w=1:g=+3,"
            "equalizer=f=3500:t=q:w=1.5:g=+2,"
            "equalizer=f=1800:t=q:w=1.5:g=-2,"
            "acompressor=threshold=-20dB:ratio=2.5:attack=5:release=50:makeup=2,"
            "aecho=0.8:0.88:40:0.12,"
            "loudnorm=I=-20:TP=-1.5:LRA=11",
            "-ar", "44100",
            "-codec:a", "libmp3lame",
            "-b:a", "64k",
            output_path
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=30)
        return result.returncode == 0
    except Exception as e:
        print(f"  Post-process error: {e}")
        return False


# ── Generation ───────────────────────────────────────────────────────────

async def generate_page(story_id: str, page_num: int, ssml: str) -> bool:
    """Generate a single page with TTS + post-processing."""
    filename = f"{story_id}_{page_num:02d}.mp3"
    raw_path = os.path.join(AUDIO_DIR, f"_raw_{filename}")
    final_path = os.path.join(AUDIO_DIR, filename)

    # Generate raw TTS
    try:
        communicate = edge_tts.Communicate(ssml, VOICE)
        await asyncio.wait_for(communicate.save(raw_path), timeout=60)

        if os.path.getsize(raw_path) == 0:
            print(f"  ✗ Page {page_num}: empty raw file")
            os.remove(raw_path)
            return False
    except asyncio.TimeoutError:
        print(f"  ✗ Page {page_num}: TTS timeout")
        if os.path.exists(raw_path):
            os.remove(raw_path)
        return False
    except Exception as e:
        print(f"  ✗ Page {page_num}: TTS error - {e}")
        return False

    # Post-process
    if post_process_audio(raw_path, final_path):
        os.remove(raw_path)
        size = os.path.getsize(final_path)
        print(f"  ✓ Page {page_num}: {filename} ({size//1024}KB) ✨ processed")
        return True
    else:
        # If post-processing fails, use raw file
        print(f"  ⚠ Page {page_num}: post-process failed, using raw")
        os.rename(raw_path, final_path)
        size = os.path.getsize(final_path)
        print(f"  ✓ Page {page_num}: {filename} ({size//1024}KB) (raw)")
        return True


async def generate_story(story_id: str) -> None:
    """Generate all pages for one story."""
    builder = STORIES_SSML.get(story_id)
    if not builder:
        print(f"Unknown story: {story_id}")
        return

    pages = builder()
    print(f"\n📖 {story_id} ({len(pages)} pages)")

    for i, ssml in enumerate(pages):
        ok = await generate_page(story_id, i + 1, ssml)
        if not ok:
            # Retry once
            print(f"  Retrying page {i+1}...")
            await asyncio.sleep(2)
            await generate_page(story_id, i + 1, ssml)
        await asyncio.sleep(1)


async def main():
    import sys
    story_filter = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else None

    os.makedirs(AUDIO_DIR, exist_ok=True)

    for story_id in STORIES_SSML:
        if story_filter and story_id != story_filter:
            continue
        await generate_story(story_id)

    # Summary
    total_size = 0
    total_files = 0
    for f in sorted(os.listdir(AUDIO_DIR)):
        if f.endswith(".mp3") and not f.startswith("_"):
            fp = os.path.join(AUDIO_DIR, f)
            if os.path.getsize(fp) > 0:
                total_size += os.path.getsize(fp)
                total_files += 1

    print(f"\n{'='*50}")
    print(f"📦 {total_files} files, {total_size // 1024}KB ({total_size / (1024*1024):.1f}MB)")
    print(f"🎙️  Voice: {VOICE} (male storyteller)")
    print(f"🎭  SSML: Character voices + storytelling direction")
    print(f"✨  Post: Warmth EQ + compression + room reverb + loudnorm")


if __name__ == "__main__":
    asyncio.run(main())
