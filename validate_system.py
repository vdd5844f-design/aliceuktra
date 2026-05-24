#!/usr/bin/env python
"""
Sistem Validasyon Testi
- Asset klasör yapısı kontrol
- OutfitManager işlevselliği
- SpriteAnimator outfit desteği
- State outfit tracking
"""

import json
from pathlib import Path
from engine.outfit_manager import OutfitManager
from engine.sprite_animator import SpriteAnimator
from core.state import AliceState

print("\n" + "="*60)
print("SISTEM VALIDASYON TESTİ")
print("="*60 + "\n")

# 1. Asset Klasör Yapısı
print("📁 1. ASSET KLASÖR YAPISINI KONTROL ET")
print("-" * 60)

base_path = Path("assets/characters/alice")
required_dirs = [
    "outfits/default/idle",
    "outfits/default/talk",
    "outfits/default/happy",
    "outfits/default/angry",
    "outfits/default/sleep",
    "outfits/default/move",
    "outfits/aiko_gym",
    "outfits/aiko_maid",
    "outfits/aiko_witch",
]

all_exist = True
for dir_path in required_dirs:
    full_path = base_path / dir_path
    exists = full_path.exists()
    status = "✓" if exists else "✗"
    print(f"  {status} {dir_path}")
    if not exists:
        all_exist = False

print(f"\n  Sonuç: {'✓ Klasörler oluşturuldu' if all_exist else '✗ Eksik klasörler var'}")

# 2. Manifest Kontrolü
print("\n📋 2. MANIFEST KONTROLÜ")
print("-" * 60)

manifest_path = base_path / "manifest.json"
if manifest_path.exists():
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    print(f"  ✓ manifest.json bulundu")
    print(f"    - Karakter: {manifest.get('id')}")
    print(f"    - İsim: {manifest.get('name')}")
    print(f"    - Toplam outfit: {len(manifest.get('outfits', []))}")
    print(f"    - Aktif outfit sayısı: {len([o for o in manifest.get('outfits', []) if o.get('enabled')])}")
    
    print(f"\n  Outfitler:")
    for outfit in manifest.get('outfits', []):
        status = "✓" if outfit.get('enabled') else "○"
        print(f"    {status} {outfit['id']:20} {outfit.get('name', '')}")
else:
    print(f"  ✗ manifest.json bulunmuyor: {manifest_path}")

# 3. OutfitManager Test
print("\n⚙️  3. OUTFITMANAGER TESTİ")
print("-" * 60)

try:
    om = OutfitManager("alice")
    print(f"  ✓ OutfitManager başlatıldı")
    
    # Güncel outfit
    current = om.current_outfit()
    print(f"    - Current outfit: {current}")
    
    # Outfit path
    path = om.get_outfit_path()
    print(f"    - Outfit path: {path}")
    print(f"      Var mı? {'✓' if path.exists() else '✗'}")
    
    # Aktif outfitler
    enabled = [o['id'] for o in om.enabled_outfits()]
    print(f"    - Enabled: {enabled}")
    
    # Frame kontrol
    idle_path = path / "idle"
    idle_frames = list(idle_path.glob("frame_*.png")) if idle_path.exists() else []
    print(f"    - Idle frame sayısı: {len(idle_frames)}")
    
except Exception as e:
    print(f"  ✗ OutfitManager hatası: {e}")
    import traceback
    traceback.print_exc()

# 4. SpriteAnimator Test
print("\n🎨 4. SPRITEANIMATOR TESTİ")
print("-" * 60)

try:
    state = AliceState()
    animator = SpriteAnimator(state, om)
    print(f"  ✓ SpriteAnimator başlatıldı")
    print(f"    - Current outfit: {state.current_outfit}")
    
    # Frame yükleme testi
    frame = animator.next_frame()
    if frame:
        print(f"    - İlk frame: {Path(frame).name}")
        print(f"      Path: {frame}")
        print(f"      Var mı? {'✓' if Path(frame).exists() else '✗'}")
    else:
        print(f"    ✗ Frame yükleme başarısız")
    
except Exception as e:
    print(f"  ✗ SpriteAnimator hatası: {e}")
    import traceback
    traceback.print_exc()

# 5. State Outfit Tracking
print("\n📊 5. STATE OUTFIT TRACKING")
print("-" * 60)

try:
    state = AliceState()
    print(f"  ✓ State başlatıldı")
    print(f"    - Default outfit: {state.current_outfit}")
    
    # Outfit değiştir
    state.current_outfit = "aiko_gym"
    print(f"    - Değiştirildikten sonra: {state.current_outfit}")
    
except Exception as e:
    print(f"  ✗ State hatası: {e}")

# 6. Outfit State Dosyası
print("\n💾 6. OUTFIT STATE DOSYASI")
print("-" * 60)

state_path = Path("data/outfit_state.json")
if state_path.exists():
    state_data = json.loads(state_path.read_text(encoding="utf-8"))
    print(f"  ✓ outfit_state.json bulundu")
    print(f"    - Character: {state_data.get('character')}")
    print(f"    - Date: {state_data.get('date')}")
    print(f"    - Outfit: {state_data.get('outfit')}")
    print(f"    - Manual: {state_data.get('manual')}")
else:
    print(f"  ✗ outfit_state.json bulunmuyor")

# Sonuç
print("\n" + "="*60)
print("✅ SISTEM VALIDASYONU TAMAMLANDI")
print("="*60 + "\n")
