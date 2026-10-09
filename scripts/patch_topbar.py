import re
from pathlib import Path

# Update Topbar.tsx
topbar_path = Path(r"c:\Users\pbhus\Desktop\Fintech\apps\web\src\components\layout\Topbar.tsx")
content = topbar_path.read_text(encoding="utf-8")

content = re.sub(r'to="/([^"]+)"', r'to="/officer/\1"', content)
content = content.replace("link: '/crop", "link: '/officer/crop")

topbar_path.write_text(content, encoding="utf-8")
print("Topbar.tsx patched.")
