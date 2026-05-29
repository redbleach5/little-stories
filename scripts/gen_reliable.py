#!/usr/bin/env python3
"""Generate ALL audio pages one by one with SSML. Robust, retries on failure."""
import asyncio
import edge_tts
import os
import importlib.util
import time

# Load the SSML module
spec = importlib.util.spec_from_file_location('ssml_gen', os.path.join(os.path.dirname(__file__), 'generate-audio-ssml.py'))
ssml_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ssml_mod)

AUDIO_DIR = ssml_mod.AUDIO_DIR
VOICE = ssml_mod.VOICE
STORIES = ssml_mod.STORIES
build_ssml = ssml_mod.build_ssml

MAX_RETRIES = 3
TIMEOUT_PER_PAGE = 45  # seconds


async def generate_page(story_id: str, page_num: int, force: bool = False) -> bool:
    """Generate a single page. Returns True on success."""
    filename = f"{story_id}_{page_num:02d}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)

    # Skip if exists and non-empty and not forced
    if not force and os.path.exists(filepath) and os.path.getsize(filepath) > 0:
        size = os.path.getsize(filepath)
        print(f"  ⏩ Page {page_num}: exists ({size//1024}KB)")
        return True

    text = STORIES[story_id][page_num - 1]
    ssml = build_ssml(text)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            communicate = edge_tts.Communicate(ssml, VOICE)
            await asyncio.wait_for(communicate.save(filepath), timeout=TIMEOUT_PER_PAGE)
            size = os.path.getsize(filepath)
            if size > 0:
                print(f"  ✓ Page {page_num}: {filename} ({size//1024}KB)")
                return True
            else:
                print(f"  ✗ Page {page_num}: empty file, retry {attempt}/{MAX_RETRIES}")
                os.remove(filepath) if os.path.exists(filepath) else None
        except asyncio.TimeoutError:
            print(f"  ✗ Page {page_num}: timeout, retry {attempt}/{MAX_RETRIES}")
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            print(f"  ✗ Page {page_num}: {e}, retry {attempt}/{MAX_RETRIES}")
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except:
                    pass

        await asyncio.sleep(2)

    print(f"  ❌ Page {page_num}: FAILED after {MAX_RETRIES} attempts")
    return False


async def main():
    import sys
    story_filter = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else None
    force = "--force" in sys.argv

    os.makedirs(AUDIO_DIR, exist_ok=True)

    total_ok = 0
    total_fail = 0

    for story_id, pages in STORIES.items():
        if story_filter and story_id != story_filter:
            continue
        print(f"\n📖 {story_id} ({len(pages)} pages)")
        for i in range(len(pages)):
            ok = await generate_page(story_id, i + 1, force=force)
            if ok:
                total_ok += 1
            else:
                total_fail += 1
            # Small delay between pages to avoid rate limiting
            await asyncio.sleep(1)

    # Summary
    total_size = 0
    total_files = 0
    for f in os.listdir(AUDIO_DIR):
        if f.endswith(".mp3") and os.path.getsize(os.path.join(AUDIO_DIR, f)) > 0:
            total_size += os.path.getsize(os.path.join(AUDIO_DIR, f))
            total_files += 1

    print(f"\n{'='*50}")
    print(f"✅ OK: {total_ok}  ❌ Failed: {total_fail}")
    print(f"📦 {total_files} files, {total_size // 1024}KB ({total_size / (1024*1024):.1f}MB)")
    print(f"🎙️  Voice: {VOICE}")
    print(f"🎭  SSML: Full storytelling direction")


if __name__ == "__main__":
    asyncio.run(main())
