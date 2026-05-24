"""
Asset Migration Script - Eski asset yapısını yenisine migrate et
Yapı: assets/alice/* -> assets/characters/alice/outfits/default/*
"""

import os
import shutil
import json
from pathlib import Path
from PIL import Image


class AssetMigrator:
    """Asset migrasyonu ve organize etme"""
    
    def __init__(self):
        self.assets_root = Path("assets")
        self.characters_root = self.assets_root / "characters"
        self.emotion_mapping = {
            "Smile": "happy",
            "Open": "talk",
            "Frown": "angry",
            "EyesClosed": "sleep",
            "Closed_Smile": "idle",
            "Default": "idle",
            "idle": "idle",
            "talk": "talk",
            "happy": "happy",
            "angry": "angry",
            "sleep": "sleep",
            "move": "move",
        }
        
    def migrate_old_alice_structure(self):
        """assets/alice/* -> assets/characters/alice/outfits/default/*"""
        print("[1] Eski Alice yapısı migrasyonu...")
        
        old_alice_path = self.assets_root / "alice"
        if not old_alice_path.exists():
            print("⚠ assets/alice bulunamadı, skip")
            return
        
        new_alice_path = self.characters_root / "alice"
        new_default_outfit = new_alice_path / "outfits" / "default"
        
        # Hedef klasörleri oluştur
        new_default_outfit.mkdir(parents=True, exist_ok=True)
        
        # Her emotion klasörünü migrate et
        for emotion_dir in old_alice_path.iterdir():
            if emotion_dir.is_dir():
                emotion = emotion_dir.name
                
                # Target emotion klasörünü oluştur
                target_emotion = new_default_outfit / emotion
                target_emotion.mkdir(exist_ok=True)
                
                # Frame dosyalarını kopyala
                frame_idx = 0
                for file in sorted(emotion_dir.iterdir()):
                    if file.suffix.lower() in ['.png', '.jpg', '.jpeg']:
                        # Dosya adını normalize et (frame_0.png, frame_1.png, ...)
                        new_name = f"frame_{frame_idx}.png"
                        target_file = target_emotion / new_name
                        
                        # PNG'e dönüştür
                        try:
                            img = Image.open(file)
                            img = img.convert('RGBA')
                            img.save(target_file)
                            print(f"  ✓ {emotion}/{new_name}")
                            frame_idx += 1
                        except Exception as e:
                            print(f"  ✗ {emotion}/{file.name}: {e}")
        
        # manifest.json oluştur (varsa)
        self._create_manifest("alice", new_alice_path)
        print("✓ Alice migrasyonu tamamlandı\n")
    
    def migrate_aiko_packages(self):
        """Aiko paketlerini outfit olarak bağla"""
        print("[2] Aiko paketleri migrasyonu...")
        
        aiko_path = self.assets_root / "aiko"
        if not aiko_path.exists():
            print("⚠ assets/aiko bulunamadı, skip\n")
            return
        
        # Aiko -> Outfit eşlemesi
        package_mapping = {
            "Aiko Gym Pack": ("aiko", "gym"),
            "Aiko Maid Pack": ("aiko", "maid"),
            "AikoWitchPack": ("aiko", "witch"),
            "Aiko_Cat_NoranekoGames": ("aiko_cat", "default"),
            "Aiko_NoranekoGames": ("aiko", "default"),
        }
        
        for package_name, (char_name, outfit_name) in package_mapping.items():
            package_path = aiko_path / package_name
            if not package_path.exists():
                print(f"  ⚠ {package_name} bulunamadı")
                continue
            
            # Mapping iyileştir
            if package_name == "Aiko_Cat_NoranekoGames":
                self._migrate_aiko_subpackages(
                    package_path, char_name, "aiko_cat"
                )
            elif package_name == "Aiko Gym Pack":
                self._migrate_aiko_outfit(package_path, "aiko", "gym")
            elif package_name == "Aiko Maid Pack":
                self._migrate_aiko_outfit(package_path, "aiko", "maid")
            elif package_name == "AikoWitchPack":
                self._migrate_aiko_outfit(package_path, "aiko", "witch")
        
        print("✓ Aiko migrasyonu tamamlandı\n")
    
    def _migrate_aiko_outfit(self, package_path: Path, char_name: str, outfit_name: str):
        """Tek bir Aiko outfit'i migrate et"""
        char_path = self.characters_root / char_name
        outfit_path = char_path / "outfits" / outfit_name
        outfit_path.mkdir(parents=True, exist_ok=True)
        
        # Cat klasörünü ara
        cat_path = package_path / "Cat"
        if not cat_path.exists():
            # Direkt dosyaları ara
            cat_path = package_path
        
        if cat_path.exists():
            self._process_aiko_frames(cat_path, outfit_path)
            print(f"  ✓ {char_name}/{outfit_name}")
        
        # Manifest oluştur
        self._create_manifest(char_name, char_path)
    
    def _migrate_aiko_subpackages(self, base_path: Path, char_name: str, alt_char: str):
        """Aiko_Cat_NoranekoGames gibi subpackages migrate et"""
        char_path = self.characters_root / char_name
        
        # Her subdir'i outfit olarak al
        subdir_mapping = {
            "Blazer Uniform": "blazer",
            "Casual": "casual",
            "Summer Uniform": "summer",
            "Winter Uniform": "winter",
        }
        
        for subdir_name, outfit_name in subdir_mapping.items():
            subdir_path = base_path / subdir_name
            if subdir_path.exists():
                outfit_path = char_path / "outfits" / outfit_name
                outfit_path.mkdir(parents=True, exist_ok=True)
                self._process_aiko_frames(subdir_path, outfit_path)
                print(f"  ✓ {char_name}/{outfit_name}")
        
        self._create_manifest(char_name, char_path)
    
    def _process_aiko_frames(self, source_path: Path, target_outfit_path: Path):
        """Aiko dosyalarını emotion klasörlerine organize et"""
        # Emotion eşlemesi (Aiko dosya adlarından)
        aiko_emotion_files = {}
        
        for file in source_path.iterdir():
            if file.is_file() and file.suffix.lower() in ['.png', '.jpg', '.jpeg']:
                # Dosya adından emotion çıkar
                stem = file.stem
                emotion = None
                
                for aiko_name, emotion_name in self.emotion_mapping.items():
                    if aiko_name.lower() in stem.lower():
                        emotion = emotion_name
                        break
                
                if not emotion:
                    emotion = "idle"
                
                if emotion not in aiko_emotion_files:
                    aiko_emotion_files[emotion] = []
                aiko_emotion_files[emotion].append(file)
        
        # Emotion klasörlerine organize et
        for emotion, files in aiko_emotion_files.items():
            emotion_path = target_outfit_path / emotion
            emotion_path.mkdir(exist_ok=True)
            
            for idx, file in enumerate(sorted(files)):
                target_file = emotion_path / f"frame_{idx}.png"
                try:
                    img = Image.open(file)
                    img = img.convert('RGBA')
                    img.save(target_file)
                except Exception as e:
                    print(f"    ✗ {file.name}: {e}")
    
    def create_empty_outfit(self, char_name: str, outfit_name: str, emotions: list = None):
        """Hata durumunda boş outfit yapısı oluştur"""
        if emotions is None:
            emotions = ["idle", "talk", "happy", "angry", "sleep", "move"]
        
        outfit_path = self.characters_root / char_name / "outfits" / outfit_name
        outfit_path.mkdir(parents=True, exist_ok=True)
        
        for emotion in emotions:
            (outfit_path / emotion).mkdir(exist_ok=True)
    
    def _create_manifest(self, char_name: str, char_path: Path):
        """Character için manifest.json oluştur"""
        manifest_path = char_path / "manifest.json"
        
        if manifest_path.exists():
            return  # Zaten var
        
        # Character'ları özel bir şekilde handle et
        char_configs = {
            "alice": {
                "id": "alice",
                "name": "Alice",
                "description": "AI Ultra Pet",
                "active": True,
                "default_outfit": "default",
                "version": "2.0"
            },
            "aiko": {
                "id": "aiko",
                "name": "Aiko",
                "description": "Aiko Character",
                "active": False,
                "default_outfit": "default",
                "version": "1.0"
            },
            "aiko_cat": {
                "id": "aiko_cat",
                "name": "Aiko Cat",
                "description": "Aiko Cat Version",
                "active": False,
                "default_outfit": "casual",
                "version": "1.0"
            }
        }
        
        manifest = char_configs.get(
            char_name,
            {
                "id": char_name,
                "name": char_name.title(),
                "description": f"{char_name.title()} Character",
                "active": False,
                "default_outfit": "default",
                "version": "1.0"
            }
        )
        
        # Mevcut outfits'i listele
        outfits_dir = char_path / "outfits"
        if outfits_dir.exists():
            manifest["outfits"] = [d.name for d in outfits_dir.iterdir() if d.is_dir()]
        
        # Kaydet
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    
    def run(self):
        """Tüm migrasyonları çalıştır"""
        print("=" * 50)
        print("ASSET MIGRATION BAŞLANIYOR")
        print("=" * 50 + "\n")
        
        # Hedef klasörleri oluştur
        self.characters_root.mkdir(parents=True, exist_ok=True)
        
        # Migrasyonları çalıştır
        self.migrate_old_alice_structure()
        self.migrate_aiko_packages()
        
        # Manifest'leri oluştur
        print("[3] Manifest'ler oluşturuluyor...\n")
        for char_dir in self.characters_root.iterdir():
            if char_dir.is_dir():
                self._create_manifest(char_dir.name, char_dir)
                print(f"  ✓ {char_dir.name}/manifest.json")
        
        print("\n" + "=" * 50)
        print("✓ ASSET MIGRATION TAMAMLANDI")
        print("=" * 50)


if __name__ == "__main__":
    migrator = AssetMigrator()
    migrator.run()
