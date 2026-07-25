import os
import boto3

class DynamoDBClient:
    _instance = None

    @classmethod
    def get_client(cls):
        if cls._instance is None:
            # Lee desde variables de entorno si estamos en local o producción
            endpoint_url = os.getenv("DYNAMODB_ENDPOINT", None) # Ej: http://localhost:8000 en local, None en nube
            aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID", "fakeMyKeyId")
            aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY", "fakeSecretAccessKey")
            region_name = os.getenv("AWS_REGION", "us-east-1")

            # Configuración base del cliente
            client_args = {
                "region_name": region_name,
                "aws_access_key_id": aws_access_key_id,
                "aws_secret_access_key": aws_secret_access_key,
            }

            # Si se define un endpoint local, se lo inyectamos
            if endpoint_url:
                client_args["endpoint_url"] = endpoint_url

            cls._instance = boto3.client("dynamodb", **client_args)
            
        return cls._instance