#!/usr/bin/env python3
"""Generate a single audio page with SSML. Usage: python gen_page.py <story> <page_number>"""
import asyncio
import sys
import os

# Import from the SSML generator
sys.path.insert(0, os.path.dirname(__file__))
from generate_audio_ssml import STORIES, build_ssml, VOICE, AUDIO_DIR
import edge_tts

async def main():
    if len(sys.argv) < 3:
        print("Usage: python gen_page.py <story_id> <page_num>")
        sys.exit(1)

    story_id = sys.argv[1]
    page_num = int(sys.argv[2])

    if story_id not in STORIES:
        print(f"Unknown story: {story_id}")
        sys.exit(1)

    pages = STORIES[story_id]
    if page_num < 1 or page_num > len(pages):
        print(f"Invalid page: {page_num} (story has {len(pages)} pages)")
        sys.exit(1)

    text = pages[page_num - 1]
    ssml = build_ssml(text)

    filename = f"{story_id}_{page_num:02d}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)

    communicate = edge_tts.Communicate(ssml, VOICE)
    await communicate.save(filepath)

    size = os.path.getsize(filepath)
    print(f"✓ {filename} ({size//1024}KB)")

asyncio.run(main())
