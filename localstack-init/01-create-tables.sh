#!/bin/bash
# Script de inicialización para crear tablas DynamoDB en LocalStack

echo "🔄 Creando tablas DynamoDB para PMOPilot..."

# Configurar AWS CLI para LocalStack
aws configure set aws_access_key_id test --profile localstack
aws configure set aws_secret_access_key test --profile localstack
aws configure set region us-east-1 --profile localstack

# Esperar a que LocalStack esté listo
echo "⏳ Esperando que LocalStack esté listo..."
until aws dynamodb list-tables --endpoint-url http://localstack:4566 --profile localstack 2>/dev/null; do
    sleep 2
done

# Crear tabla principal de PMOPilot
echo "📦 Creando tabla pmopilot_main..."

aws dynamodb create-table \
    --table-name pmopilot_main \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1_PK,AttributeType=S \
        AttributeName=GSI1_SK,AttributeType=S \
        AttributeName=GSI2_PK,AttributeType=S \
        AttributeName=GSI2_SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        '[
            {
                "IndexName": "GSI1",
                "KeySchema": [
                    {"AttributeName": "GSI1_PK", "KeyType": "HASH"},
                    {"AttributeName": "GSI1_SK", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {
                    "ReadCapacityUnits": 5,
                    "WriteCapacityUnits": 5
                }
            },
            {
                "IndexName": "GSI2",
                "KeySchema": [
                    {"AttributeName": "GSI2_PK", "KeyType": "HASH"},
                    {"AttributeName": "GSI2_SK", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {
                    "ReadCapacityUnits": 5,
                    "WriteCapacityUnits": 5
                }
            }
        ]' \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --endpoint-url http://localstack:4566 \
    --profile localstack

echo "✅ Tabla pmopilot_main creada exitosamente"

# Crear tabla de logs (opcional)
echo "📝 Creando tabla de logs..."

aws dynamodb create-table \
    --table-name pmopilot_logs \
    --attribute-definitions \
        AttributeName=log_id,AttributeType=S \
        AttributeName=timestamp,AttributeType=S \
    --key-schema \
        AttributeName=log_id,KeyType=HASH \
        AttributeName=timestamp,KeyType=RANGE \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --endpoint-url http://localstack:4566 \
    --profile localstack

echo "✅ Tabla de logs creada exitosamente"

# Listar tablas creadas
echo "📊 Tablas DynamoDB disponibles:"
aws dynamodb list-tables --endpoint-url http://localstack:4566 --profile localstack

# Insertar datos demo iniciales
echo "🎪 Insertando datos demo iniciales..."

# Datos de usuario demo
aws dynamodb put-item \
    --table-name pmopilot_main \
    --item '{
        "PK": {"S": "USER#demo-user"},
        "SK": {"S": "USER#demo-user"},
        "entity_type": {"S": "USER"},
        "entity_id": {"S": "demo-user"},
        "name": {"S": "Usuario Demo"},
        "email": {"S": "demo@pmopilot.dev"},
        "role": {"S": "leader"},
        "avatar": {"S": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"},
        "created_at": {"S": "2024-01-01T00:00:00Z"},
        "updated_at": {"S": "2024-01-01T00:00:00Z"}
    }' \
    --endpoint-url http://localstack:4566 \
    --profile localstack

# Configuración del proyecto demo
aws dynamodb put-item \
    --table-name pmopilot_main \
    --item '{
        "PK": {"S": "PROJECT#demo-ecommerce"},
        "SK": {"S": "PROJECT#demo-ecommerce"},
        "entity_type": {"S": "PROJECT_CONFIG"},
        "entity_id": {"S": "demo-ecommerce"},
        "project_name": {"S": "E-Commerce Suite Demo"},
        "description": {"S": "Proyecto demo completo para PMOPilot"},
        "demo_mode": {"BOOL": true},
        "github_repo": {"S": "https://github.com/pmopilot-demo/ecommerce-suite"},
        "readonly": {"BOOL": true},
        "created_at": {"S": "2024-01-01T00:00:00Z"},
        "updated_at": {"S": "2024-01-01T00:00:00Z"}
    }' \
    --endpoint-url http://localstack:4566 \
    --profile localstack

echo "✅ Datos demo iniciales insertados"

echo "🎉 Inicialización de LocalStack completada!"