#!/usr/bin/env python
"""
Build Alice AI Ultra Pet for Windows
Run this script to create the executable
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(cmd, description):
    """Run command and report result"""
    print(f"\n{description}...")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        print(f"✗ {description} failed!")
        return False
    print(f"✓ {description} successful")
    return True

def main():
    print("=" * 60)
    print("Alice AI Ultra Pet - Windows Build")
    print("=" * 60)
    
    # Check if PyInstaller is installed
    try:
        import PyInstaller
        print("\n✓ PyInstaller found")
    except ImportError:
        print("\n⚠ PyInstaller not installed. Installing...")
        if not run_command(
            "python -m pip install pyinstaller",
            "Installing PyInstaller"
        ):
            return 1
    
    # Build executable
    print("\nBuilding executable...")
    if not run_command(
        "pyinstaller alice_pet.spec --noconfirm --clean",
        "Building EXE"
    ):
        return 1
    
    # Check if build was successful
    exe_path = Path("dist/AliceAIPet.exe")
    if exe_path.exists():
        print(f"\n{'=' * 60}")
        print("✓ Build successful!")
        print(f"{'=' * 60}")
        print(f"\nExecutable: {exe_path.absolute()}")
        print(f"Size: {exe_path.stat().st_size / (1024*1024):.2f} MB")
        return 0
    else:
        print("\n✗ Executable not found!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
