import pathlib
import secrets
from datetime import datetime

import numpy as np
from keras.utils import load_img, img_to_array, np_utils
from constant import *
from PIL import ImageOps

def create_file_name(extension=".jpg"):
    print("--- CREATE FILE NAME ---")
    current_time = datetime.now().strftime("%m%d%H%M%S")
    file_name = ''.join([current_time, secrets.token_hex(8), extension])
    print(f"File name: {file_name}")
    return file_name


def create_file_path(file_name):
    print("--- CREATE FILE PATH ---")
    file_location = os.path.join(IMG_DIR, file_name)
    print(f"File location: {file_location}")
    return file_location


def image_to_array(image_path):
    print("--- IMAGE TO ARRAY ---")
    print(f"Image path: {image_path}")
    img = load_img(image_path, target_size=(224, 224))
    img = ImageOps.exif_transpose(img)
    img_data = img_to_array(img, data_format="channels_last")
    image = np.array(img_data)
    print(f"Image shape: {image.shape}")
    return image


def image_normalization(image):
    return image / 255.0


def save_file(file_bytes, file_path):
    pathlib.Path(file_path).parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "wb+") as file_object:
        file_object.write(file_bytes)


def remove_file(file_path):
    os.remove(file_path)


async def get_image_array(file):
    print("--- GET IMAGE ARRAY ---")
    file_bytes = await file.read()
    file_extension = pathlib.Path(file.filename).suffix
    file_name = create_file_name(extension=file_extension)
    file_path = create_file_path(file_name=file_name)

    save_file(file_bytes=file_bytes, file_path=file_path)
    image_array = image_to_array(file_path)
    norm_array = image_normalization(image_array)
    remove_file(file_path=file_path)

    return norm_array
