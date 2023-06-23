from constant import *
import json

flower_id_to_info = "flower-id-to-info.json"

def read_dex(filepath):
    with open(filepath, 'r', encoding='UTF-8') as infile:
        data = json.load(infile)
    return data

def get_flower_detail(id):
    folower_detail = read_dex(STATIC_DIR + flower_id_to_info )
    return folower_detail[str(id)]

