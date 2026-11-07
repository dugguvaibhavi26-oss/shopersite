"""Screenshots every theme's live preview for the theme marketplace cards (public/theme-previews/<slug>.webp).

Run it with the dev server up (npm run dev) after adding or changing a theme:

    python scripts/theme-previews.py              # every theme
    python scripts/theme-previews.py theme07 f01  # just these

Needs Google Chrome and Pillow (pip install pillow). Set CHROME to Chrome's path if it isn't found.
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "theme-previews")
URL = os.environ.get("PREVIEW_BASE", "http://localhost:3000") + "/themes/preview/{}?shot=1"


def find_chrome():
    candidates = [
        os.environ.get("CHROME", ""),
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        shutil.which("google-chrome") or "",
        shutil.which("chromium") or "",
    ]
    return next((c for c in candidates if c and os.path.exists(c)), None)


def theme_slugs():
    src = open(os.path.join(ROOT, "src", "lib", "themes.ts"), encoding="utf-8").read()
    return re.findall(r'^\s+slug: "([^"]+)"', src, re.M)


def main():
    chrome = find_chrome()
    if not chrome:
        sys.exit("Chrome not found; set CHROME to its path.")
    slugs = sys.argv[1:] or theme_slugs()
    os.makedirs(OUT, exist_ok=True)
    profile = tempfile.mkdtemp(prefix="theme-shots-")
    png = os.path.join(profile, "shot.png")
    try:
        for slug in slugs:
            if os.path.exists(png):
                os.remove(png)
            cmd = [
                chrome,
                "--headless=new",
                f"--user-data-dir={profile}",
                "--hide-scrollbars",
                "--disable-gpu",
                "--window-size=1440,900",
                # long enough for photos and the sections' rise-in to finish
                "--virtual-time-budget=20000",
                f"--screenshot={png}",
                URL.format(slug),
            ]
            try:
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
            except subprocess.TimeoutExpired:
                print(slug, "timed out")
                continue
            if not os.path.exists(png):
                print(slug, "no screenshot")
                continue
            dest = os.path.join(OUT, f"{slug}.webp")
            Image.open(png).convert("RGB").resize((1200, 750), Image.LANCZOS).save(dest, "WEBP", quality=78, method=6)
            print(slug, os.path.getsize(dest) // 1024, "KB")
    finally:
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == "__main__":
    main()
