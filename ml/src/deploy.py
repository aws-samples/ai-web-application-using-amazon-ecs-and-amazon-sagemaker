#!/usr/bin/env python
import sys
import os
import boto3
import random
import argparse

from datetime import datetime 

def update(args):
    client = boto3.client("sagemaker", region_name=os.environ["AWS_REGION"])

    # Endpoint config parameters
    production_variant_dict={
        "VariantName": "Alltraffic",
        "ModelName": args.model_name,
        "InitialInstanceCount": 1,
        "InstanceType": "ml.m5.xlarge",
        "InitialVariantWeight": 1
    }

    endpoint_config_name="image-classifier-" + datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
    client.create_endpoint_config(
        EndpointConfigName=endpoint_config_name,
        ProductionVariants=[production_variant_dict],
    )
    
    # Create endpoint
    client.create_endpoint(
        EndpointName="image-classifier",
        EndpointConfigName=endpoint_config_name
    )
    
    # Update endpoint
    # client.update_endpoint(
    #     EndpointName="image-classifier",
    #     EndpointConfigName=endpoint_config_name
    # )
    

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-name", type=str, help="model name")
    args = parser.parse_args()
    print(args)

    update(args)
    
    sys.exit(0)