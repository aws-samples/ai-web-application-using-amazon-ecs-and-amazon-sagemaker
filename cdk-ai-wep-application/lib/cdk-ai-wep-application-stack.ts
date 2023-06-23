import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as path from "path";
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
// import * as ecrdeploy from 'cdk-ecr-deployment';
// import * as aws_elasticloadbalancingv2 from 'aws-cdk-lib/ aws_elasticloadbalancingv2';
import * as logs from "aws-cdk-lib/aws-logs"
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CdkAiWepApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC, Subnet
    const vpc = new ec2.Vpc(this, 'my-app-vpc', {
      maxAzs: 2, // Default is all AZs in region
      natGateways: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      vpcName : 'app-vpc',
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC, // PUBLIC, PRIVATE_ISOLATED, PRIVATE_WITH_EGRESS
          cidrMask: 20,
          name: 'public'
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 20,
          name: 'private'
        },
      ]
    });
    
    // ecs cluster
    const cluster = new ecs.Cluster(this, "AppEcsCluster", {
      vpc: vpc,
      clusterName: "AppEcsCluster"
    }); 

    // Security Group - app-web-alb-sg
    const sg_WebAlb = new ec2.SecurityGroup(this, "AppWebAlbSg", {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'security group',
      securityGroupName: "app-web-alb-sg",
    }); 
    sg_WebAlb.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow HTTP traffic from anywhere',
    );  

    // Security Group - app-web-sg
    const sg_Web = new ec2.SecurityGroup(this, "AppWebSg", {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'security group',
      securityGroupName: "app-web-sg",
    }); 
    sg_Web.addIngressRule(
      ec2.Peer.securityGroupId(sg_WebAlb.securityGroupId),
      ec2.Port.tcp(8000),
      'allow TCP traffic from Web',
    );  
    
    // ECR image registration for Web
    const webImage = ecs.ContainerImage.fromAsset('../web');
    
    // Fargate task definition for Web
    const taskDefinition_Web = new ecs.FargateTaskDefinition(this, 'ServiceTaskForWeb', {
      family: 'app-web-td'
    });
    taskDefinition_Web.addContainer('app-web', {
      image: webImage,
      portMappings: [{ 
        containerPort: 8000,
        protocol: ecs.Protocol.TCP,  
        name: "app-web-8000-tcp",
        appProtocol: ecs.AppProtocol.http,        
      }],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'AppWeb',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }), 
      containerName: "app-web"
    });

    // Fargate Service for WEB
    const fargateService_Web = new ecs.FargateService(this, 'ServiceForWeb', {
      cluster: cluster,
      taskDefinition: taskDefinition_Web,
      serviceName: "app-web-service",
      desiredCount: 2,
      assignPublicIp: false,
      securityGroups: [sg_Web],      
    }); 
    // Setup AutoScaling policy
    const scalingWeb = fargateService_Web.autoScaleTaskCount({ 
      minCapacity: 2,
      maxCapacity: 4      
    });
    scalingWeb.scaleOnCpuUtilization('CpuScalingWeb', {
      policyName: "app-web-asg-policy",
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300)
    });

    // load balancer for Web
    const alb_web = new elbv2.ApplicationLoadBalancer(this, 'alb', {
      loadBalancerName: "app-web-alb",
      internetFacing: true,
      ipAddressType: elbv2.IpAddressType.IPV4,
      vpc: vpc,
      securityGroup: sg_WebAlb,
    });
    const listener = alb_web.addListener('Listener', {
      port: 80,
      open: true,
    }); 
    listener.addTargets('targetServiceWeb', {
      targets: [fargateService_Web],
      healthCheck: {
        enabled: true,
        path: '/health',
      },
      targetGroupName: "app-web-alb-tg",
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 8000,
      protocolVersion: elbv2.ApplicationProtocolVersion.HTTP1,      
    }); 
    
    new cdk.CfnOutput(this, 'WebPageURL', {
      value: "http://"+alb_web.loadBalancerDnsName,
      description: 'Url of webpage',
    }); 

    ////////////////////////////////////////////////////////    
    // Security Group - app-was-alb-sg
    const sg_WasAlb = new ec2.SecurityGroup(this, "AppWasAlbSg", {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'security group of WAS ALB',
      securityGroupName: "app-was-alb-sg",
    }); 
    sg_WasAlb.addIngressRule(
      ec2.Peer.securityGroupId(sg_Web.securityGroupId),
      ec2.Port.tcp(80),
      'allow HTTP traffic from WEB',
    );  

     // Security Group - app-was-sg
     const sg_Was = new ec2.SecurityGroup(this, "AppWasSg", {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'security group of WAS',
      securityGroupName: "app-was-sg",
    }); 
    sg_Was.addIngressRule(
      ec2.Peer.securityGroupId(sg_WasAlb.securityGroupId),
      ec2.Port.tcp(8081),
      'allow tcp traffic from WAS ALB',
    );  

    // ECR image registration for Was
    const wasImage = ecs.ContainerImage.fromAsset('../was'); 

    const wasTaskRole = new iam.Role(this, "EcsWasTaskRole", {
      roleName: "ecsWasTaskRole",
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com")
    });
    wasTaskRole.attachInlinePolicy(new iam.Policy(this, 'EcsWasTaskPolicy', {
      policyName: "InvokeSageMakerEndpoint",
      statements: [new iam.PolicyStatement({
        actions: ['sagemaker:InvokeEndpoint'],   
        resources: ['*'],
      })],
    }));
   
    // Fargate task definition for WAS
    const taskDefinition_Was = new ecs.FargateTaskDefinition(this, 'ServiceTaskForWas', {
      family: 'app-was-td',
      cpu: 1024, // 1024 (1 vCPU) 
      memoryLimitMiB: 3072, // 3 GB,
      taskRole: wasTaskRole,
      // runtimePlatform: {cpuArchitecture: ecs.CpuArchitecture.ARM64}  // X86_64 or ARM64
    });
    taskDefinition_Was.addContainer('app-was', {
      image: wasImage,
      portMappings: [{ 
        containerPort: 8081,
        protocol: ecs.Protocol.TCP,  
        name: "app-was-8081-tcp",
        appProtocol: ecs.AppProtocol.http,        
      }],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'AppWas',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }), 
      containerName: "app-was",      
    }); 

    // Fargate Service for WAS
    const fargateService_Was = new ecs.FargateService(this, 'ServiceForWas', {
      cluster: cluster,
      taskDefinition: taskDefinition_Was,
      serviceName: "app-was-service",
      desiredCount: 2,
      assignPublicIp: false,
      securityGroups: [sg_Was],      
    }); 
    // Setup AutoScaling policy
    const scalingWas = fargateService_Was.autoScaleTaskCount({ 
      minCapacity: 2,
      maxCapacity: 4      
    });
    scalingWas.scaleOnCpuUtilization('CpuScalingWas', {
      policyName: "app-was-asg-policy",
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300)
    });

    // load balancer for WAS
    const alb_was = new elbv2.ApplicationLoadBalancer(this, 'AlbWas', {
      loadBalancerName: "app-was-alb",
      internetFacing: false,  // internal
      ipAddressType: elbv2.IpAddressType.IPV4,
      vpc: vpc,
      securityGroup: sg_WasAlb,
    });
    const listener_was = alb_was.addListener('Listener', {
      port: 80,
      open: true,
    }); 
    listener_was.addTargets('targetServiceForWAS', {
      targets: [fargateService_Was],
      healthCheck: {
        enabled: true,
        path: '/health',
      },
      targetGroupName: "app-was-alb-tg",
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 8081,
      protocolVersion: elbv2.ApplicationProtocolVersion.HTTP1,      
    });  

    new cdk.CfnOutput(this, 'Was-Alb-Url', {
      value: "http://"+alb_was.loadBalancerDnsName,
      description: 'Address of WAS ALB URL',
    }); 
  } 
}
