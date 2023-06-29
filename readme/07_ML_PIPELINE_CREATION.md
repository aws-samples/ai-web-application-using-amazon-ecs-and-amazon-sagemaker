# Amazon SagemMaker Pipelines을 이용한 모델 학습 및 배포 자동화

## 학습 단계 생성
Amazon SageMaker에서 학습에 사용되는 데이터는 Amazon S3에서 다운로드해서 사용됩니다. 그렇기 때문에 먼저 학습에 필요한 데이터를 Amazon S3에 업로드해야 합니다. Amazon S3 에 app-ml-dataset-[yourname] 버킷을 생성합니다. 여기서는 app-ml-dataset-0410으로 생성했습니다. 그리고 생성한 버킷에 접속해서 다운로드한 프로젝트의 /datasets/flowsers 폴더를 전부 업로드합니다. 다음 그림과 같이 astilbe의 경로는 /app-ml-dataset-0410/flowers/astilbe 가 됩니다.

<img width="1024" alt="data-0" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/0a4b372a-a5e6-4184-adaf-2e304383f026">

다음으로 학습 단계에 필요한 코드를 SageMaker Studio에 업로드합니다. 먼저 SageMaker Studio에서 접속해서 왼쪽 메뉴에서 폴더 아이콘을 클릭한 뒤 src 폴더를 생성합니다. 그리고 다운로드한 프로젝트에서 [/ml/src/train.py](https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/blob/main/ml/src/train.py) 과 [/ml/src/flower.py](https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/blob/main/ml/src/flowers.py) 파일을 /src/train.py 경로와 src/train.py 경로에 각각 업로드 합니다.

<p align="center">
<img width="800" alt="train-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/aa15494c-fdaa-4f46-b522-c91d3779da71">
</p>

train.py 파일에는 학습 데이터 로드, 모델 생성, 모델 학습 그리고 학습한 모델을 저장하는 코드가 있습니다. Amazon SageMaker 는 학습을 시작하기 전에 S3 에 있는 학습 데이터를 지정된 경로에 다운 받기 때문에 코드에서 불러와서 사용할 수 있습니다. 그리고 학습이 완료된 모델을 지정된 경로에 저장하면 Amazon SageMaker 는 S3에 업로드 합니다. 다음 코드는 모델을 생성하는 함수로 이미지 추론을 위해서 MobileNetV2 모델을 생성합니다.

```
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
```

그리고 생성된 모델과 학습 데이터를 이용해서 모델을 학습하는 코드입니다.
```
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
```

마지막으로 학습이 완료된 모델을 특정 경로에 저장하는 코드입니다.
```
def store(model, model_path="/opt/ml/model"):
    print(" --- STORE --- ")
    print(model_path)
    
    # Store Keras
    model.save(model_path + "/1")
```

이제 앞서 확인한 train.py을 이용해서 학습 단계를 생성하고 학습 단계만 있는 파이프라인을 구성합니다. 이를 위해서 다운로드한 프로젝트에서 [/ml/build-pipeline-train.ipynb](https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/blob/main/ml/build-pipeline-train.ipynb)을 SageMaker Studio에서 /build-pipelin-train.ipynb 경로로 업로드 합니다. 업로드한 파일 열면 뜨는 Set up notebook environment 창에서 Image를 TensorFlow 2.12.0 Python 3.10 CPU Optimized로 선택하고 Select 버튼을 눌러서 노트북 환경 설정을 마칩니다. 여기서 구성하는 환경은 학습 환경이 아닌 파이프라인 생성을 위한 환경이기 때문에 GPU를 사용하지 않습니다.

<img width="1024" alt="train-4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c6148994-c3b7-4896-915b-ae0e6574ed5a">

파일에서 train_data_uri 값으로 앞서 업로드한 학습 데이터 경로를 대입하여 기본값으로 사용합니다. 과정을 단순화하기 위해서 학습 데이터와 테스트 데이터는 같은 데이터를 사용합니다. 다음 코드는 학습되는 컴퓨팅 환경을 구성하는 부분으로 학습 모델에 따라 다르게 설정할 수 있습니다.

```
tf_estimator=TensorFlow(
    source_dir='src',
    entry_point='train.py',
    dependencies=[],
    instance_count=1,
    instance_type='ml.p3.2xlarge',
    framework_version='2.11.0',
    role=role,
    hyperparameters=hyperparameters,
    sagemaker_session=sagemaker_session,
    compiler_config=TrainingCompilerConfig(),
    py_version="py39",
    disable_profiler=True,
    metric_definitions=[
        {"Name": "training_loss", "Regex": "loss: ([0-9.]*?) "},
        {"Name": "training_accuracy", "Regex": "accuracy: ([0-9.]*?) "},
        {"Name": "validation_loss", "Regex": "val_loss: ([0-9.]*?) "},
        {"Name": "validation_accuracy", "Regex": "val_accuracy: ([0-9.]*?)$"}
    ],
    base_job_name="app-flower-classifier"
)
```

구성을 완료하고 상단에 있는 재생 아이콘 버튼을 눌러서 모든 코드 블록을 실행해서 파이프라인을 구성하고 생성합니다. 생성된 파이프라인을 확인하기 위해서 왼쪽의 메뉴에서 홈 아이콘 버튼을 눌러서 메뉴가 펼쳐지면 Pipelines 버튼을 선택해서 이동합니다. 이동하면 다음과 같이 AppMlPipeline-Train 이 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="train-6" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/b80267e1-0b79-4257-bb7a-46b586fc4bef">

AppMlPipeline-Train을 선택해서 들어간 다음 Graph 탭으로 이동하면 Train 스탭이 생긴 것을 확인할 수 있습니다. 이제 오른쪽 위에 있는 Create execution을 눌러서 파이프라인을 시작합니다. 필요한 값들을 입력하고 Start 버튼을 눌러서 실행합니다. 

<img width="1024" alt="train-7" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/ab51e076-346e-43d1-864c-ef72c24a5c79">
<img width="1024" alt="train-8" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/b556304e-baf4-4d0f-8d6c-f0b098888e52">

학습이 완료되면 다음과 같이 초록색으로 표시되며 Output 탭에서 학습 결과를 확인할 수 있습니다. 

<img width="1024" alt="train-10" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/13573914-4fc6-4662-bf17-e2e212d7e6cc">



## 모델 등록 단계 생성
다음으로 모델 등록 단계가 추가된 파일을 업로드합니다. 이를 위해서 다운로드한 프로젝트에서 모델 생성 단계 [/ml/build-pipelin-model.ipynb](https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/blob/main/ml/build-pipeline-model.ipynb)을 SageMaker Studio에서 /build-pipelin-model.ipynb 경로에 업로드 합니다. 업로드한 파일 열면 뜨는 Set up notebook environment 창에서 Image를 TensorFlow 2.12.0 Python 3.10 CPU Optimized로 선택하고 Select 버튼을 눌러서 노트북 환경 설정을 마칩니다. 추가된 단계는 다음과 같습니다.

```
# 4. Create Model

from sagemaker.model import Model
from sagemaker.inputs import CreateModelInput
from sagemaker.workflow.steps import CreateModelStep

model = Model(
    image_uri="763104351884.dkr.ecr.ap-northeast-2.amazonaws.com/tensorflow-inference:2.11.0-cpu", 
    model_data=step_train.properties.ModelArtifacts.S3ModelArtifacts,
    sagemaker_session=sagemaker_session,
    predictor_cls=sagemaker.predictor.RealTimePredictor,
    role=role
)


inputs = CreateModelInput(
    instance_type="ml.m5.large",
)

step_create_model = CreateModelStep(
    name="CreateModel",
    model=model,
    inputs=inputs,
)
```

학습 단계에서 했던 과정과 동일하게 train_data_uri 값으로 앞서 업로드한 학습 데이터 경로를 대입하여 기본값으로 사용합니다. 왼쪽의 메뉴에서 홈 아이콘 버튼을 눌러서 메뉴가 펼쳐지면 Pipelines 버튼을 선택해서 이동합니다. 이동하면 다음과 같이 AppMlPipeline-Model 이 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="model-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/31d17cee-ff76-4511-8c49-b3d64701e9ca">

AppMlPipeline-Model을 선택해서 들어간 다음 Graph 탭으로 이동하면 CreateModel 스탭이 추가된 것을 확인할 수 있습니다. 이제 오른쪽 위에 있는 Create execution을 눌러서 파이프라인을 시작합니다. 필요한 값들을 입력하고 Start 버튼을 눌러서 실행합니다. 

<img width="1024" alt="model-2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/0729a2f6-40a0-437a-a8db-49824bf6f3f2">
<img width="1024" alt="model-3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/67a9df6b-61cd-4584-9490-b84b49e7764b">


파이프라인이 완료되어 학습과 모델이 생성되면 다음과 같은 화면을 볼 수 있습니다.

<img width="1024" alt="model-4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/e8a04397-61ec-41a2-ab56-4dda56f7255f">


## 배포 단계 생성
배포 단계에는 SageMaker Endpoint를 생성하고 생성한 Endpoint 에 모델을 배포합니다. 먼저 배포 단계에 필요한 코드를 SageMaker Studio 에 업로드합니다. SageMaker Studio에 접속해서 왼쪽 메뉴에서 폴더 아이콘을 클릭한 뒤 src 폴더를 생성합니다. 그리고 다운로드한 프로젝트에서 [/ml/src/deploy.py](https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/blob/main/ml/src/deploy.py) 파일을 /src/deploy.py 경로에 업로드 합니다.


<p align="center">
<img width="518" alt="deploy-0" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/45009fa6-2a99-406a-9011-69deeeb59ed5">
</p>

이제 앞서 올린 deploy.py을 이용해서 SageMaker Endpoint 에 배포하는 단계를 생성하고 파이프라인을 구성합니다. 이를 위해서 다운로드한 프로젝트에서 [/ml/build-pipelin-deploy.ipynb](https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/blob/main/ml/build-pipeline-deploy.ipynb)을 SageMaker Studio에서 /build-pipelin-deploy.ipynb 경로로 업로드 합니다. 업로드한 파일 열면 뜨는 Set up notebook environment 창에서 Image를 TensorFlow 2.12.0 Python 3.10 CPU Optimized로 선택하고 Select 버튼을 눌러서 노트북 환경 설정을 마칩니다. 추가된 단계는 다음과 같습니다.

```
# 5. Create Endpoint and Deploy

from sagemaker.workflow.steps import ProcessingStep
from sagemaker.sklearn.processing import SKLearnProcessor

sklearn_processor = SKLearnProcessor(
    framework_version="1.0-1",
    instance_type="ml.m5.large",
    instance_count=1,
    # base_job_name="comprehen",
    sagemaker_session=sagemaker_session,
    role=role,
)

step_create_model = ProcessingStep(
    name="CreateEndpoint",
    processor=sklearn_processor,
    job_arguments=[
        "--model-name",
        step_create_model.properties.ModelName,
    ],
    code="src/deploy.py",
)
```

학습 단계에서 했던 과정과 동일하게 train_data_uri 값으로 앞서 업로드한 학습 데이터 경로를 대입하여 기본값으로 사용합니다. 왼쪽의 메뉴에서 홈 아이콘 버튼을 눌러서 메뉴가 펼쳐지면 Pipelines 버튼을 선택해서 이동합니다. 이동하면 다음과 같이 AppMlPipeline-Deploy 가 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="deploy-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/36b4c416-4eb8-43d5-b563-e96a9171517f">

AppMlPipeline-Deploy을 선택해서 들어간 다음 Graph 탭으로 이동하면 DeployEndpoint 스탭이 생긴 것을 확인할 수 있습니다. 이제 오른쪽 위에 있는 Create execution을 눌러서 파이프라인을 시작합니다. 필요한 값들을 입력하고 Start 버튼을 눌러서 실행합니다.

<img width="1024" alt="deploy-2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/8a546ca3-55e6-47f2-8d2d-d6313297af48">
<img width="1024" alt="deploy-3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/346a20f9-6bf3-4162-ae84-9790969f34b9">

파이프라인이 완료되어 학습과 모델이 생성되고 엔드포인트에 배포까지 완료되면 다음과 같은 화면을 볼 수 있습니다.

<img width="1024" alt="deploy-4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/15d29280-e37f-4391-bf1a-e1680b07ef56">
