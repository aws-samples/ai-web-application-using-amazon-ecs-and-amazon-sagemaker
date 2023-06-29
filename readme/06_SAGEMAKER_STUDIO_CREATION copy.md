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
