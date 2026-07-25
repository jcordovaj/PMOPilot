# Principios Arquitectónicos

La arquitectura se diseña para cumplir simultáneamente dos objetivos:

1. Ejecutarse completamente sobre la capa gratuita de AWS durante el Hackathon.
2. Poder escalar a producción o capa empresarial de pago, sin modificar la arquitectura lógica, sólo ajustando algunas configuraciones.

---

## Stack Tecnológico

### Backend

* Python 3.12
* FastAPI
* Pydantic
* Uvicorn

---

## Agentes

Arquitectura basada en agentes especializados utilizando estándares abiertos.

Se evitará el acoplamiento con frameworks propietarios para permitir sustituir componentes sin afectar el resto del sistema.

Cada agente expondrá interfaces bien definidas mediante contratos y eventos.

---

## Persistencia

* DynamoDB (AWS)
* AWS S3 para objetos binarios
* AWS Lambda functions
* SQLite para desarrollo local

---

## APIs

* REST API

Preparada para futura incorporación de MCP y eventos asíncronos.

---

## Frontend

Dashboard Web

Tecnologías ligeras.

Priorizar simplicidad sobre complejidad visual.

---

## Observabilidad

* Grafana
* CloudWatch
* Logs estructurados
* Health Checks

---

## Arquitectura Lógica

```text
Usuario
↓
Dashboard Web
↓
API Gateway
↓
Coordinator Agent
↓
Bootstrap Agent
↓
Planning Agent
↓
Git Guardian
↓
PR Arbiter
↓
Semantic Memory
↓
Communication Agent
↓
Observability Agent
↓
GitHub API
↓
AWS Services
↓
Grafana
↓
SendGrid
↓
Jira
↓
Crisp
```

---

## Comunicación

Los agentes se comunicarán mediante eventos internos.

El Coordinator Agent actuará como orquestador principal.

Cada agente será responsable únicamente de una capacidad del sistema.

---

## Servicios AWS

### Amazon Bedrock

Motor LLM.

---

### AWS Lambda

Ejecución de agentes.

---

### DynamoDB

Memoria semántica
Vectorizacion
RAG

---

### EventBridge

Orquestación de eventos.

---

## CloudWatch

Observabilidad.

---

## S3

Almacenamiento de artefactos ligeros.

---

## Integraciones

### GitHub

Repositorio

Issues

Projects

Pull Requests

Actions

---

### Grafana

Dashboard ejecutivo

Métricas

---

### Jira

Sincronización opcional de backlog

---

### SendGrid

Notificaciones

---

### Crisp

Asistente conversacional entre miembros del equipo

---

### Cloudflare

Protección del Dashboard y APIs

---

## Escalabilidad

La solución será completamente desacoplada.

Cada integración podrá sustituirse sin afectar el resto del sistema.

Los agentes serán independientes y podrán ejecutarse en procesos separados conforme aumente la carga.

---

## Restricciones

Para el Hackathon:

* Free Tier AWS
* Bajo tráfico
* Datos mínimos, solo para demostrar funcionalidad, no carga
* Un único proyecto activo, se usara un proyecto Python como ejemplo
* Hasta diez usuarios

Sin embargo, la arquitectura deberá ser válida para ambientes productivos simplemente aumentando capacidad, cambiando de capa o sustituyendo componentes administrados.
