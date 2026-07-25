# Caso 3: Crear funcionalidad

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
Desarrollador usa su plataforma de desarrollo con IA preferida (Claude, Kiro, Antigrativity, Codex, etc.)
↓
PR (el sistema se da cuenta que el usuario ha desarrollado algo por que el repo cambia y genera un PR)
↓
PR Arbiter (analiza y provee un resumen en lenguage natural para el usuario lider que debe autrizar o rechazar los cambios)
↓
Merge (usuario autoriza o rechaza con resumen y calificacion de riesgo dada por el Agente PR Arbiter, HITL principle.)
↓
Deploy (PMOPilot no interviene ni genera codigo de la aplicacion o producto del usuario, solo genera intermediacion tecnica entre intenciones descritas en lenguage natural por el usuario, herramientos y procesos)
↓
Dashboard actualizado, herramientas complementarias disparan sus acciones de notificacion o propagacion de informacion. 
```
