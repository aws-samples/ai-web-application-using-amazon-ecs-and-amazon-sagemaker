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