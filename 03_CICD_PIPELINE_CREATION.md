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
