import os
import sys
import argparse
import numpy as np
import random
import tensorflow as tf
import matplotlib.pyplot as plt

from keras.utils import load_img, img_to_array
from tensorflow.python.keras.utils import np_utils

import tarfile
from flowers import label_dict


# Sagemaker directory
prefix = '/opt/ml/'
input_path = prefix + 'input/data'
model_path = prefix + 'model'


def image_normalization(image):
    return image / 255.0


def prepare_datasets(data_type="train"):
    print(" --- PREPARE DATASETS --- ")

    # Load Images
    image_data = []
    labels = []

    train_path = os.path.join(input_path, data_type)
    flowers = os.listdir(train_path)

    for flower in flowers:
        if flower not in label_dict.keys():
            continue
        
        flower_img_path = os.path.join(train_path, flower)
        images = os.listdir(flower_img_path)
        for img_name in images:

            if '.svg' in img_name:
                continue
            if '.DS_' in img_name:
                continue
            if '.ipynb_checkpoints' in img_name:
                continue

            img_path = os.path.join(flower_img_path, img_name)
            img = load_img(img_path, target_size=(224, 224))

            img_data = img_to_array(img, data_format="channels_last")            
            img_data = image_normalization(img_data)
            img_label = label_dict[flower]

            image_data.append(img_data)
            labels.append(img_label)

    print("Images:", len(image_data))
    print("Labels:", len(labels))

    # Shuffle Image
    combined = list(zip(image_data, labels))
    random.shuffle(combined)
    image_data[:], labels[:] = zip(*combined)

    # Read Image
    image = np.array(image_data)
    label = np.array(labels)
    print(image.shape, label.shape)

    label = np_utils.to_categorical(label)
    print(image.shape, label.shape)
    return image, label


def build_model(dropout=0.2, category_num=3):
    print(" --- BUILD MODEL --- ")
    mobile_net_layers = tf.keras.applications.MobileNetV2(include_top=False,
                                                          weights='imagenet',
                                                          pooling='avg',
                                                          input_shape=(224, 224, 3))
    mobile_net_layers.trainable = False
    model = tf.keras.Sequential([
        mobile_net_layers,
        tf.keras.layers.Dropout(dropout),
        tf.keras.layers.Dense(category_num, activation='softmax')
    ])
    model.summary()
    return model


def train_model(model, x, y, learning_rate=0.0001, batch_size=32, epochs=50):
    print(" --- TRAIN MODEL --- ")
    adam = tf.keras.optimizers.Adam(learning_rate=learning_rate)
    model.compile(loss='categorical_crossentropy', optimizer=adam, metrics=['accuracy'])
    history = model.fit(x, y,
                        shuffle=True,
                        batch_size=batch_size,
                        epochs=epochs,
                        validation_split=0.2)
    return history


def train(args, loaded_model):
    print(" --- TRAIN --- ")
    x, y = prepare_datasets(data_type="train")
    if loaded_model is None:
        print(" --- Loaded model is None --- ")
        model = build_model(dropout=0.2, category_num=y.shape[1])
    else:
        print(" --- Loaded model is Not None --- ")
        model = loaded_model
        
    history = train_model(model=model, x=x, y=y,
                          learning_rate=args.learning_rate,
                          batch_size=args.batch_size,
                          epochs=args.epochs)
    return model, history


def test(model):
    print(" --- TEST --- ")
    x, y = prepare_datasets(data_type="test")
    model.evaluate(x, y)


def store(model, model_path="/opt/ml/model"):
    print(" --- STORE --- ")
    print(model_path)
    
    # Store Keras
    model.save(model_path + "/1")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    # Hyperparameter sent by the client
    parser.add_argument('--epochs', type=int, default=5)
    parser.add_argument('--batch-size', type=int, default=32)
    parser.add_argument('--learning-rate', type=float, default=0.0001)

    # Input data and model directories
    parser.add_argument('--model-dir', type=str, default=os.environ['SM_MODEL_DIR'])
    # parser.add_argument('--train', type=str, default=os.environ['SM_CHANNEL_TRAIN'])
    # parser.add_argument('--test', type=str, default=os.environ['SM_CHANNEL_TEST'])

    args, _ = parser.parse_known_args()

    # Open file
    model_dir_path = os.path.join(input_path, 'model')
    model_zip_path = os.path.join(model_dir_path, 'model.tar.gz')
    model_path = os.path.join(model_dir_path, 'model_src')
    
    print(" --- Is model.tar.gz exist? -- ")
    print(os.path.isdir(model_dir_path))
    print(os.path.isfile(model_zip_path))
    
    loaded_model = None
    has_saved_model = os.path.isfile(model_zip_path)
    if has_saved_model:
        file = tarfile.open(model_zip_path)
        file.extractall(model_path)
        file.close()

        print(" --- Model Path --- ")
        print(model_path)

        loaded_model = tf.keras.models.load_model(model_path + "/1")
        print(" --- Loaded Model --- ")
        print(loaded_model)
    
    # Train
    model, _ = train(args, loaded_model=loaded_model)

    # Test
    test(model=model)

    # Store
    store(model=model, model_path=args.model_dir)
    
    # A zero exit code causes the job to be marked a Succeeded.
    sys.exit(0)
