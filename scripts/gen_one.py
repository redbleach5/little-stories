#!/usr/bin/env python3
"""Generate one page: python gen_one.py <story_id> <page_num>"""
import asyncio
import edge_tts
import os
import sys
import importlib.util

spec = importlib.util.spec_from_file_location('s', '/home/z/my-project/scripts/generate-audio-ssml.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

story_id = sys.argv[1]
page_num = int(sys.argv[2])

text = m.STORIES[story_id][page_num - 1]
ssml = m.build_ssml(text)
filename = f"{story_id}_{page_num:02d}.mp3"
filepath = os.path.join(m.AUDIO_DIR, filename)

async def gen():
    c = edge_tts.Communicate(ssml, m.VOICE)
    await c.save(filepath)
    size = os.path.getsize(filepath)
    print(f"✓ {filename} ({size//1024}KB)")

asyncio.run(gen())
