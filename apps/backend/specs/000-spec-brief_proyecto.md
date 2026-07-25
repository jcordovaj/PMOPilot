# Proyecto: TeamPilot the Semantic PMO for SDD

_**AI Semantic Orchestrator PMO for Spec-Driven Development Teams**_  

## Elevator Pitch

TeamPilot es un `AI Team Orchestrator for Spec-Driven Development`, es decir, una plataforma de orquestación asistida por IA que ayuda a pequeños equipos que desarrollan software mediante Spec-Driven Development (SDD) utilizando herramientas como Kiro, Claude Code, Cursor o Copilot.

Rompe la barrera de la alfabetizacion tecnologica requerida para realizar un proyecto profesionalque exige conocimientos avanzados de Git, GitHub Actions, CI/CD o gestión de proyectos, TeamPilot actúa como una Semantic PMO inteligente, que coordina automáticamente el ciclo de vida del proyecto, preserva la memoria colectiva, automatiza procesos repetitivos y guía al equipo desde la idea inicial hasta la entrega en producción.

## El problema

La IA ya permite que personas, con poca o nula experiencia técnica, generen software. Sin embargo, cuando dos o más personas colaboran sobre un mismo proyecto aparecen problemas que las herramientas actuales no resuelven:

- ramas desorganizadas
- cambios sobre el mismo código
- Pull Requests inconsistentes
- pérdida de contexto
- documentación desactualizada
- desconocimiento de GitFlow
- falta de trazabilidad
- poca visibilidad del estado del proyecto
- ausencia de gobierno técnico

El resultado es que equipos muy productivos durante los primeros días terminan perdiendo tiempo coordinando cambios en lugar de desarrollar.

## La hipótesis

Los equipos SDD necesitan menos asistentes para escribir código y más asistentes para coordinar el trabajo entre múltiples colaboradores y herramientas.

## Propuesta de valor

TeamPilot extiende y potencia todas las capacidades que ya tiene GitHub, convirtiéndola en una plataforma de desarrollo coordinada por IA.

El usuario trabaja sobre objetivos semánticos en un lenguaje que entiende ("crear autenticación", "invitar un desarrollador", "publicar la versión 1.0"), mientras que el sistema orquesta automáticamente la planificación, la coordinación, las validaciones y las automatizaciones necesarias, desde scratch, hasta el GTM.

## Usuario objetivo

Principalmente:

- equipos o células de 2 a 9 personas
- startups
- hackathons
- estudiantes
- makers
- equipos Citizen Development
- desarrolladores asistidos por IA
- Product Owners que utilizan SDD
- Incluso "Solopreneurs" que coordinan freelancers

## Categoría Hackathon

Principal:

✅ Agentes especializados

Secundaria:

✅ Productividad para desarrolladores

## Objetivos del MVP

El MVP debe demostrar que un pequeño equipo puede iniciar y gestionar un proyecto completo sin conocer GitHub Actions, GitFlow, DevOps u otras herramientas o metodologías.

- No pretende reemplazar GitHub.
- Pretende simplificar su uso mediante IA.
- Reduce el ciclo de desarrollo de producto, y eso es economía de tokens y reducción del TTM

## Componentes principales

1. Bootstrap Agent

   - Responsable de crear un nuevo proyecto.
   - Automáticamente configura:
      - repositorio GitHub
      - README
      - licencia
      - estructura inicial
      - CODEOWNERS
      - templates
      - protección de ramas
      - workflows básicos
      - Project Kanban

2. Planning Agent

    Transforma una especificación escrita en lenguaje natural en:
    - épicas
    - historias
    - tareas
    - roadmap
    - prioridades

3. Git Guardian

    Coordina el trabajo colaborativo.

    Controla:

    - ramas activas
    - responsables
    - conflictos potenciales
    - ramas abandonadas

4. PR Arbiter

    _Supervisa Pull Requests._

    Ejecuta automáticamente:
    - compilación
    - pruebas
    - cobertura
    - revisión IA
    - seguridad
    - checklist

    Y genera un resumen comprensible.

5. Semantic Memory

    Mantiene el conocimiento del proyecto.

    Almacena:
    - decisiones arquitectónicas (ADR)
    - contexto
    - acuerdos
    - roadmap
    - cambios importantes

    Permite responder preguntas como:

    ¿Por qué elegimos PostgreSQL?

6. Observability Agent

    Centraliza la salud del proyecto.

    Muestra:

    - ramas
    - PR
    - issues
    - builds
    - cobertura
    - seguridad
    - actividad del equipo

    mediante Grafana.

7. Communication Agent

    Notifica automáticamente mediante SendGrid:

    - revisiones pendientes
    - despliegues
    - bloqueos
    - nuevas versiones

8. Assistant Agent

Integrado con Crisp Chat.

Permite consultar:

- ¿Qué está haciendo Ana?

- ¿Qué tareas siguen bloqueadas?

- ¿Cuál es el próximo release?

## Integraciones

`GitHub`

- Sistema operativo del desarrollo.

`AWS`

- Bedrock
- LLM
- Lambda
- Agentes
- DynamoDB
- Memoria
- EventBridge
- Eventos
- CloudWatch
- Logs

`Grafana`

- Observabilidad

`SendGrid`

- Notificaciones

`Crisp`

- Asistente conversacional

`Jira`

- Sincronización opcional de backlog

`Cloudflare`

- Protección del Dashboard y APIs

## Arquitectura lógica

```text
                    Usuario
                        │
                Semantic PMO UI
                        │
──────────────────────────────────────────
           Coordinator Agent
──────────────────────────────────────────
Bootstrap Agent

Planning Agent

Git Guardian

PR Arbiter

Semantic Memory

Communication Agent

Observability Agent

Assistant Agent
──────────────────────────────────────────
GitHub API

AWS

Grafana

SendGrid

Jira

Cloudflare

Crisp
```

## Casos de uso

### Caso 1 --> Crear Proyecto

```text
Usuario
↓
Nuevo proyecto
↓
Bootstrap Agent
↓
Repositorio GitHub
↓
Project
↓
README
↓
Primer Workflow
↓
Dashboard
↓
Proyecto listo
```

### Caso 2 --> Agregar integrante

```text
Usuario
↓
Invitar miembro
↓
GitHub
↓
Asignar rol
↓
Actualizar CODEOWNERS
↓
Enviar correo
↓
Actualizar Dashboard
```

### Caso 3 --> Crear funcionalidad

```text
Usuario
↓
Especificación
↓
Planning Agent
↓
Issues
↓
Branch
↓
Desarrollador
↓
PR
↓
PR Arbiter
↓
Merge
↓
Deploy
↓
Dashboard actualizado
```

### Caso 4 --> Consultar estado

```text
Usuario
↓
Pregunta al asistente
↓
Semantic Memory
↓
GitHub
↓
Dashboard
↓
Respuesta
```

## Exclusiones - Qué NO será el MVP

`No construiremos:`

- un reemplazo de Jira
- un reemplazo de GitHub
- un reemplazo de Grafana
- un sistema DevOps completo

El objetivo es demostrar la coordinación inteligente entre todas estas herramientas.

`Principios del proyecto`

- Todo incremento debe ser ejecutable.
- Todo incremento debe ser verificable.
- Todo incremento debe quedar integrado.
- Ningún prompt rompe el proyecto.
- Toda funcionalidad incorpora pruebas.
- Toda decisión importante queda registrada como ADR.
- El usuario nunca necesita editar YAML de GitHub Actions.
- La IA coordina el proceso; el equipo se concentra en construir el producto.

El proyecto podría parecer una herramienta más para automatizar GitHub pero, claramente, es una plataforma que orquesta el desarrollo de equipos asistidos por IA.
