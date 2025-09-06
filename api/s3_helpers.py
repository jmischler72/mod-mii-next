import os
from minio import Minio
from minio.error import S3Error
import pathlib

MINIO_CONFIG = {
    "endpoint": os.environ.get("MINIO_ENDPOINT", "localhost"),
    "port": int(os.environ.get("MINIO_PORT", "9000")),
    "secure": os.environ.get("MINIO_USE_SSL", "false").lower() == "true",
    "access_key": os.environ.get("MINIO_ROOT_USER", "admin"),
    "secret_key": os.environ.get("MINIO_ROOT_PASSWORD", "password123"),
}

BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "wii-homebrew-files")

_minio_client = None

def get_minio_client():
    global _minio_client
    if _minio_client is None:
        _minio_client = Minio(
            f"{MINIO_CONFIG['endpoint']}:{MINIO_CONFIG['port']}",
            access_key=MINIO_CONFIG["access_key"],
            secret_key=MINIO_CONFIG["secret_key"],
            secure=MINIO_CONFIG["secure"],
        )
    return _minio_client

def file_exists_in_s3(key: str) -> bool:
    client = get_minio_client()
    try:
        client.stat_object(BUCKET_NAME, key)
        return True
    except S3Error:
        return False

def upload_file_to_s3(local_file_path: str, s3_key: str, content_type: str = "application/octet-stream") -> str:
    if not os.path.exists(local_file_path):
        raise FileNotFoundError(f"Local file does not exist: {local_file_path}")

    client = get_minio_client()
    meta_data = {
        "Content-Type": content_type,
        "upload-date": pathlib.Path(local_file_path).stat().st_mtime,
        "original-filename": os.path.basename(local_file_path),
    }
    client.fput_object(BUCKET_NAME, s3_key, local_file_path, metadata=meta_data)
    return get_public_minio_url(s3_key)

def download_file_from_s3(s3_key: str, local_file_path: str) -> str:
    client = get_minio_client()
    dir_path = os.path.dirname(local_file_path)
    os.makedirs(dir_path, exist_ok=True)
    client.fget_object(BUCKET_NAME, s3_key, local_file_path)
    print(f"Successfully downloaded {s3_key} from MinIO")
    return local_file_path

def generate_presigned_url(s3_key: str, expires_in: int = 3600) -> str:
    client = get_minio_client()
    return client.presigned_get_object(BUCKET_NAME, s3_key, expires=expires_in)

def generate_wad_s3_key(wadname: str) -> str:
    return f"wad-files/{wadname}"

def get_public_minio_url(s3_key: str) -> str:
    protocol = "https" if MINIO_CONFIG["secure"] else "http"
    return f"{protocol}://{MINIO_CONFIG['endpoint']}:{MINIO_CONFIG['port']}/{BUCKET_NAME}/{s3_key}"

def get_file_buffer_from_s3(s3_key: str) -> bytes:
    client = get_minio_client()
    response = client.get_object(BUCKET_NAME, s3_key)
    data = response.read()
    response.close()
    response.release_conn()
    return data

def initialize_s3():
    client = get_minio_client()
    try:
        if not client.bucket_exists(BUCKET_NAME):
            client.make_bucket(BUCKET_NAME)
            print(f"Created MinIO bucket: {BUCKET_NAME}")
        print("MinIO connection verified - bucket is accessible")
    except Exception as error:
        print("Failed to initialize MinIO:", error)
        raise RuntimeError(f"Failed to initialize MinIO: {str(error)}")
