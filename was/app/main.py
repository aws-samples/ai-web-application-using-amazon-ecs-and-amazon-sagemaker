import boto3
import numpy as np
import time

from fastapi import FastAPI
from fastapi import UploadFile, File
from image_util import *
from fastapi.middleware.cors import CORSMiddleware
from dex_util import *

app = FastAPI()

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def image_classifier(file):
    print("--- CALL: image_classifier ---", flush=True)
    # Get image array
    image_array = await get_image_array(file=file)

    # Prepare request body
    request = {
        "instances": [image_array.tolist()]
    }
    body = json.dumps(request)

    # Invoke endpoint
    client = boto3.client("sagemaker-runtime")
    endpoint_name = 'image-classifier'
    response = client.invoke_endpoint(
        EndpointName=endpoint_name,
        Body=body,
        ContentType='application/json',
        Accept='Accept'
    )

    # Parse Result
    result = json.loads(response['Body'].read().decode('utf-8'))
    print(f"Result: {json.dumps(result, ensure_ascii=False)}")


    prediction = result["predictions"][0]
    num_prediction = np.argmax(prediction).item()
    no = num_prediction
    acc = prediction[num_prediction]

    return no, acc


@app.post("/classify/image")
async def classify_image(file: UploadFile):
    print("--- API: /classify/image ---", flush=True)
    print(f"File Name: {file.filename}", flush=True)
    start = time.time()

    no, acc = await image_classifier(file)
    detail = get_flower_detail(no)
    name = detail['name']
    description = detail['description']

    print(f"Elapsed time: {time.time() - start}", flush=True)

    return {
        "result": {
            "no": no,
            "name": name,
            "acc": acc,
            "description": description
        }
    }


@app.get("/health")
async def root():
    return {"message": "WAS-Connected"}


@app.get("/")
async def root():
    return {"message": "connected"}
