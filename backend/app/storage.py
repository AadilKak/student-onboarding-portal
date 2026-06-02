"""Pluggable file storage. Selected by STORAGE_BACKEND ("local" | "s3").

The endpoints in files.py call get_storage() and never care which backend is
active — so moving from disk to S3 is purely a configuration change.
"""
import os
from flask import current_app


class LocalStorage:
    """Stores files on the local filesystem (good for dev / single server)."""
    def __init__(self, directory: str):
        self.directory = directory
        os.makedirs(directory, exist_ok=True)

    def save(self, name, file_storage, content_type=None):
        file_storage.save(os.path.join(self.directory, name))

    def read(self, name) -> bytes:
        with open(os.path.join(self.directory, name), "rb") as f:
            return f.read()

    def delete(self, name):
        try:
            os.remove(os.path.join(self.directory, name))
        except OSError:
            pass


class S3Storage:
    """Stores files in an S3 bucket. boto3 picks up AWS credentials from the
    environment / instance role. S3_ENDPOINT_URL lets you point at MinIO for
    local testing."""
    def __init__(self, bucket: str, region=None, endpoint_url=None):
        import boto3  # imported lazily so local mode needs no boto3
        self.bucket = bucket
        self.client = boto3.client("s3", region_name=region, endpoint_url=endpoint_url)

    def save(self, name, file_storage, content_type=None):
        file_storage.stream.seek(0)
        extra = {"ContentType": content_type} if content_type else {}
        self.client.upload_fileobj(file_storage.stream, self.bucket, name, ExtraArgs=extra)

    def read(self, name) -> bytes:
        obj = self.client.get_object(Bucket=self.bucket, Key=name)
        return obj["Body"].read()

    def delete(self, name):
        self.client.delete_object(Bucket=self.bucket, Key=name)


def get_storage():
    cfg = current_app.config
    if cfg.get("STORAGE_BACKEND", "local").lower() == "s3":
        return S3Storage(cfg["S3_BUCKET"], cfg.get("S3_REGION"), cfg.get("S3_ENDPOINT_URL"))
    return LocalStorage(cfg.get("UPLOAD_DIR", os.path.join(os.getcwd(), "uploads")))
