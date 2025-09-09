import boto3
from app.core.config import settings


def get_s3_client():
    return boto3.client(
        service_name="s3",
        endpoint_url=settings.s3_endpoint_url,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_tenant_id + ":" + settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
    )
