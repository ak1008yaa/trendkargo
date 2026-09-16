#!/usr/bin/env python3
"""
Trend Cargo - Automated Project Packager
Creates trendcargo-final.zip containing all production files.

Usage:
    python3 pack_project.py
"""

import os
import sys
import zipfile
from pathlib import Path

EXCLUDED_DIRS = {
    ".git", ".github", "__pycache__", ".idea", ".vscode",
    ".venv", "venv", "node_modules", "dist", "build", ".backup",
    "backend", "tools", "data", ".vercel", ".netlify",
}
EXCLUDED_FILES = {
    "trendcargo-final.zip", "pack_project.py", ".DS_Store",
    ".gitignore", "AGENTS.md",
}
EXCLUDED_EXTENSIONS = {".zip", ".pyc", ".log", ".bak"}


def should_include(file_name: str) -> bool:
    if file_name in EXCLUDED_FILES:
        return False
    if Path(file_name).suffix.lower() in EXCLUDED_EXTENSIONS:
        return False
    if file_name.endswith(".bak"):
        return False
    return True


def create_project_zip(output_filename: str = "trendcargo-final.zip") -> None:
    print("[*] Preparing project files for packaging...")
    file_count = 0

    with zipfile.ZipFile(output_filename, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("."):
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
            for file in files:
                if not should_include(file):
                    continue
                file_path = os.path.join(root, file)
                archive_path = os.path.relpath(file_path, ".")
                try:
                    zipf.write(file_path, archive_path)
                    print(f"  [+] Added: {archive_path}")
                    file_count += 1
                except OSError as err:
                    print(f"  [!] Skipped: {archive_path} — {err}", file=sys.stderr)

    print(f"\n✅ Packaging complete: {file_count} files included in '{output_filename}'.")


if __name__ == "__main__":
    create_project_zip()
