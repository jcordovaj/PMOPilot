import os
import boto3
import time
from typing import Dict, List, Any, Optional
from botocore.exceptions import ClientError
from ..src.core.config import settings

class DynamoDBClient:
    _instance = None
    _resource = None

    @classmethod
    def get_client(cls):
        if cls._instance is None:
            # Configuración base del cliente
            client_args = {
                "region_name": settings.aws_region,
                "aws_access_key_id": settings.aws_access_key_id,
                "aws_secret_access_key": settings.aws_secret_access_key,
            }

            # Si se define un endpoint local, se lo inyectamos
            if settings.dynamodb_endpoint:
                client_args["endpoint_url"] = settings.dynamodb_endpoint

            cls._instance = boto3.client("dynamodb", **client_args)
            cls._resource = boto3.resource("dynamodb", **client_args)
            
        return cls._instance
    
    @classmethod
    def get_resource(cls):
        if cls._resource is None:
            cls.get_client()  # Esto inicializará también el resource
        return cls._resource
    
    @classmethod
    def create_tables(cls) -> Dict[str, str]:
        """Crea las tablas DynamoDB necesarias para la aplicación."""
        tables_created = {}
        
        # Esquema principal con patrón PK/SK y GSI
        table_definitions = [
            {
                "name": settings.dynamodb_table_name,
                "key_schema": [
                    {"AttributeName": "PK", "KeyType": "HASH"},
                    {"AttributeName": "SK", "KeyType": "RANGE"}
                ],
                "attribute_definitions": [
                    {"AttributeName": "PK", "AttributeType": "S"},
                    {"AttributeName": "SK", "AttributeType": "S"},
                    {"AttributeName": "GSI1_PK", "AttributeType": "S"},
                    {"AttributeName": "GSI1_SK", "AttributeType": "S"},
                    {"AttributeName": "GSI2_PK", "AttributeType": "S"},
                    {"AttributeName": "GSI2_SK", "AttributeType": "S"}
                ],
                "global_secondary_indexes": [
                    {
                        "IndexName": "GSI1",
                        "KeySchema": [
                            {"AttributeName": "GSI1_PK", "KeyType": "HASH"},
                            {"AttributeName": "GSI1_SK", "KeyType": "RANGE"}
                        ],
                        "Projection": {"ProjectionType": "ALL"},
                        "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
                    },
                    {
                        "IndexName": "GSI2",
                        "KeySchema": [
                            {"AttributeName": "GSI2_PK", "KeyType": "HASH"},
                            {"AttributeName": "GSI2_SK", "KeyType": "RANGE"}
                        ],
                        "Projection": {"ProjectionType": "ALL"},
                        "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
                    }
                ],
                "provisioned_throughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            }
        ]
        
        client = cls.get_client()
        
        for table_def in table_definitions:
            table_name = table_def["name"]
            
            try:
                # Verificar si la tabla ya existe
                client.describe_table(TableName=table_name)
                tables_created[table_name] = "already_exists"
                print(f"✓ Tabla '{table_name}' ya existe")
                
            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceNotFoundException':
                    # La tabla no existe, crearla
                    try:
                        create_params = {
                            "TableName": table_name,
                            "KeySchema": table_def["key_schema"],
                            "AttributeDefinitions": table_def["attribute_definitions"],
                            "ProvisionedThroughput": table_def["provisioned_throughput"]
                        }
                        
                        # Añadir GSIs si están definidas
                        if "global_secondary_indexes" in table_def:
                            create_params["GlobalSecondaryIndexes"] = table_def["global_secondary_indexes"]
                        
                        client.create_table(**create_params)
                        
                        # Esperar a que la tabla esté activa
                        waiter = client.get_waiter('table_exists')
                        waiter.wait(TableName=table_name)
                        
                        tables_created[table_name] = "created"
                        print(f"✓ Tabla '{table_name}' creada exitosamente")
                        
                    except Exception as create_error:
                        tables_created[table_name] = f"creation_failed: {str(create_error)}"
                        print(f"✗ Error creando tabla '{table_name}': {create_error}")
                else:
                    tables_created[table_name] = f"check_failed: {str(e)}"
                    print(f"✗ Error verificando tabla '{table_name}': {e}")
        
        return tables_created
    
    @classmethod
    def get_table(cls):
        """Obtiene la tabla principal de DynamoDB."""
        resource = cls.get_resource()
        return resource.Table(settings.dynamodb_table_name)
    
    @classmethod
    def put_item(cls, item: Dict[str, Any]) -> Dict[str, Any]:
        """Inserta o actualiza un ítem en DynamoDB."""
        table = cls.get_table()
        response = table.put_item(Item=item)
        return response
    
    @classmethod
    def get_item(cls, pk: str, sk: str) -> Optional[Dict[str, Any]]:
        """Obtiene un ítem específico de DynamoDB."""
        table = cls.get_table()
        try:
            response = table.get_item(Key={"PK": pk, "SK": sk})
            return response.get("Item")
        except ClientError:
            return None
    
    @classmethod
    def query_items(
        cls, 
        key_condition_expression: str,
        expression_attribute_values: Dict[str, str],
        index_name: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Consulta ítems en DynamoDB."""
        table = cls.get_table()
        
        query_params = {
            "KeyConditionExpression": key_condition_expression,
            "ExpressionAttributeValues": expression_attribute_values,
            "Limit": limit
        }
        
        if index_name:
            query_params["IndexName"] = index_name
        
        response = table.query(**query_params)
        return response.get("Items", [])
    
    @classmethod
    def scan_items(
        cls,
        filter_expression: Optional[str] = None,
        expression_attribute_values: Optional[Dict[str, str]] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Escanea ítems en DynamoDB."""
        table = cls.get_table()
        
        scan_params = {"Limit": limit}
        
        if filter_expression and expression_attribute_values:
            scan_params["FilterExpression"] = filter_expression
            scan_params["ExpressionAttributeValues"] = expression_attribute_values
        
        response = table.scan(**scan_params)
        return response.get("Items", [])
    
    @classmethod
    def delete_item(cls, pk: str, sk: str) -> Dict[str, Any]:
        """Elimina un ítem de DynamoDB."""
        table = cls.get_table()
        response = table.delete_item(Key={"PK": pk, "SK": sk})
        return response
    
    @classmethod
    def transact_write_items(cls, transact_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Ejecuta una transacción de escritura en DynamoDB."""
        client = cls.get_client()
        response = client.transact_write_items(TransactItems=transact_items)
        return response
    
    @classmethod
    def generate_pk_sk(cls, entity_type: str, entity_id: str, parent_id: Optional[str] = None) -> tuple:
        """Genera PK y SK según el esquema definido."""
        pk = f"{entity_type}#{entity_id}"
        
        if parent_id:
            sk = f"{entity_type}#{entity_id}"
        else:
            sk = f"{entity_type}#{entity_id}"
        
        return pk, sk
    
    @classmethod
    def generate_gsi_keys(cls, gsi_type: str, gsi_id: str, sort_key: Optional[str] = None) -> tuple:
        """Genera claves para índices secundarios globales."""
        gsi_pk = f"{gsi_type}#{gsi_id}"
        gsi_sk = sort_key if sort_key else f"{gsi_type}#{gsi_id}"
        return gsi_pk, gsi_sk