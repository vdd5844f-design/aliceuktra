from PIL import Image, ImageDraw
import os

# Create sprite directories
emotions = ["idle", "talk", "happy", "angry", "sleep", "move"]
for emotion in emotions:
    os.makedirs(f"assets/alice/{emotion}", exist_ok=True)

# Generate simple test sprites (colored rectangles with text)
colors = {
    "idle": (100, 150, 200),      # Blue
    "talk": (200, 150, 100),      # Brown
    "happy": (255, 200, 100),     # Orange
    "angry": (255, 100, 100),     # Red
    "sleep": (150, 150, 150),     # Gray
    "move": (100, 200, 150)       # Green
}

for emotion in emotions:
    color = colors[emotion]
    for frame in range(4):
        img = Image.new('RGBA', (128, 128), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw body
        draw.rectangle(
            [(20 + frame*3, 30), (108 - frame*2, 100)],
            fill=color,
            outline=(0, 0, 0),
            width=2
        )
        
        # Draw eyes
        draw.ellipse([(35 + frame, 40), (45 + frame, 50)], fill=(0, 0, 0))
        draw.ellipse([(85 + frame, 40), (95 + frame, 50)], fill=(0, 0, 0))
        
        # Draw text
        draw.text((30, 110), f"{emotion[0:3].upper()}", fill=(0, 0, 0))
        
        img.save(f"assets/alice/{emotion}/frame_{frame}.png")
        print(f"✓ Created {emotion}/frame_{frame}.png")

print("\n✓ All sprite assets created successfully!")
