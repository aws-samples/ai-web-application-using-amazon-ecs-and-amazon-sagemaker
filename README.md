# Amazon ECS와 Amazon SageMaker를 이용하여 이미지 분류 AI 웹 애플리케이션 구축과 운영하기

[Amazon ECS](https://aws.amazon.com/ko/ecs/)와 [Amazon SageMaker](https://aws.amazon.com/ko/sagemaker/)를 이용해서 꽃 이미지 분류를 위한 AI 웹 애플리케이션을 마이크로서비스 아키텍처(MSA)로 구축하는 방법을 소개합니다. 그리고 [AWS CodePipeline](https://aws.amazon.com/ko/codepipeline/)과 [Amazon SageMaker Pipelines](https://aws.amazon.com/ko/sagemaker/pipelines/)를 이용해서 CI/CD를 구축하여 서비스를 민첩하게 운영하는 방법도 함께 소개합니다.

마이크로서비스 아키텍처(MSA)와 인공지능(AI)은 현대화 애플리케이션 구현에서 가장 많이 언급되는 기술입니다. 애플리케이션은 규모가 커질 경우 다양한 환경에서 구동되는 마이크로서비스가 만들어지는데 이를 운영할 수 있는 환경이 필요합니다. 그리고 인공지능 서비스를 위해서는 기계 학습 모델을 생성 및 학습하고 학습된 모델을 운영할 수 있는 환경이 필요합니다. 

서비스 구축에 사용되는 Amazon ECS와 AWS Fargate는 AI 웹 애플리케이션을 컨테이너기반 마이크로서비스로 구성하여 운영을 자동화하고 손쉽게 배포, 관리 및 확장할 수 있도록 합니다. 마이크로서비스를 구성은 Web 계층과 WAS 계층으로 분리하여 서버 부하에 따른 확장을 효율적으로 하고 사용자에게 노출 되는 부분을 최소화 하여 보안을 강화합니다. Web 계층과 WAS 계층에는 기능 확장을 위해서 여러 마이크로 서비스들이 배포될 수 있습니다. 그리고 Amazon SageMaker는 기계 학습 모델을 학습하고 배포하여 이미지를 추론하는데 사용할 수 있도록 합니다. 또한, AWS CodePipeline는 코드를 컨테이너로 빌드하고 배포하는 과정을 자동화하고 Amazon SageMaker Pipelines를 이용해서 모델을 학습하고 배포하는 과정을 자동화합니다. 이를 통해서 소프트웨어의 품질 개선과 출시 주기를 단축하여 운영의 효율성을 가져갈 수 있습니다.

# AI 웹 애플리케이션 아키텍처

<img width="1024" alt="architecture-4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/6a07e849-c30c-4162-85b4-40222992dc73">


## Amazon ECS와 Amazon SageMaker를 이용한 AI 웹 애플리케이션
Amazon ECS는 AWS Fargate를 사용해서 Web Service와 WAS(Web Application Server) Service로 구성된 애플리케이션을 운영합니다. 그리고 Amazon SageMaker는 모델을 학습하고 학습된 모델을 Amazon SageMaker Endpoint를 통해 API 형태로 WAS 에 제공합니다. NAT gateway는 네트워크 주소 변환 서비스로 Private Subnet 에 위치한 WAS Service 가 외부의 서비스와 연결이 필요한 경우 사용됩니다. 하지만 외부 서비스에서는 WAS Service 에 연결을 시작할 수 없어 보안을 강화할 수 있습니다. Application Load Balancer는 Service에서 운영되고 있는 복제된 여러 개의 Task에 트래픽을 분산합니다. Task는 한 개 이상의 컨테이너를 정의할 수 있습니다. 이번 아키텍처에서는 Task 에 하나의 컨테이너를 정의하여 운영합니다. 본 시스템에서 사용자는 Web Service에서 제공하는 UI를 통해 AI 웹 애플리케이션에 접근합니다. Web Service는 비즈니스 로직을 수행을 위해서 WAS Service를 호출하고 WAS Service는 이미지 분류와 같은 AI 기능을 수행하기 위해서 Amazon SageMaker Endpoint를 호출합니다.

## AWS CodePipeline를 이용한 Application CI/CD 구성

코드의 통합과 배포를 자동화할 수 있는 CI/CD 서비스를 제공합니다. 애플리케이션 개발자는 AWS CodePipeline를 통해서 빠르고 안정적으로 애플리케이션을 빌드하고 Amazon ECS로 구성된 인프라 배포하는 과정을 자동화합니다. 먼저 AWS CodeCommit을 통해서 개발 중인 코드를 형상 관리 할 수 있습니다. 그리고 코드는 특정 브랜치에 업데이트 되거나 머지되어 변경 사항이 생기면 AWS CodeBuild를 통해서 컨테이너 이미지를 빌드하고 ECR 에 업로드됩니다. 이후 AWS CodeDeploy를 통해서 ECS 환경에 배포합니다.

## Amazon SageMaker Pipeline를 이용한 기계 학습 CI/CD 구성

기계 학습 Model을 학습하고 배포할 수 있는 CI/CD 서비스를 제공합니다. 모델 엔지니어는 AWS SageMaker Pipeline을 통해서 학습과 배포를 자동화하고 워크플로를 시각화하고 관리할 수 있습니다. 본 글에서는 학습, 모델 등록 그리고 배포 구성되어 있습니다. 학습을 시작하면 Amazon S3에서 학습 데이터를 다운로드하고 학습을 시작합니다. 학습이 완료된 모델은 다음 스텝에서 사용할 수 있도록 S3 에 저장하고 저장된 모델을 사용할 수 있도록 등록합니다. 이후 Amazon SageMaker Endpoint로 배포되어 API를 제공합니다.


## 아키텍처에 사용된 주요 AWS 서비스

### Amazon ECS

Amazon ECS는 완전 관리형 컨테이너 오케스트레이션 서비스로서 컨테이너화된 애플리케이션을 손쉽게 배포, 관리 및 확장할 수 있도록 도와줍니다. Amazon ECS 컨트롤 플레인은 나머지 AWS 환경과 긴밀하게 통합되어 클라우드에서 컨테이너 워크로드를 실행하기 위한 안전하고 사용하기 쉬운 솔루션을 제공합니다.

### AWS Fargate

AWS Fargate는 Amazon EC2 인스턴스의 서버나 클러스터를 관리할 필요 없이 컨테이너를 실행하기 위해 Amazon ECS에서 사용할 수 있는 기술입니다. Fargate를 사용하면 더 이상 컨테이너를 실행하기 위해 가상 머신의 클러스터를 프로비저닝, 구성 또는 조정할 필요가 없습니다. 따라서 서버 유형을 선택하거나, 클러스터를 조정할 시점을 결정하거나, 클러스터 패킹을 최적화할 필요가 없습니다.

### AWS CodePipeline

AWS CodePipeline 은 소프트웨어를 릴리스하는 데 필요한 단계를 모델링, 시각화 및 자동화할 수 있게 해주는 지속적 전달 서비스입니다. AWS CodePipeline을 사용하여 코드 빌드, 사전 프로덕션 환경으로의 배포, 애플리케이션 테스트 및 프로덕션으로 릴리스를 비롯한 전체 릴리스 프로세스를 모델링합니다. 그러면 AWS CodePipeline이 정의된 워크플로우에 따라 코드 변경이 있을 때마다 애플리케이션을 빌드, 테스트, 배포합니다. 파트너 도구 및 자체 사용자 지정 도구를 릴리스 프로세스 중 원하는 단계에 통합하여 포괄적이며 지속적 전달 솔루션을 형성할 수 있습니다.

### Amazon SageMaker

Amazon SageMaker는 종합 관리형 기계 학습 서비스입니다. Amazon SageMaker를 통해 데이터 사이언티스트와 개발자들은 기계 학습 모델을 빠르고 쉽게 구축하고 훈련할 수 있습니다. 그리고 이들 모델을 프로덕션 지원 호스팅 환경에 직접 배포할 수 있습니다. 탐색 및 분석에 필요한 내장형 Jupyter 작성 노트북 인스턴스를 제공하기 때문에 서버를 관리할 필요가 없습니다. 또한 대규모 데이터를 효율적으로 실행하는 데 최적화된 일반 기계 학습 알고리즘도 제공합니다. 

### Amazon SageMaker Pipelines
Amazon SageMaker Pipelines를 사용하면 데이터 준비에서 모델 배포에 이르기까지 완전히 자동화된 ML 워크플로를 생성할 수 있으므로 프로덕션에서 수천 개의 ML 모델로 확장할 수 있습니다. SageMaker Pipelines는 Amazon SageMaker Studio에 연결되는 Python SDK도 함께 제공하므로, 시각적 인터페이스를 활용하여 워크플로의 각 단계를 구축할 수 있습니다. 그런 다음, 단일 API를 사용하여 각 단계를 연결하고 포괄적인 워크플로를 생성할 수 있습니다.

# CDK 를 이용한 인프라 설치

다음부터 진행되는 내용 중 'VPC 생성', 'Amazon ECS 클러스터 구성', 'AWS Fargate 기반 Web Service 구성' 그리고 'AWS Fargate 기반 WAS Service 구성'은 CDK를 이용해서도 편하게 구성하실 수 있습니다. CDK 사용을 원하신다면 [CDK를 이용한 인프라 설치](https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/tree/main/cdk-ai-wep-application#cdk%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-%EC%9D%B8%ED%94%84%EB%9D%BC-%EC%84%A4%EC%B9%98)를 참고 부탁드립니다.

# VPC 생성

AWS가 전 세계에서 데이터 센터를 클러스터링하는 물리적 위치를 리전이라고 합니다. 이번 블로그에서는 Seoul (ap-northeast-2) 리전에서 진행합니다. 그리고 각 리전은 가용 영역(Availability Zone)이라고 알려진 격리된 위치를 여러 개 가지고 있는데 한 가용 영역에서 장애가 발생하더라도 다른 가용 영역에서 서비스를 운영할 수 있도록 2개의 가용 영역으로 구성합니다. 구성을 위해서 VPC 콘솔로 이동 후 Create VPC 버튼을 눌러서 VPC 생성을 시작합니다. 

<p align="center">
<img width="472" alt="region-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/d830b931-90fb-4587-9557-945da2a9c09d">
</p>

<p align="center">
<img width="1024" alt="0" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/597166b5-7584-4cee-b9af-ea039a99384f">
</p>

Resources to create으로 VPC and more를 선택합니다. 2개의 AZ를 구성할 예정이기 때문에 Number of Availability Zones (AZs) 값으로 2를 선택합니다. 그리고 Number of public subnets 은 2, Number of private subnets는 2를 선택합니다. 전체 구성은 아래와 같습니다. 

<p align="center">
<img width="400" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/40047ac6-99cc-44ef-b5f9-fdd714b1349e">
<img width="400" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/d243317d-ed30-4262-9505-e10d0a922f21">
<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/6ad72229-d781-4606-a751-f2d9b479bd81">
</p>

구성을 완료한 다음에 Create VPC 버튼을 누르고 기다리면 VPC와 Subnet이 생성된 것을 확인할 수 있습니다.

# Amazon ECS 클러스터 구성
Amazon ECS(Elastic Container Service) 콘솔로 이동 후 왼쪽 메뉴에서 Clusters를 선택하고 Create Cluster 버튼을 눌러서 클러스터를 생성을 시작합니다. 

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/28445be5-3374-43f4-b611-72b928a5e5c2">

클러스터는 아래 그림과 같이 구성합니다. 이름은 AppEcsCluster로 입력합니다. 그리고 Multi Available Zone 에 클러스터를 구성하기 때문에 각 Available Zone 에 위치한 Private Subnet을 각각 선택합니다. 또한 AWS Fargate를 사용하기 때문에 Infrastructure에서 AWS Fargate (serverless)를 선택합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c16d52f1-9f8e-40aa-88aa-fb4f19ebaa45">
<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/46bbb48d-59de-43a9-8540-aeeea82e75c1">
<img width="1024" alt="4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/e598504f-85ab-447c-8df2-4319226701e4">

구성을 완료한 다음에 Create 버튼을 누르고 기다리면 Amazon ECS 클러스터가 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/a18254a4-362e-488a-84f2-b6bf7f6bafd3">


# Sample Project 다운로드
다음 명령어를 수행하여 애플리케이션 구성에 필요한 코드를 다운로드합니다.

```
git clone https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice

```

# AWS Fargate 기반 Web Service 구성

AWS Fargate 기반 Web 서비스를 구성하기 위해서 여러 단계를 거칩니다. 먼저 다운로드한 프로젝트에서 Web Application을 Docker로 빌드합니다. 그리고 빌드한 이미지를 Amazon ECR 에 등록하여 AWS ECS Service 에 배포할 준비를 합니다. 다음으로 Web 서비스와 로드 밸런서에 적용할 Security Group을 생성하고 로드 밸런서를 생성합니다. 마지막으로 Web 서비스 구성을 위한 태스크 정의를 하고 Web 서비스를 생성합니다.


## Web Application 빌드

다운로드한 프로젝트에서 [Web Application](https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/tree/main/web)을 빌드합니다. 콘솔이나 터미널에서 /web 폴더로 이동 후 다음 명령어로 Docker 빌드를 진행합니다.
```
docker build  -t app-web .
```

Mac M1, M2 환경에서는 기본 linux/arm64로 빌드되기 때문에 다음 명령어로 Docker 빌드를 수행합니다.
```
docker buildx build --platform=linux/amd64 -t app-web .
```

Docker 이미지가 빌드되었는지 확인합니다.
```
docker images
```

## Amazon ECR 에 Web Application 이미지 등록
Amazon ECR(Elastic Container Registry) 콘솔로 이동 후 왼쪽 메뉴에서 Repositories를 선택합니다. 그리고 Private 탭에서 Create repository 버튼을 눌러서 레파지토리 생성을 시작합니다.

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/d3b7c698-c72e-4a00-92b8-3d1f093671ef">

레파지토리는 다음 그림과 같이 구성합니다. 이름은 app-web으로 입력하고 나머지는 그대로 둡니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c11ff57f-b3c8-455c-bef3-976548fe968b">

구성을 완료한 다음에 맨 아래에 있는 Create 버튼을 누르고 기다리면 레파지토리가 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/9e7e97fd-7f1d-4b70-ba4c-e7d26b136931">

다음으로 생성한 레파지토리의 app-web 링크를 눌러서 이동합니다. 그리고 오른쪽의 View push commands 버튼을 눌러서 계정을 인증하고 빌드한 이미지를 생성한 레파지토리에 푸시합니다. 앞에서 이미지를 이미 빌드한 경우에 빌드 명령어는 제외해도 괜찮습니다.

<img width="1024" alt="4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/00b58583-7101-4d60-bc39-8f00fe9208a6">

이미지 푸시를 완료하면 다음과 같이 등록된 것을 확인할 수 있습니다.

<img width="1024" alt="5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/2c162950-c223-4a20-88f6-ca65d2b0187e">


## Security Group 생성
AWS ECS에서 구동되는 Web 서비스에 적용할 보안 그룹과 서비스 앞에서 트래픽을 분산할 로드 배런서에 적용할 보안 그룹을 생성합니다. 먼저 로드 밸런서에 적용할 보안 그룹을 생성합니다. EC2 콘솔로 이동 후 왼쪽 메뉴에서 Security Groups를 선택합니다. 그리고 Create security group 버튼을 눌러서 보안 그룹 생성을 시작합니다. Security group name은 app-web-alb-sg로 지정합니다. VPC는 처음 생성한 app-vpc를 선택합니다. 외부와 HTTP 통신을 위해서 80 포트를 인바운드 값으로 허용하고 Source로 Anywhere를 선택합니다. 구성을 완료한 다음에 Create security group 버튼을 눌러서 보안 그룹을 생성합니다.

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/6a3f5456-5b5c-4d83-83e7-a05370ee7978">

다음으로 ECS 서비스에 적용할 보안 그룹을 생성합니다. Security group name 은 app-web-sg로 지정합니다. VPC는 처음 생성한 app-vpc를 선택합니다. 8000 포트 트래픽을 인바운드 값으로 허용하고 Source로 방금 생성한 app-web-alb-sg를 선택합니다. 구성을 완료한 다음에 Create security group 버튼을 눌러서 보안 그룹을 생성합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/9a189f8b-0b60-410b-b27d-8710eed86fd0">

기다리면 다음과 같이 두 개의 보안 그룹이 생성된 것을 확인할 수 있습니다. 보기 편하게 Name 값을 Security Group Name 과 동일하게 변경합니다.

<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/6694397b-d770-461e-ac4e-893c481a30b1">

## Load balancer 생성
AWS ECS의 Web 서비스 구성에 사용할 로드 밸런서를 생성합니다. EC2 콘솔로 이동 후 왼쪽 메뉴에서 Load balancers를 선택합니다. 그리고 Create load balancer 버튼을 눌러서 로드 밸런서 구성을 시작합니다. Application Load Balancer의 Create 버튼을 눌러서 생성을 시작합니다.

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/af78d083-6afb-420a-92f3-32a6f6206457">

Load balancer name는 app-web-alb를 입력하고 Scheme 은 Internet-facing을 선택합니다. Networking 구성에서 VPC는 생성해 둔 app-vpc를 선택하고 Subnets에는 public subnets 두 개를 선택합니다. 그리고 Security groups에는 미리 생성해 둔 app-web-alb-sg를 선택합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/f0ddfd81-b722-483e-a1a7-dd71e0adc4e1">
<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/258d0d78-2a1d-4f40-abfa-a502e5e37231">
<img width="1024" alt="4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/eb7bafa5-6508-4fdb-a29b-e028c4474c9f">

Listeners and routing에서 Create target group 버튼을 눌러서 신규 타겟 그룹의 구성을 시작합니다. Choose a target type는 IP addresses를 선택하고 Target group name 값으로 app-web-alb-tg를 입력하고 Port는 8000을 입력합니다. VPC는 app-vpc를 선택합니다. 그리고 Health check path 값으로 /health를 입력합니다. Next 버튼을 눌러서 다음 단계를 넘어간 뒤 Create target group 버튼을 눌러서 타겟 그룹을 생성을 완료합니다.

<img width="1024" alt="5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/7aa1ce60-8388-4302-852c-1fb635fbb0fa">
<img width="1024" alt="6" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/6801ec6a-818b-4281-b4fc-889a22568fe4">
<img width="1024" alt="7" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/f46520a7-41cd-4ef0-9843-741487c0406f">
다시 로드 밸런서 구성 페이지로 돌아옵니다. Select a target group 옆에 새로고침 아이콘 버튼을 눌러서 방금 생성한 타겟 그룹을 가져오고 선택합니다.

<img width="1024" alt="9" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/05ef5fae-ff64-420e-9bf1-b4ff12a4b771">

Create load balancer 버튼을 눌러서 로드 밸런서 생성을 완료합니다.

<img width="1024" alt="10" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/1b0fda5e-c3e8-4995-92ee-713ce87e2619">

## Task definitions 구성
Amazon ECS에서 Docker 컨테이너를 실행하기 위해서 태스크를 정의합니다. 하나의 태스크에서 한 개 이상의 컨테이너를 정의할 수 있습니다. 즉 서비스를 실행하기 위한 최소 단위라고 생각할 수 있습니다. Amazon ECS 콘솔로 이동 후 왼쪽 메뉴에서 Task definition을 열고 Create new task definition 버튼을 눌러서 태스크 정의를 시작합니다. 

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/a90b05e1-bb2a-4a19-8592-d75a526fe276">


태스크 정의는 다음 그림과 같이 구성합니다. Task definition family는 app-web-td로 지정합니다. 그리고 태스크를 구성할 컨테이너 정보를 입력합니다. Name 은 app-web으로 지정하고 Image URI는 ECR 콘솔에서 앞 단계에서 푸시한 이미지 URI를 찾아서 입력합니다. 포트는 8000으로 입력합니다. Next 버튼을 눌러서 다음으로 진행합니다. 

<p align="center">
<img width="800" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/5f5d98e5-befc-4a15-be00-ab9448093b8a">
</p>

모두 기본값으로 남기고 다시 Next 버튼을 눌러서 다음 진행 단계로 넘어갑니다. 구성을 확인하고 맨 아래에 있는 Create 버튼을 누르고 기다리면 태스크 정의가 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c32dd2c0-ec4c-4702-928a-7212677a7178">


## AWS ECS Service 생성
AWS ECS에서 구동되는 Web 서비스 구성을 위해서 AWS ECS 클러스터 콘솔로 이동합니다. 처음에 생성한 AppEcsCluster 링크를 클릭해서 들어간 뒤, Services 탭에서 Create 버튼을 눌러 서비스 구성을 시작합니다. 

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/f2d9d52f-c540-400e-802f-ba540d3cee29">

Environment는 다음과 같이 구성합니다. Compute options으로 Launch Type을 선택하고, Application type으로 Service를 선택합니다. 그리고 family 값으로 앞서 생성한 task definition 인 app-web-td을 선택합니다. Service Name으로는 app-web-service를 입력합니다. Desired tasks 값으로 2를 입력합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/879595fb-e543-40dc-9817-28512fde554b">
<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/ed0509fa-d887-4ecd-9457-a3dfed5a04bd">

Networking 구성에서 VPC는 생성해 둔 app-vpc를 선택하고 Subnets에는 private subnets 두 개를 선택합니다. 그리고 Security group에는 미리 생성해 둔 app-web-sg를 적용합니다. 그리고 로드 밸런서를 통해 접근할 예정이기 때문에 Public IP는 disable 해놓습니다.

<img width="1024" alt="4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/daf8cbce-ec3b-4ea9-8932-edd587f0c333">


Load Balancing 구성에서 Load balancer type으로 Application Load Balancer를 선택합니다. Use an existing load balancer를 선택하고 Load balancer로 app-web-alb를 선택합니다. Use an existing target group을 선택하고 app-web-alb-tg를 선택합니다.

<img width="1024" alt="alb2-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/2e263fd0-e5ab-4602-982f-4fc5364b397a">
<img width="1024" alt="alb2-2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/45af48c9-a0c3-45e3-8a86-8dd8bab71630">

Service auto scaling 구성에서 Use service auto scaling를 체크합니다. Minimum number of tasks 값으로 2를 입력하고 Maximum number of tasks 값으로 4를 입력합니다. Policy name 값으로 app-web-asg-policy을 입력합니다. ECS service metric으로 ECSServiceMetricAverageCPUUtilization을 선택하고 Target value로 70을 입력합니다. Scale-out cooldown period 과 Scale-in cooldown period 모두 300으로 입력합니다. 모든 구성을 완료한 다음에 Create 버튼을 눌러서 서비스를 생성합니다.

<img width="1024" alt="7-asg" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/6422f76d-bc8d-4016-8c66-12a10b537f17">
<img width="1024" alt="8-asg" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/2e2428d0-bb8c-4620-b147-113bd231777a">

Services 탭에서 app-web-service를 선택하고 Tasks 탭에 선택해서 들어가면 다음과 같이 태스크가 구동되는 것을 확인할 수 있습니다.

<img width="1024" alt="9" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/7c2d73b1-2548-43af-a998-2e208a369478">

## Web 서비스 접속 확인
앞서 생성한 로드 밸런서인 app-web-alb 에 들어가서 DNS name을 복사합니다. 복사한 URL을 통해서 접속할 수 있는지 웹 브라우저에서 확인합니다.

<img width="1024" alt="alb-11" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/8a8786c8-d967-4f75-b458-0f1681af7ea0">

![access-1](https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/a102c561-9f87-4fcc-8493-749eb13f45fc)


# AWS Fargate 기반 WAS Service 구성
이번 단계는 AWS Fargate 기반 WAS Service 구성과 비슷한 흐름으로 진행되지만 다른 부분이 있기 때문에 주의해서 보시기 바랍니다. Web Service를 구성했던 것과 마찬가지로 AWS Fargate 기반 WAS 서비스를 구성하기 위해서 여러 단계를 거칩니다. 먼저 다운로드한 프로젝트에서 WAS Application을 Docker로 빌드합니다. 그리고 빌드한 이미지를 Amazon ECR 에 등록하여 AWS ECS Service에 배포할 준비를 합니다. 다음으로 Web 서비스와 로드 밸런서에 적용할 Security Group을 생성하고 로드 밸런서를 생성합니다. 마지막으로 WAS 서비스 구성을 위한 태스크 정의를 하고 WAS 서비스를 생성합니다.

# Amazon SageMaker Endpoint 호출
이미지 분류를 위해서 학습한 모델이 배포된 Amazon SageMaker Endpoint 에 접근합니다. 접근을 위해서는 AWS SDK 인 boto3를 사용합니다. boto3를 사용하면 내부적으로 자격증명(Credentials)을 확인하기 때문에 편하게 접근할 수 있습니다. 다음 코드는 Amazon SageMaker Endpoint를 호출하는 코드 블록입니다. was/app/main.py에서 확인할 수 있습니다.

```
client = boto3.client("sagemaker-runtime")
endpoint_name = 'image-classifier'
response = client.invoke_endpoint(
    EndpointName=endpoint_name,
    Body=body,
    ContentType='application/json',
    Accept='Accept'
)
```

## WAS Application 빌드
다운로드한 프로젝트에서 WAS Application을 빌드합니다. 콘솔이나 터미널에서 /was 폴더로 이동 후 다음 명령어로 Docker 빌드를 진행합니다.

```
docker build  -t app-was .
```

Mac M1, M2 환경에서는 기본 linux/arm64로 빌드되기 때문에 다음 명령어로 Docker 빌드를 수행합니다.
```
docker buildx build --platform=linux/amd64 -t app-was .
```

Docker 이미지가 빌드되었는지 확인합니다.
```
docker images
```


## Amazon ECR 에 WAS Application 이미지 등록
Amazon ECR(Elastic Container Registry) 콘솔로 이동 후 왼쪽 메뉴에서 Repositories를 선택합니다. 기존에 등록한 app-web 레파지토리가 있는 것을 볼 수 있습니다. 우리는 WAS Application 레파지토리가 추가로 필요하기 때문에 Private 탭에서 Create repository 버튼을 눌러서 레지스트리를 생성을 시작합니다.

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/2403522d-e9e3-4802-a9bd-f52909f3e327">

레파지토리는 다음 그림과 같이 구성합니다. 이름은 app-was로 입력하고 나머지는 그대로 둡니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/016c07a9-d8de-44f9-a3ad-7c37a7d3380e">

구성을 완료한 다음에 맨 아래에 있는 Create 버튼을 누르고 기다리면 레파지토리가 생성된 것을 확인할 수 있습니다. 현재까지 총 2개의 레파지토리가 생성되었습니다.

<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/574d46aa-4304-4c70-8d04-68a2eb30b8da">

다음으로 생성한 레파지토리의 app-was 링크를 눌러서 이동합니다. 그리고 오른쪽의 View push commands 버튼을 눌러서 계정을 인증하고 빌드한 이미지를 생성한 레파지토리에 푸시합니다. 앞에서 이미지를 이미 빌드한 경우에 빌드 명령어는 제외해도 괜찮습니다.

<img width="1024" alt="4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/e2609f9d-8f7e-4ed7-b973-d310872ed9e7">

이미지 푸시를 완료하면 다음과 같이 등록된 것을 확인할 수 있습니다.

<img width="1024" alt="5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/0cb17fbf-abdc-4b72-8fbf-bce70411b594">


## Security Group 생성
AWS ECS에서 구동되는 WAS 서비스에 적용할 보안 그룹과 서비스 앞에서 트래픽을 분산할 로드 배런서에 적용할 보안 그룹을 생성합니다. 먼저 로드 밸런서에 적용할 보안 그룹을 생성합니다. EC2 콘솔로 이동 후 왼쪽 메뉴에서 Security Groups를 선택합니다. 그리고 Create security group 버튼을 눌러서 보안 그룹 생성을 시작합니다. Security group name 은 app-was-alb-sg로 지정합니다. VPC는 처음 생성한 app-vpc를 선택합니다. app-web-service와 HTTP 통신을 위해서 80 포트를 인바운드 값으로 허용하고 Source로 app-web-sg을 선택합니다. 구성을 완료한 다음에 Create security group 버튼을 눌러서 보안 그룹을 생성합니다.

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/fad61608-a6ac-4427-9af8-c1f87ced7f23">


다음으로 ECS 서비스에 적용할 보안 그룹을 생성합니다. Security group name 은 app-was-sg로 지정합니다. VPC는 처음 생성한 app-vpc를 선택합니다. 8081 포트 트래픽을 인바운드 값으로 허용하고 Source로 방금 생성한 app-was-alb-sg를 선택합니다. 구성을 완료한 다음에 Create security group 버튼을 눌러서 보안 그룹을 생성합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/0501297b-cdf6-4446-bc6b-4a0e96e19f14">

기다리면 다음과 같이 두 개의 보안 그룹이 추가된 것을 확인할 수 있습니다. 보기 편하게 Name 값을 Security Group Name 과 동일하게 변경합니다.

<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/3830fb05-d680-42c1-a25c-993e742ce870">

## Load balancer 생성
AWS ECS의 WAS 서비스 구성에 사용할 로드 밸런서를 생성합니다. EC2 콘솔로 이동 후 왼쪽 메뉴에서 Load balancers를 선택합니다. 그리고 Create load balancer 버튼을 눌러서 로드 밸런서 구성을 시작합니다. Application Load Balancer의 Create 버튼을 눌러서 생성을 시작합니다. Load balancer name은 app-was-alb로 입력하고 Scheme 은 Internal을 선택합니다. Networking 구성에서 VPC는 생성해 둔 app-vpc를 선택하고 Subnets에는 private subnets 두 개를 선택합니다. 그리고 Security groups에는 미리 생성해 둔 app-was-alb-sg를 선택합니다.

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/675bfa24-758c-401c-8d9d-a943c696397f">
<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/10d6a524-fc17-4545-ae3d-4281a46618e0">
<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/0422c34f-c888-46f0-93c8-e707f7335fdc">

Listeners and routing에서 Create target group을 누르고 신규 타겟 그룹을 생성합니다. Choose a target type는 IP addresses를 선택하고 Target group name 값으로 app-was-alb-tg를 입력하고 Port는 8081을 입력합니다. VPC는 app-vpc를 선택합니다. 그리고 Health check path 값으로 /health를 입력합니다. Next 버튼을 눌러서 다음 단계를 넘어간 뒤 Create target group 버튼을 눌러서 타겟 그룹을 생성을 완료합니다.

<img width="1024" alt="4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/50f1a9d3-a53a-46e1-9183-515acf7d764c">
<img width="1024" alt="5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/450cc4ad-e187-4fa2-9989-d084af3e92ce">
<img width="1024" alt="6" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/41a2859a-d0ab-4a44-863f-685d9661c3ee">

다시 로드 밸런서 구성 페이지로 돌아옵니다. Select a target group 옆에 새로고침 아이콘 버튼을 눌러서 방금 생성한 타겟 그룹을 가져오고 선택합니다.

<img width="1024" alt="7" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/5b35fbe6-24c4-4257-8672-3d67c619ac30">

Create load balancer 버튼을 눌러서 로드 밸런서 생성을 완료합니다.

<img width="1024" alt="8" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/98c39d68-c42b-4ca0-a961-e98e78687fb8">

생성한 app-was-alb를 눌러서 DNS name을 확인하고 복사해 둡니다. WAS 서비스 구성이 마치면 해당 주소로 접속할 수 있으며 Web 서비스의 애플리케이션에서 접근할 수 있는 주소입니다.

<img width="1024" alt="alb-9" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/a35481d5-9d1f-4151-9eb6-eecbaefa397e">

## Task definitions 구성
Task definition을 구성하기 전에 Task에서 Amazon SageMaker Endpoint를 호출하기 위한 역할을 먼저 생성합니다. Identity and Access Management(IAM) 콘솔로 이동합니다. 왼쪽 메뉴에서 Roles를 선택하고 Create role 버튼을 눌러서 역할 생성을 시작합니다.

<img width="1024" alt="0-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/e39a12ee-f494-4d77-a552-751a823fd437">

Trusted entity type으로 AWS service를 선택합니다. User Case 아래 있는 Use cases for other AWS services에서 Elastic Container Service를 선택합니다. 그리고 다시 Elastic Container Service Task를 선택합니다. 구성은 다음과 같습니다. Next 버튼을 눌러서 다음 진행 단계로 넘어갑니다. 

<img width="1024" alt="0-2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c4e81f64-342a-4386-a0d8-df474d7a0ac8">

Add permissions 단계에서 Create policy를 눌러서 정책 생성을 시작합니다. 

<img width="1024" alt="0-3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c00a4792-c7bc-418d-bad2-03ab4586d40b">

Policy editor에서 JSON을 선택하고 아래와 같이 입력하고 Next 버튼을 눌러서 다음 단계로 넘어갑니다. 

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "sagemaker:InvokeEndpoint",
            "Resource": "*"
        }
    ]
}
```

<img width="1024" alt="0-4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/e528911f-8bf5-4d56-bcfc-cf5bce38e7c6">

Policy name 에 InvokeSageMakerEndpoint을 입력하고 맨 아래에 있는 Create policy 버튼을 눌러서 정책을 생성합니다.

<img width="1024" alt="0-5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c55065e6-ecf1-4200-b9ab-d2dfa1ff28c0">

InvokeSageMakerEndpoint로 검색하면 다음과 같이 정책이 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="0-6" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/1dd1342f-81b0-491e-8ae5-1e2981a03311">

역할을 생성하던 페이지로 다시 돌아온 뒤 Create Policy 버튼 옆에 있는 새로고침 아이콘 버튼을 눌러서 정책 리스트를 다시 로드합니다. InvokeSageMakerEndpoint을 검색하면 방금 생성한 정책이 나옵니다. 나온 정책을 선택하고 Next 버튼을 눌러서 다음 단계로 진행합니다.

<img width="1024" alt="0-7" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/e94ff1f5-3171-4817-a675-f38bdcc6b54e">

Role name으로 ecsWasTaskRole을 입력하고 Create role 버튼을 눌러서 역할 생성을 완료합니다.

<img width="1024" alt="0-8" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/214abdd0-67a7-4fab-846b-260a33bb4968">

Amazon ECS 콘솔로 이동 후 왼쪽 메뉴에서 Task definition을 선택합니다. 기존에 등록한 app-web 레파지토리가 있는 것을 볼 수 있습니다. Create new task definition 버튼을 눌러서 태스크 정의를 시작합니다. 

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/a4cb9be8-9e55-413b-86cb-d7aae34dccce">

태스크 정의는 다음 그림과 같이 구성합니다. Task definition family는 app-was-td로 지정합니다. 그리고 태스크를 구성할 컨테이너 정보를 입력합니다. Name 은 app-was로 지정하고 Image URI는 ECR 콘솔에서 앞 단계에서 푸시한 이미지 URI를 찾아서 입력합니다. 포트는 8081로 입력합니다. Environment 칸에 있는 Task role 에 앞서 생성한 ecsWasRole을 선택하여 입력합니다. Next 버튼을 눌러서 다음으로 진행합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/5e4c9828-12c6-4f46-bbf9-e189b134fac9">

<img width="1024" alt="2-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/63fa0856-98e6-4704-acf3-fc649004179d">

Next 버튼을 눌러서 다음 진행 단계로 넘어갑니다. 구성을 확인하고 맨 아래에 있는 Create 버튼을 누르고 기다리면 태스크 정의가 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c39dfaae-f206-47aa-87d6-8517df60ec14">


## AWS ECS Service 생성
AWS ECS에서 구동되는 WAS 서비스 구성을 위해서 AWS ECS 클러스터 콘솔로 이동합니다. 처음에 생성한 AppEcsCluster 링크를 클릭해서 들어간 뒤, Services 탭을 보면 기존에 구성한 Web 서비스가 있는 것을 볼 수 있습니다. Create 버튼을 눌러 WAS 서비스 구성을 시작합니다.

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/8d7f52b9-a9f3-434f-aeb8-4b6867805eb6">

Environment는 다음과 같이 구성합니다. Compute options로 Launch Type을 선택하고, Application type으로 Service를 선택합니다. 그리고 family 값으로 앞서 생성한 task definition 인 app-was-td를 선택합니다. Service Name으로는 app-was-service를 입력합니다. Desired tasks 값으로 2를 입력합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/f833f315-3b2b-423b-b8eb-b899c105eeca">
<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/f4d1d260-4464-4a59-b3d5-59ef88c1922c">

Networking 구성에서 VPC는 생성해 둔 app-vpc를 선택하고 Subnets에는 private subnets 두 개를 선택합니다. 그리고 Security group에는 미리 생성해 둔 app-was-sg를 적용합니다. 그리고 로드 밸런서를 통해 접근할 예정이기 때문에 Public IP는 disable 해놓습니다.

<img width="1024" alt="4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/9c006b3e-a915-4280-822e-b7c7906feeef">

Load Balancing 구성에서 Load balancer type으로 Application Load Balancer를 선택합니다. Use an existing load balancer를 선택하고 Load balancer로 app-was-alb를 선택합니다. Use an existing target group을 선택하고 app-was-alb-tg를 선택합니다.

<img width="1024" alt="alb2-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/fd218e66-bb5a-4db7-bebe-972f62c99437">
<img width="1024" alt="alb2-2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/89b76348-d491-4d39-95e4-2ec4d09681d5">

Service auto scaling 구성에서 Use service auto scaling을 체크합니다. Minimum number of tasks 값으로 2를 입력하고 Maximum number of tasks 값으로 4를 입력합니다. Policy name 값으로 app-was-asg-policy을 입력합니다. ECS service metric으로 ECSServiceMetricAverageCPUUtilization을 선택하고 Target value로 70을 입력합니다. Scale-out cooldown period 과 Scale-in cooldown period 모두 300으로 입력합니다. 모든 구성을 완료한 다음에 Create 버튼을 눌러서 서비스를 생성합니다.

<img width="1024" alt="7" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/4718b952-272c-427e-bfcc-34930f1592b5">
<img width="1024" alt="8" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/00cff2ba-f12d-4146-80d5-72bc3714bd2d">

Services 탭에서 app-was-service를 선택하고 Tasks 탭에 선택해서 들어가면 다음과 같이 태스크가 구동되는 것을 확인할 수 있습니다.

<img width="1024" alt="11" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/8335dfc5-35b3-4cef-b86a-ce901c802d8f">

## WAS 서비스 접속 확인
WAS 서비스의 로드 밸런서는 프라이빗 서브넷에 있기 때문에 직접 접속할 수 없습니다. 그렇기 때문에 Web 서비스에 배포된 애플리케이션에서 제공하는 웹 페이지를 통해서 접속을 확인합니다. 앞서 생성한 Web 애플리케이션에 접속합니다. 그리고 왼쪽 위에 있는 'WAS 접속 확인 페이지' 버튼을 눌러서 이동합니다. 텍스트 입력 창에 WAS 서비스의 로드 밸런서인 app-was-alb의 주소를 입력하고 'WAS 접속 확인' 버튼을 누릅니다. {"was-health":{"message":"WAS-Connected"}} 메시지가 보이면 정상적으로 배포되어 Web 서비스에서 접근이 가능한 상태입니다.

<p align="center">
<img width="621" alt="check-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/bd7e0f32-1402-4751-9e31-25226b1b0897">

<img width="354" alt="check-2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/4ff39510-436a-4f8d-8d92-eeaced03c48f">
</p>


# AWS CodePipeline을 이용한 CI/CD 구성
CI/CD를 구성하기 위해서 CodeCommit와 CodeBuild를 먼저 구성하고 CodePipeline 과 연결합니다.

## AWS CodeCommit 레파지토리 구성
CodeCommit 레파지토리를 생성하고 다운받았던 web 과 app 프로젝트 코드를 새로 생성한 레파지토리에 올려야 합니다. 먼저 AWS CodeCommit 콘솔로 이동 후 Create repository 버튼을 눌러서 생성을 시작합니다. 

<img width="1024" alt="commit-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/26beeddc-7b68-4dd6-be76-7ce72c24957f">

Repository name 은 app-web으로 입력하고 Create 버튼을 눌러서 레파지토리 생성을 완료합니다. 그리고 가이드에 따라서 빈 레파지토리를 클론합니다.

<img width="1024" alt="commit-2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/25b49439-3701-4a5b-bbe7-4a639b91d74b">
<img width="1024" alt="commit-3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/2866e7f7-715c-4d61-b4ea-3c5aadc61a0d">

기존 사용하던 web 프로젝트 폴더 안의 내용을 모두 복사해서 클론한 app-web 폴더에 붙여넣습니다. 그리고 app/router.js 파일에서 BASE_URL을 앞서 생성한 app-was-alb 주소로 변경합니다. 프로토콜은 HTTP 입니다.

```
// Redirect
const request = require('request');
BASE_URL = "HTTP://[app-was-alb 도메인 주소]"
```

 변경한 코드를 저장한 다음에 푸시합니다. 푸시가 완료되면 다음과 같이 확인할 수 있습니다.

<img width="1024" alt="commit-4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/1c450d66-c743-4d14-987e-27f684c54459">

WAS 프로젝트 코드도 위와 동일한 방법으로 진행합니다. Repository name 은 app-was로 입력합니다. 완료되면 아래와 같이 두 개의 레파지토리에 코드가 모두 업로드된 것을 확인할 수 있습니다.

<img width="1024" alt="commit-5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/7ee7f841-f258-4080-bf6f-bc610472f116">


## AWS CodePipeline 구성

AWS CodePipeline 콘솔로 이동 후 Create pipeline 버튼을 눌러서 구성을 시작합니다. 

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/07d920af-1d60-4df5-ad86-6ac263506090">

Pipeline name 값으로 app-web-pipeline을 입력하고 Next 버튼을 눌러서 다음 단계를 진행합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/ae729821-a4b8-4925-9068-34c89bc1327a">

Source provider으로 AWS CodeCommit을 선택하고 Repository name 은 app-web을 선택합니다. Branch name 은 main을 선택합니다. Next 버튼을 눌러서 다음 단계를 진행합니다. 

<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/7c82fd3b-653b-483c-9ed9-17540294a089">

Build provider으로 AWS CodeBuild를 선택하고 Project name 아래 있는 Create project 버튼을 눌러서 빌드 프로젝트 생성을 시작합니다. 

팝업으로 뜬 창에서 Project name으로 appWebBuild을 입력합니다. Environment에서 Operating system 은 Amazon Linux2를 선택하고 Runtime(s) 은 Standard를 선택하고 Image는 aws/codebuild/amazonlinux2-aarch64-standard:4.0를 선택합니다. Privileged는 체크합니다. 나머지는 그대로 유지합니다.

<img width="1024" alt="build2-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/914d6c08-eaea-4f31-b7f6-17a1210871a0">

<img width="1024" alt="build2-2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/3f970514-809f-416c-a9af-0ebf9cfd681b">

Buildspec에서 Insert build commands를 선택합니다. Switch to editor 버튼을 눌러서 에디터 창을 오픈합니다. 아래 코드에서 ECR_URI 값을 앞서 생성한 app-web의 ECR 주소로 변경하고 전체 복사하여 붙여 넣습니다. 아래로 스크롤을 내린 뒤 CloudWatch logs - optional 체크를 해제합니다. 입력을 모두 마치면 Continue to CodePipeline 버튼을 눌러서 빌드 프로젝트 생성을 완료하고 팝업을 닫습니다. 

```
version: 0.2

phases:
  pre_build:
    commands:
      - ECR_URI=933988069619.dkr.ecr.us-west-2.amazonaws.com/app-web
      - IMAGE_TAG=latest
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin $ECR_URI
  build:
    commands:
      - echo Building the Docker image...
      - docker build -t app-web .
      - docker tag app-web:latest $ECR_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Pushing the Docker image...
      - docker push $ECR_URI:latest
      - printf '[{"name":"app-web","imageUri":"%s"}]' $ECR_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
    files: imagedefinitions.json
```

<img width="1024" alt="build2-3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/68f97391-2685-4e43-858d-5b454f9d5023">

Deploy provider으로 Amazon ECS를 선택하고 Cluster name으로 AppEcsCluster를 선택합니다. Service name으로 app-web-service을 선택합니다. Next 버튼을 눌러서 다음 리뷰를 진행합니다. 리뷰를 마친 뒤 Create pipeline 버튼을 눌러서 구성을 완료합니다. 


<img width="1024" alt="build2-4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/049285b0-a9b3-40f8-a0c2-d397dd5a9043">

빌드 과정에서 ECR 에 로그인이 필요하기 때문에 정책을 추가해야 합니다. Identity and Access Management(IAM) 콘솔로 이동합니다. 왼쪽 메뉴에서 Roles를 선택하고 codebuild-appWebBuild-service-role을 검색해서 선택합니다. Add permissions 버튼을 누르고 Attach policies를 선택합니다. AmazonEC2ContainerRegistryPowerUser를 검색하고 체크하고 Add permissions 버튼을 눌러서 정책을 추가합니다. 추가가 완료되면 다음과 같이 두 개의 정책이 있는 것을 확인할 수 있습니다.

<img width="1024" alt="build2-5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/4a47f6cc-56d6-4c3c-bde6-f652ae7602a4">

다시 파이프라인으로 돌아가서 Release change 버튼을 선택해서 파이프라인을 실행합니다. 

<p align="center">
<img width="450" alt="build2-6" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c4e2a5c5-fca8-42e8-81cc-258dc54ebddb">
<img width="450" alt="build2-7" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/314eadf8-a21e-4abd-89b2-3b95f62eb38d">
</p>

동일한 방식으로 app-was를 위한 파이프라인을 생성합니다. 생성할 때 사용되는 값들은 web 대신 was로 변경합니다. Buildspec 에 있는 코드도 was 에 맞게 수정합니다. 구성이 완료되면 아래와 같이 두 개의 파이프라인이 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="build-9" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/333195e1-f780-4a08-8283-31d0a1bec8d7">

# Amazon SageMaker Studio 생성
기계 학습 모델을 학습하고 배포하는 환경을 구성하기 위해서 웹 기반 통합 개발 환경(IDE)인 Amazon SageMaker Studio를 이용합니다. Amazon SageMaker 콘솔로 이동 후 왼쪽 메뉴에서 Domains를 선택하고 Create Domain 버튼을 눌러서 도메인 생성을 시작합니다.

<img width="1024" alt="studio-1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/9aae352b-626b-4016-ac99-9f223e30f059">

Quick setup (1 min)을 선택하고 Name으로 app-sagemaker-studio을 입력하고 Execution role 은 Create a new role을 선택합니다. 팝업으로 뜬 창에서 Any S3 bucket을 선택하고 나머지는 그대로 두고 Create role 버튼을 눌러서 롤을 생성합니다. 그리고 나머지 설정은 그대로 유지하고 Submit 버튼을 눌러서 Domain을 생성합니다. 

<img width="1024" alt="studio-2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/2357af63-d516-4490-b947-fa0a875bf763">
<img width="1024" alt="studio-3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/1e8b27e9-d773-4958-89f0-13264336d774">

도메인 생성시 뜨는 팝업에서 vpc는 app-vpc를 선택하고 subnet 은 public subnet 하나를 선택합니다. 

<p align="center">
<img width="970" alt="studio-3 5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/97af258a-1867-420c-acb6-4424a29f6734">
</p>

도메인이 생성되면 도메인 이름을 선택해서 들어간 다음에 생성된 사용자 오른쪽에 있는 Launch 버튼을 펼쳐서 Studio 에 접속합니다.

<img width="1024" alt="studio-4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/024e3c39-1440-4127-a4db-d3f72070c160">


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


# AI 웹 애플리케이션 동작 확인
로드 밸런서(app-web-alb-sg)의 도메인 주소를 통해서 WAS 서비스에서 구동되고 있는 애플리케이션에 접속합니다. 빨간 사진기 버튼을 눌러서 학습한 꽃 이미지 중 하나를 선택합니다. 노란 돋보기 버튼을 눌러서 분석을 요청하고 기다립니다. 기다리면 분석과 함께 설명이 나오는 것을 확인할 수 있습니다.

<p align="center">
<img width="553" alt="app-0" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/5b49f6e1-2bf4-40db-bde7-b9112abb7ce9">
</p>

# 리소스 삭제
실습 후 추가 과금을 방지하기 위해서 사용한 리소스를 모두 삭제해야 합니다. Amazon S3 콘솔로 이동해서 직접 생성한 버킷을 모두 삭제하고 'codepipeline-', 'sagemaker-' 로 시작하는 생성된 버킷도 모두 삭제합니다. Amazon ECR 콘솔로 이동해서 생성한 Repository를 모두 삭제합니다.

CodePipeline 콘솔로 이동해서 왼쪽 메뉴의 Repositories, Build projects, Pipelines 에 들어가서 생성한 리소스를 모두 삭제합니다. Amazon Elastic Container Service 콘솔로 이동해서 생성한 Cluster를 삭제합니다. EC2 콘솔로 이동해서 왼쪽 메뉴의 Target Groups, Load Balancers, Security Groups 에 들어가서 생성한 리소스를 모두 삭제합니다. 

Amazon SageMaker 콘솔로 이동합니다. 그리고 오른쪽 메뉴에서 Domains로 이동합니다. 생성한 도메인을 선택해서 들어간 다음 사용자를 선택합니다. Delete App 버튼을 눌러서 사용중인 App 을 모두 삭제하고 Edit 버튼을 눌러서 사용자도 함께 삭제합니다. 사용자가 삭제되었으면 생성한 도메인을 삭제합니다. 그리고 왼쪽 메뉴 Models, Endpoints, Endpoint configuration 에 들어가서 파이프라인에서 생성한 리소스를 모두 삭제합니다.

마지막으로 VPC 콘솔로 이동해서 생성한 NAT Gateways, Subnets, Route Tables, Network ACLs, Internet Gateways, Security Groups 을 삭제하고 VPC 를 삭제합니다.


# 결론
이 글에서는 AWS에서 제공하는 다양한 서비스를 이용하여 꽃 이미지 분류를 위한 AI 애플리케이션 구축하는 방법을 소개했습니다. 컨테이너화된 애플리케이션을 쉽게 배포, 관리, 확장할 수 있도록 도와주는 완전 관리형 컨테이너 오케스트레이션 서비스인 Amazon ECS와 기계 학습 모델을 학습하고 배포하여 운영할 수 있는 Amazon SageMaker를 대규모 트래픽에도 유연하게 확장할 수 있도록 했습니다. 그리고 Amazon SageMaker Pipelines를 이용하여 기계 학습 모델 학습 및 배포를 자동화하고 AWS CodePipeline을 이용해서 컨테이너 통합 및 배포를 위한 CI/CD 파이프라인을 구축하는 방법을 소개했습니다. 애플리케이션 규모가 커지더라도 마이크로서비스 및 모델의 확장과 운영에 유연한 아키텍처로 최신 AI 애플리케이션을 구현하는데 참고가 될 수 있을 것으로 기대됩니다.


# Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

# License

This library is licensed under the MIT-0 License. See the LICENSE file.

