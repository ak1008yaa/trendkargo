
#!/usr/bin/env python3
"""
Trend Cargo - Automated Project Packager
Creates trendcargo-final.zip containing all production files.
Usage:
python3 pack_project.py
"""

import os
import zipfile

EXCLUDED_DIRS = {".git", ".github", "__pycache__", ".idea", ".vscode", ".venv", "node_modules"}
EXCLUDED_FILES = {"trendcargo-final.zip", "pack_project.py", ".DS_Store"}


def create_project_zip(output_filename: str = "trendcargo-final.zip") -> None:
print("[*] Preparing project files for packaging...")
file_count = 0

with zipfile.ZipFile(output_filename, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
        for file in files:
            if file in EXCLUDED_FILES or file.endswith(".zip"):
                continue
            file_path = os.path.join(root, file)
            archive_path = os.path.relpath(file_path, ".")
            zipf.write(file_path, archive_path)
            print(f"  [+] Added: {archive_path}")
            file_count += 1

print(f"\n✅ Packaging complete: {file_count} files were included in '{output_filename}'.")


if __name__ == "__main__":
create_project_zip()
