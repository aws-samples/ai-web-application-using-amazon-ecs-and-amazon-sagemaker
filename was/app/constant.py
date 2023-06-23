import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.absolute()
STATIC_DIR = os.path.join(BASE_DIR, 'static/')
IMG_DIR = os.path.join(STATIC_DIR, 'images/')