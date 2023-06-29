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