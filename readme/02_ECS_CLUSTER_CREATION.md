# Amazon ECS 클러스터 구성
Amazon ECS(Elastic Container Service) 콘솔로 이동 후 왼쪽 메뉴에서 Clusters를 선택하고 Create Cluster 버튼을 눌러서 클러스터를 생성을 시작합니다. 

<img width="1024" alt="1" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/28445be5-3374-43f4-b611-72b928a5e5c2">

클러스터는 아래 그림과 같이 구성합니다. 이름은 AppEcsCluster로 입력합니다. 그리고 Multi Available Zone 에 클러스터를 구성하기 때문에 각 Available Zone 에 위치한 Private Subnet을 각각 선택합니다. 또한 AWS Fargate를 사용하기 때문에 Infrastructure에서 AWS Fargate (serverless)를 선택합니다.

<img width="1024" alt="2" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/c16d52f1-9f8e-40aa-88aa-fb4f19ebaa45">
<img width="1024" alt="3" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/46bbb48d-59de-43a9-8540-aeeea82e75c1">
<img width="1024" alt="4" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/e598504f-85ab-447c-8df2-4319226701e4">

구성을 완료한 다음에 Create 버튼을 누르고 기다리면 Amazon ECS 클러스터가 생성된 것을 확인할 수 있습니다.

<img width="1024" alt="5" src="https://github.com/hijigoo/ecs-fargate-sagemaker-based-webservice/assets/1788481/a18254a4-362e-488a-84f2-b6bf7f6bafd3">
