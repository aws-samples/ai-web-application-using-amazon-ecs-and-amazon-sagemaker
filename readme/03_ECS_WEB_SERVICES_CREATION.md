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
