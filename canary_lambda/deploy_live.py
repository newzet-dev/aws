import boto3
import time

elbv2 = boto3.client('elbv2')
ssm = boto3.client('ssm')
ec2 = boto3.client('ec2')

def lambda_handler(event, context):
    image_tag = event.get('image_tag')
    live_ec2_id = event.get('live_ec2_id')  # IP 대신 ID로 변경
    listener_arn = event.get('listener_arn')
    live_tg = event.get('live_tg')
    canary_tg = event.get('canary_tg')
    canary_ec2_id = event.get('canary_ec2_id')

    # 트래픽 100% Canary로 전환
    elbv2.modify_listener(
        ListenerArn=listener_arn,
        DefaultActions=[{
            'Type': 'forward',
            'ForwardConfig': {
                'TargetGroups': [
                    {'TargetGroupArn': live_tg, 'Weight': 0},
                    {'TargetGroupArn': canary_tg, 'Weight': 100}
                ]
            }
        }]
    )
    print("Traffic switched to Live (100%)")

    # SSM으로 배포 실행
    response = ssm.send_command(
        InstanceIds=[live_ec2_id],
        DocumentName='AWS-RunShellScript',
        Parameters={'commands': [f'chmod +x /home/ubuntu/app/deploy.sh && /home/ubuntu/app/deploy.sh {image_tag} live']}
    )
    command_id = response['Command']['CommandId']
    print(f"Sent SSM command with CommandId: {command_id}")

    # 헬스 체크 대기
    healthy = False
    for _ in range(30):  # 최대 5분
        response = elbv2.describe_target_health(TargetGroupArn=live_tg)
        targets = response['TargetHealthDescriptions']
        if all(t['TargetHealth']['State'] == 'healthy' for t in targets):
            healthy = True
            break
        time.sleep(10)
    if not healthy:
        raise Exception("Live target group failed health check")
    print("Live target group is healthy")

    # 트래픽 100% Live로 전환
    elbv2.modify_listener(
        ListenerArn=listener_arn,
        DefaultActions=[{
            'Type': 'forward',
            'ForwardConfig': {
                'TargetGroups': [
                    {'TargetGroupArn': live_tg, 'Weight': 60},
                    {'TargetGroupArn': canary_tg, 'Weight': 40}
                ]
            }
        }]
    )
    print("Traffic switched to Live (60%), Canary (40%)")

    # Canary EC2 종료
    ec2.stop_instances(InstanceIds=[canary_ec2_id])
    print("Canary EC2 stopped")

    return {'status': 'Success'}
