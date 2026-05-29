#!/usr/bin/env python3
"""Generate a single page from the storyteller system. Usage: python tell_one.py <story> <page>"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from storyteller import STORIES_SSML, generate_page

story_id = sys.argv[1]
page_num = int(sys.argv[2])

builder = STORIES_SSML[story_id]
pages = builder()

if page_num < 1 or page_num > len(pages):
    print(f"Invalid page {page_num}, story has {len(pages)} pages")
    sys.exit(1)

asyncio.run(generate_page(story_id, page_num, pages[page_num - 1]))
