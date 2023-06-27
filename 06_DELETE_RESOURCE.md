# 리소스 삭제
실습 후 추가 과금을 방지하기 위해서 사용한 리소스를 모두 삭제해야 합니다. Amazon S3 콘솔로 이동해서 직접 생성한 버킷을 모두 삭제하고 'codepipeline-', 'sagemaker-' 로 시작하는 생성된 버킷도 모두 삭제합니다. Amazon ECR 콘솔로 이동해서 생성한 Repository를 모두 삭제합니다.

CodePipeline 콘솔로 이동해서 왼쪽 메뉴의 Repositories, Build projects, Pipelines 에 들어가서 생성한 리소스를 모두 삭제합니다. Amazon Elastic Container Service 콘솔로 이동해서 생성한 Cluster를 삭제합니다. EC2 콘솔로 이동해서 왼쪽 메뉴의 Target Groups, Load Balancers, Security Groups 에 들어가서 생성한 리소스를 모두 삭제합니다. 

Amazon SageMaker 콘솔로 이동합니다. 그리고 오른쪽 메뉴에서 Domains로 이동합니다. 생성한 도메인을 선택해서 들어간 다음 사용자를 선택합니다. Delete App 버튼을 눌러서 사용중인 App 을 모두 삭제하고 Edit 버튼을 눌러서 사용자도 함께 삭제합니다. 사용자가 삭제되었으면 생성한 도메인을 삭제합니다. 그리고 왼쪽 메뉴 Models, Endpoints, Endpoint configuration 에 들어가서 파이프라인에서 생성한 리소스를 모두 삭제합니다.

마지막으로 VPC 콘솔로 이동해서 생성한 NAT Gateways, Subnets, Route Tables, Network ACLs, Internet Gateways, Security Groups 을 삭제하고 VPC 를 삭제합니다.