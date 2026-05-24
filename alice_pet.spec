# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Alice AI Ultra Pet
Build command: pyinstaller alice_pet.spec
"""

a = Analysis(
    ['main.py'],
    pathex=['c:\\alice-ai-ultra-pet'],
    binaries=[],
    datas=[
        ('assets', 'assets'),
        ('config', 'config'),
        ('data', 'data'),
    ],
    hiddenimports=[
        'PySide6',
        'PIL',
        'requests',
        'pygame',
        'sounddevice',
        'soundfile',
        'numpy',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludedimports=['matplotlib', 'scipy'],
    win_private_assemblies=True,
    win_no_prefer_redirects=True,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='AliceAIPet',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/alice/idle/frame_0.png',
)
