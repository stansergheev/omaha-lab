#!/usr/bin/env python3
"""Builds the two pages from web/: dist/omaha-lab.html (Claude artifact) and android/assets/index.html (Android app)."""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
core = (root / "web/core.js").read_text()
page = (root / "web/app.html").read_text().replace("/*CORE*/", core)

(root / "dist").mkdir(exist_ok=True)
(root / "dist/omaha-lab.html").write_text(page)

app = page.replace("<script>\n", '<script src="reader.bundle.js"></script>\n<script>\n', 1)
head = ('<!doctype html><html lang="ru"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="color-scheme" content="light dark"></head><body>\n')
(root / "android/assets").mkdir(exist_ok=True)
(root / "android/assets/index.html").write_text(head + app + "\n</body></html>\n")
print("Wrote dist/omaha-lab.html and android/assets/index.html")
