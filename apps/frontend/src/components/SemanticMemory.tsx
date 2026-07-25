/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  FileText, 
  Send, 
  Sparkles, 
  Database, 
  Cpu, 
  BookOpen, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Check,
  Play,
  ArrowRight,
  FolderOpen,
  FileCode,
  Settings,
  PlusCircle,
  History,
  FileDown,
  Layers,
  ChevronRight,
  Edit3,
  GitBranch,
  RefreshCw
} from "lucide-react";
import { Message, Adr, ProjectState, Epic, Story, Task, UserRole } from "../types";

// Standard initial specification documents for PmoPilot Core
import { SYSTEM_SPECIFICATION_MD, ADR_FOUNDATION_MD, SDD_GUIDE_MD, BACKEND_CONTRACT_MD } from "../data/initialDocs";
import { KIRO_TRANSFER_CONTEXT_MD } from "../data/kiroDoc";

interface SemanticMemoryProps {
  projectState: ProjectState;
  adrs: Adr[];
  chatHistory: Message[];
  userRole: UserRole;
  onAddChatMessage: (message: Message) => void;
  onExecuteSemanticAction: (messageId: string, actionType: string, actionData: any) => void;
  onAddLog: (agent: string, text: string, type: string) => void;
  onAddAdr: (adr: Adr) => void;
  onAddEpic: (epic: Epic, stories: Story[], tasks: Task[]) => void;
  onTriggerSendGrid?: (subject: string, to: string, body: string, templateId: string) => void;
  forcedSubTab?: "assistant" | "wizard" | "repo";
}

interface ArtifactVersion {
  version: string;
  date: string;
  author: string;
  changeSummary: string;
  content: string;
  json: string;
}

interface ManagedArtifact {
  id: string;
  title: string;
  category: "specs" | "adrs" | "manuals";
  versions: ArtifactVersion[];
  currentVersionIndex: number;
}

// Simple Markdown to HTML-style React renderer
function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  let inCode = false;
  let codeContent: string[] = [];

  const renderedElements = lines.map((line, index) => {
    // Code block check
    if (line.trim().startsWith("```")) {
      if (inCode) {
        inCode = false;
        const codeText = codeContent.join("\n");
        codeContent = [];
        return (
          <pre key={index} className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto my-3 border border-slate-800 leading-relaxed break-words whitespace-pre-wrap">
            <code>{codeText}</code>
          </pre>
        );
      } else {
        inCode = true;
        return null;
      }
    }

    if (inCode) {
      codeContent.push(line);
      return null;
    }

    // Headers
    if (line.startsWith("# ")) {
      return <h1 key={index} className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mt-5 mb-3">{line.replace("# ", "")}</h1>;
    }
    if (line.startsWith("## ")) {
      return <h2 key={index} className="text-base font-bold text-slate-800 mt-4 mb-2 flex items-center gap-1.5">{line.replace("## ", "")}</h2>;
    }
    if (line.startsWith("### ")) {
      return <h3 key={index} className="text-sm font-bold text-slate-700 mt-3 mb-1.5">{line.replace("### ", "")}</h3>;
    }

    // Lists
    if (line.trim().startsWith("- ")) {
      return (
        <li key={index} className="ml-4 list-disc text-xs text-slate-600 leading-relaxed mb-1">
          {line.trim().replace("- ", "")}
        </li>
      );
    }
    if (line.trim().startsWith("1. ") || line.trim().startsWith("2. ") || line.trim().startsWith("3. ")) {
      return (
        <li key={index} className="ml-4 list-decimal text-xs text-slate-600 leading-relaxed mb-1">
          {line.trim().replace(/^\d+\.\s+/, "")}
        </li>
      );
    }

    // Dividers
    if (line.trim() === "---") {
      return <hr key={index} className="border-slate-100 my-3" />;
    }

    // Empty lines
    if (line.trim() === "") {
      return <div key={index} className="h-1.5" />;
    }

    // Standard paragraphs with basic bold support
    return (
      <p key={index} className="text-xs text-slate-600 leading-relaxed mb-2 break-words">
        {line.split(/(\*\*.*?\*\*|`.*?`)/).map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pIdx} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return <code key={pIdx} className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-rose-600">{part.slice(1, -1)}</code>;
          }
          return part;
        })}
      </p>
    );
  });

  return <div className="space-y-0.5">{renderedElements}</div>;
}

export default function SemanticMemory({ 
  projectState, 
  adrs, 
  chatHistory, 
  userRole,
  onAddChatMessage, 
  onExecuteSemanticAction,
  onAddLog,
  onAddAdr,
  onAddEpic,
  onTriggerSendGrid,
  forcedSubTab
}: SemanticMemoryProps) {
  const [activeSubTab, setActiveSubTab] = useState<"assistant" | "wizard" | "repo">("assistant");
  
  useEffect(() => {
    if (forcedSubTab) {
      setActiveSubTab(forcedSubTab);
    }
  }, [forcedSubTab]);

  // Repo Selection
  const [selectedDocId, setSelectedDocId] = useState<string>("brief-001");
  const [previewTab, setPreviewTab] = useState<"markdown" | "json" | "history" | "edit">("markdown");

  // Edit / Propose change forms
  const [proposalInstruction, setProposalInstruction] = useState("");
  const [proposalSummary, setProposalSummary] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);

  // Assistant Input State
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // SDD Interrogative Wizard State
  const [wizardStep, setWizardStep] = useState<"welcome" | "q_scale" | "q_tech" | "q_flow" | "preview" | "success">("welcome");
  const [userRawIdea, setUserRawIdea] = useState("");
  const [ansScale, setAnsScale] = useState("");
  const [ansTech, setAnsTech] = useState("");
  const [ansFlow, setAnsFlow] = useState("");
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [customBriefContent, setCustomBriefContent] = useState("");
  const [customAdrContent, setCustomAdrContent] = useState("");

  // Comprehensive Editable / Versionable Document Database
  const [allArtifacts, setAllArtifacts] = useState<ManagedArtifact[]>([
    {
      id: "brief-001",
      title: "BRIEF-001: Especificación del Sistema - PmoPilot Core",
      category: "specs",
      currentVersionIndex: 1, // Start on v2.0.0
      versions: [
        {
          version: "v1.0.0",
          date: "2026-07-20",
          author: "Orquestador PMO Semántico",
          changeSummary: "Borrador de especificación inicial del MVP",
          content: SYSTEM_SPECIFICATION_MD,
          json: JSON.stringify({
            id: "BRIEF-001",
            title: "Especificación del Sistema PmoPilot Core",
            version: "v1.0.0",
            metadata: {
              author: "Orquestador PMO",
              status: "DRAFT_REVIEW",
              last_modified: "2026-07-20"
            },
            requirements: {
              functional: [
                "FR-1: Orquestación Semántica y Conversacional",
                "FR-2: Descomposición de Productos (Product Brief -> SDD Backlog)"
              ],
              non_functional: [
                "NFR-1: Persistencia Nativa en AWS (DynamoDB)",
                "NFR-2: Privacidad de Credenciales en Servidor Backend"
              ]
            }
          }, null, 2)
        },
        {
          version: "v2.0.0",
          date: "2026-07-24",
          author: "Carlos (Líder de Proyecto)",
          changeSummary: "Se agrega el FR-3 Gobernanza RBAC e integración con Gemini 2.5 SDK",
          content: SYSTEM_SPECIFICATION_MD + `\n\n--- \n\n## Versión v2.0.0 - Control de Cambios (Audit Trail)\n- **Gobernanza RBAC (FR-3)**: Agregado control de roles (leader, tester, guest) para arbitraje de PRs.\n- **Optimización transaccional**: Vinculación explícita con las decisiones tomadas en el ADR-001.`,
          json: JSON.stringify({
            id: "BRIEF-001",
            title: "Especificación del Sistema PmoPilot Core",
            version: "v2.0.0",
            metadata: {
              author: "Carlos (Líder)",
              status: "APPROVED_SDD",
              last_modified: "2026-07-24"
            },
            requirements: {
              functional: [
                "FR-1: Módulo de Clientes (Registro y Pedidos)",
                "FR-2: Módulo de Repartidores (Asignación)",
                "FR-3: Panel de Monitoreo y Administración (Comercios)"
              ],
              non_functional: [
                "NFR-1: Geolocalización encriptada bajo HTTPS",
                "NFR-2: Tiempos de emparejamiento < 2.5s",
                "NFR-3: Escalabilidad de 1,000 websockets en horas pico"
              ]
            }
          }, null, 2)
        }
      ]
    },
    {
      id: "adr-001",
      title: "ADR-001: Elección de Amazon DynamoDB como Persistencia Nativa para AWS",
      category: "adrs",
      currentVersionIndex: 0,
      versions: [
        {
          version: "v1.0.0",
          date: "2026-07-22",
          author: "Carlos (Líder / Arquitecto)",
          changeSummary: "Elección de base de datos NoSQL nativa en AWS",
          content: ADR_FOUNDATION_MD,
          json: JSON.stringify({
            adr_id: "ADR-001",
            title: "Elección de Amazon DynamoDB para Persistencia Nativa",
            version: "v1.0.0",
            status: "ACCEPTED",
            metadata: {
              author: "Carlos",
              date: "2026-07-22"
            },
            context: "Despliegue nativo en AWS que evita duplicidad de dominios, múltiples puertos y puntos de falla.",
            decision: "Adoptar Amazon DynamoDB como único motor de persistencia nativa.",
            consequences: {
              pros: [
                "Arquitectura nativa para despliegue directo en AWS",
                "Un solo punto de persistencia sin duplicidad de puertos o bases de datos"
              ],
              cons: [
                "Requiere estructuración de claves PK/SK e Índices Secundarios Globales (GSI)"
              ]
            }
          }, null, 2)
        }
      ]
    },
    {
      id: "man-001",
      title: "MAN-001: Manual de Integración de API de Google Maps",
      category: "manuals",
      currentVersionIndex: 0,
      versions: [
        {
          version: "v1.0.0",
          date: "2026-07-23",
          author: "Ana (Tester / Integradora)",
          changeSummary: "Documentación inicial de geolocalización de repartidores",
          content: SDD_GUIDE_MD,
          json: JSON.stringify({
            id: "MAN-001",
            title: "Manual de Integración de API de Google Maps",
            version: "v1.0.0",
            metadata: {
              author: "Ana",
              date: "2026-07-23",
              status: "APPROVED"
            },
            components: [
              "Places Autocomplete API (direcciones de entrega)",
              "Geocoding API (coordenadas en DynamoDB)",
              "Directions API (ruta de reparto en tiempo real)"
            ],
            payload_format: {
              order_id: "string",
              status: "string",
              driver_location: {
                lat: "number",
                lng: "number"
              }
            }
          }, null, 2)
        }
      ]
    },
    {
      id: "contract-001",
      title: "CONTRATO-001: Especificación del Backend y API para Kiro",
      category: "specs",
      currentVersionIndex: 0,
      versions: [
        {
          version: "v1.0.0",
          date: "2026-07-24",
          author: "Carlos (Líder / Arquitecto)",
          changeSummary: "Contrato de API, endpoints y esquema NoSQL DynamoDB para desarrollo de backend",
          content: BACKEND_CONTRACT_MD,
          json: JSON.stringify({
            id: "CONTRATO-001",
            title: "Especificación de API y Backend",
            version: "v1.0.0",
            metadata: {
              author: "Carlos",
              date: "2026-07-24",
              status: "APPROVED_SDD"
            },
            endpointsCount: 7,
            database: "Amazon DynamoDB",
            orm: "AWS SDK v3 / Dynamoose"
          }, null, 2)
        }
      ]
    },
    {
      id: "kiro-transfer-001",
      title: "KIRO-TRANSFER: Documento de Transferencia de Contexto para Kiro",
      category: "specs",
      currentVersionIndex: 0,
      versions: [
        {
          version: "v1.0.0",
          date: "2026-07-24",
          author: "Carlos (Líder / Arquitecto)",
          changeSummary: "Directrices de sincronización, autenticación, API Keys y roles del sistema para el backend",
          content: KIRO_TRANSFER_CONTEXT_MD,
          json: JSON.stringify({
            id: "KIRO-TRANSFER",
            title: "Transferencia de Contexto de Ingeniería",
            version: "v1.0.0",
            metadata: {
              author: "Carlos",
              date: "2026-07-24",
              status: "READY_FOR_INTEGRATION"
            },
            architecture: "Python (FastAPI) + AWS DynamoDB Native",
            authentication: "RBAC (Carlos: leader, Ana: tester, David: guest)",
            externalIntegrations: [
              "Gemini 2.5 SDK",
              "SendGrid SMTP",
              "Cloudflare Security APIs"
            ]
          }, null, 2)
        }
      ]
    }
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userQuery = inputValue;
    setInputValue("");
    
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    onAddChatMessage(userMsg);
    setLoading(true);

    try {
      const response = await fetch("/api/semantic-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userQuery,
          history: chatHistory,
          projectContext: {
            name: projectState.name,
            epicsCount: projectState.epics.length,
            storiesCount: projectState.stories.length,
            tasksCount: projectState.tasks.length,
            activeTasks: projectState.tasks.filter(t => t.status === "in_progress"),
            members: projectState.members
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to consult Semantic Memory assistant");
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: "assistant",
        text: data.response,
        proposedAction: data.proposedAction || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      
      onAddChatMessage(assistantMsg);
      onAddLog("Assistant Agent", "Consulta respondida recuperando datos de la memoria semántica.", "info");
    } catch (error: any) {
      console.error(error);
      onAddLog("Assistant Agent", `Error al responder: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Automated drafting trigger based on interview answers
  const runSddDrafting = () => {
    setLoadingDraft(true);
    setWizardStep("preview");
    
    setTimeout(() => {
      const projectNameClean = userRawIdea.trim() || "Módulo de Facturación SaaS";
      
      // 1. Generate Technical SDD Briefing
      const generatedBrief = `# BRIEF-003: Especificación Funcional & Backlog para "${projectNameClean}"
      
## 1. Contexto Comercial y Propósito
El usuario busca diseñar una solución técnica estructurada para el MVP de: **"${projectNameClean}"**.
Para garantizar consistencia óptima en los datos operativos, se estructurará con persistencia en **${ansTech}**.

---

## 2. Parámetros de la Dimensión Semántica
- **Escala Inicial**: ${ansScale}
- **Motor de Persistencia**: ${ansTech}
- **Flujo Crítico Soportado**: ${ansFlow}

---

## 3. Requerimientos Funcionales (FR)
- **FR-1. Configuración de API Gateway**: Proveer endpoints rápidos para interactuar con la persistencia.
- **FR-2. Middleware de Validación de Datos**: Validación rígida de tipos de datos en la capa de esquemas según las restricciones de ${ansTech}.
- **FR-3. Descomposición de Flujo Operativo**: Procesamiento asíncrono robusto para soportar el flujo: *"${ansFlow}"*.

---

## 4. Ingeniería de Detalles (SDD Prompt Package para Generadores de Código)
Cualquier motor de generación agéntica puede interpretar la siguiente especificación:
\`\`\`text
[PROMPT BACKEND AGENTICO]: Crea un microservicio estructurado. Conéctalo a la base de datos (${ansTech}).
Estructura el esquema de datos para soportar el flujo crítico: "${ansFlow}".
Implementa validaciones estrictas y documenta el API en /docs.
\`\`\`
`;

      // 2. Generate architectural record
      const generatedAdr = `# ADR-003: Selección de Arquitectura de Datos para "${projectNameClean}"

## Status
**ACCEPTED (Aprobado por el PMO de PmoPilot)**

## Context
El proyecto requiere desarrollar el backend para **"${projectNameClean}"** minimizando el tiempo de entrega y maximizando la consistencia. Se evalúa el tipo de persistencia en función de las necesidades de datos relacionales o NoSQL.

## Decision
Adoptar un stack backend con **${ansTech}** para soportar de manera óptima el almacenamiento y flujo de datos del sistema. Toda la lógica se estructurará bajo esquemas descriptivos limpios.

## Consequences
- **Pros**:
  - Ajuste de rendimiento adaptado al perfil operativo (${ansScale}).
  - Flexibilidad para iterar sobre el MVP.
  - Compatibilidad con cualquier motor de generación agéntica (Cursor / Claude Code).
- **Cons**:
  - Requiere mantener sincronizados los esquemas de API y bases de datos.
`;

      setCustomBriefContent(generatedBrief);
      setCustomAdrContent(generatedAdr);
      setLoadingDraft(false);
    }, 1200);
  };

  // Register and save dynamic artifacts into the editable database
  const handleApproveSddArtifacts = () => {
    const cleanName = userRawIdea.trim() || "Módulo de Facturación SaaS";
    const briefId = `spec-dyn-${Date.now()}`;
    const adrId = `adr-dyn-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    // 1. Add ADR to global ADRs state (in App.tsx)
    const newAdr: Adr = {
      id: `ADR-003`,
      title: `Arquitectura de Datos para ${cleanName}`,
      status: "accepted",
      date: dateStr,
      author: "PmoPilot Orchestrator",
      context: `Se identificó la necesidad de diseñar el backend para "${cleanName}" usando un esquema óptimo de persistencia.`,
      decision: `Configurar la persistencia de datos usando ${ansTech} para el flujo crítico: ${ansFlow}.`,
      consequences: `Desarrollo ágil del MVP y total compatibilidad con generadores agénticos automáticos sin fricciones de infraestructura.`
    };
    onAddAdr(newAdr);

    // 2. Add New Epic & Tasks to Kanban board (in App.tsx)
    const epicId = `epic-dyn-${Date.now()}`;
    const newEpic: Epic = {
      id: epicId,
      title: `⚙️ Backend: ${cleanName}`,
      description: `Completar desarrollo e integración del backend usando ${ansTech} para soportar: ${ansFlow}.`,
      status: "todo"
    };

    const newStories: Story[] = [
      {
        id: `story-dyn-1-${Date.now()}`,
        title: `Como desarrollador, quiero configurar el esquema de persistencia`,
        description: `Estructurar la base de datos (${ansTech}) según el BRIEF-003.`,
        epicId: epicId,
        status: "todo"
      },
      {
        id: `story-dyn-2-${Date.now()}`,
        title: `Como usuario, quiero consumir la API REST del flujo crítico`,
        description: `Implementar endpoints para persistir y recuperar datos según el flujo: ${ansFlow}.`,
        epicId: epicId,
        status: "todo"
      }
    ];

    const newTasks: Task[] = [
      {
        id: `task-dyn-1-${Date.now()}`,
        title: `Modelar Persistencia para ${cleanName}`,
        description: `[SDD SPEC] INPUT: Briefing BRIEF-003. PROCESS: Diseñar esquema en ${ansTech}. OUTPUT: Persistencia lista.`,
        status: "todo",
        priority: "high",
        epicId: epicId,
        storyId: newStories[0].id,
        assignedTo: "David (Backend Dev)"
      },
      {
        id: `task-dyn-2-${Date.now()}`,
        title: `Desarrollar Endpoints de API`,
        description: `[SDD SPEC] INPUT: Especificación de endpoints. PROCESS: Programar rutas de API con persistencia. OUTPUT: Endpoints funcionales y documentados en /docs.`,
        status: "todo",
        priority: "medium",
        epicId: epicId,
        storyId: newStories[1].id,
        assignedTo: "David (Backend Dev)"
      }
    ];

    onAddEpic(newEpic, newStories, newTasks);

    // 3. Inject into our comprehensive Artifacts Database with standard JSON support
    const briefArtifact: ManagedArtifact = {
      id: briefId,
      title: `BRIEF-003: Especificación Funcional - ${cleanName}`,
      category: "specs",
      currentVersionIndex: 0,
      versions: [
        {
          version: "v1.0.0",
          date: dateStr,
          author: "PmoPilot PMO",
          changeSummary: "Generación automática del wizard SDD",
          content: customBriefContent,
          json: JSON.stringify({
            id: "BRIEF-003",
            title: `Especificación Funcional - ${cleanName}`,
            version: "v1.0.0",
            metadata: {
              author: "PmoPilot PMO",
              date: dateStr,
              status: "DRAFT_AUTO"
            },
            requirements: {
              functional: [
                "FR-1: Configuración de API Gateway",
                "FR-2: Middleware de Validación de Datos",
                `FR-3: Descomposición de Flujo Operativo (${ansFlow})`
              ],
              non_functional: [
                `NFR-1: Dimensionamiento escalable para ${ansScale}`
              ]
            }
          }, null, 2)
        }
      ]
    };

    const adrArtifact: ManagedArtifact = {
      id: adrId,
      title: `ADR-003: Selección de Arquitectura de Datos para ${cleanName}`,
      category: "adrs",
      currentVersionIndex: 0,
      versions: [
        {
          version: "v1.0.0",
          date: dateStr,
          author: "PmoPilot PMO",
          changeSummary: "Aceptación automática de ADR según entrevista",
          content: customAdrContent,
          json: JSON.stringify({
            adr_id: "ADR-003",
            title: `Selección de Arquitectura de Datos para ${cleanName}`,
            version: "v1.0.0",
            status: "ACCEPTED",
            metadata: {
              author: "PmoPilot PMO",
              date: dateStr
            },
            context: `El proyecto requiere desarrollar el backend para ${cleanName} minimizando tiempo y maximizando consistencia.`,
            decision: `Adoptar stack backend con ${ansTech}.`,
            consequences: {
              pros: [
                `Ajuste de rendimiento adaptado al perfil operativo (${ansScale})`,
                "Compatibilidad total con generadores agénticos"
              ],
              cons: [
                "Requiere mantener sincronizados los esquemas de API"
              ]
            }
          }, null, 2)
        }
      ]
    };

    setAllArtifacts(prev => [...prev, briefArtifact, adrArtifact]);
    setSelectedDocId(briefId);
    
    onAddLog("PmoPilot PMO", `¡Excelente! Se ha guardado el BRIEF-003 y ADR-003 en el Repositorio de Documentos. Se inyectó la Épica al Kanban.`, "success");
    setWizardStep("success");
  };

  // Propose a change / Edit artifact to generate a real new version!
  const handleProposeArtifactChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalInstruction.trim() || !proposalSummary.trim()) return;

    if (userRole === "tester") {
      setProposalError("Acceso Restringido: Tu rol de Tester / Colaborador no tiene permisos para proponer o autorizar cambios semánticos en los artefactos del Repositorio. Cambia tu rol a Líder en el menú superior.");
      return;
    }

    setSubmittingProposal(true);
    setProposalError(null);

    // Simulate PmoPilot analyzing impact and rewriting the spec/ADR
    setTimeout(() => {
      const artifact = allArtifacts.find(art => art.id === selectedDocId);
      if (!artifact) {
        setSubmittingProposal(false);
        return;
      }

      const currentVersion = artifact.versions[artifact.versions.length - 1];
      const nextVerNum = artifact.versions.length + 1;
      const nextVersionStr = `v${nextVerNum}.0.0`;
      const dateStr = new Date().toISOString().split('T')[0];

      // Mutate markdown content elegantly to add user's request
      const updatedMarkdown = currentVersion.content + `

---

## Anexo de Versión ${nextVersionStr} - Control de Cambios de Ingeniería (Audit Trail)
- **Motivo de la Modificación**: ${proposalSummary}
- **Instrucción de Cambio**: *"${proposalInstruction}"*
- **Sincronización PMO**: Se ha recalibrado el backlog técnico y se inyectaron las salvaguardas semánticas en el archivo de contexto para Kiro.
- **Autor del Cambio**: ${userRole === "leader" ? "Carlos (Líder / Arquitecto)" : "Colaborador PMO"}
- **Fecha de Aprobación**: ${dateStr}
`;

      // Mutate JSON representation elegantly
      let parsedJson: any = {};
      try {
        parsedJson = JSON.parse(currentVersion.json);
      } catch (err) {
        parsedJson = { id: artifact.id, title: artifact.title };
      }

      parsedJson.version = nextVersionStr;
      if (!parsedJson.metadata) parsedJson.metadata = {};
      parsedJson.metadata.last_modified = dateStr;
      parsedJson.metadata.status = "APPROVED_RECALIBRATED";
      parsedJson.metadata.change_summary = proposalSummary;

      // Add a new requirement to the requirements object
      if (parsedJson.requirements && Array.isArray(parsedJson.requirements.functional)) {
        parsedJson.requirements.functional.push(`FR-${nextVerNum}: ${proposalSummary} (Instrucción: ${proposalInstruction})`);
      } else if (parsedJson.components && Array.isArray(parsedJson.components)) {
        parsedJson.components.push(`${proposalSummary} (${proposalInstruction})`);
      } else {
        parsedJson.decision = `${parsedJson.decision || ""} / Modificación ${nextVersionStr}: ${proposalSummary} (${proposalInstruction})`;
      }

      const nextVersion: ArtifactVersion = {
        version: nextVersionStr,
        date: dateStr,
        author: userRole === "leader" ? "Carlos (Líder / Arquitecto)" : "Colaborador PMO",
        changeSummary: proposalSummary,
        content: updatedMarkdown,
        json: JSON.stringify(parsedJson, null, 2)
      };

      const updatedArtifacts = allArtifacts.map(art => {
        if (art.id === selectedDocId) {
          return {
            ...art,
            versions: [...art.versions, nextVersion],
            currentVersionIndex: art.versions.length // select newly created version
          };
        }
        return art;
      });

      setAllArtifacts(updatedArtifacts);
      setProposalInstruction("");
      setProposalSummary("");
      setSubmittingProposal(false);
      setPreviewTab("markdown");

      // Log in terminal
      onAddLog(
        "PMO Orchestrator", 
        `Se ha generado la versión ${nextVersionStr} del artefacto ${artifact.id} con el cambio: "${proposalSummary}".`, 
        "success"
      );

      // Trigger SendGrid email notification if callback is present (User requirement #1 - SendGrid integration visible)
      if (onTriggerSendGrid) {
        onTriggerSendGrid(
          `[PmoPilot Version Alert] Nueva versión ${nextVersionStr} del Artefacto ${artifact.id}`,
          "equipo-desarrollo@startup.com",
          `Hola Equipo,\n\nSe ha aprobado y publicado automáticamente la versión ${nextVersionStr} del documento de arquitectura '${artifact.title}'.\n\nCambio incorporado: ${proposalSummary}\nInstrucción de Cambio: "${proposalInstruction}"\n\nEste cambio ha sido recalculado semánticamente. Cualquier agente de codificación (como Kiro o Claude Code) que lea este repositorio sincronizará la nueva versión de inmediato.\n\nAtentamente,\nPmoPilot Gateway`,
          "d-sg-artifact-version-alert"
        );
      }
    }, 1500);
  };

  const handleResetWizard = () => {
    setUserRawIdea("");
    setAnsScale("");
    setAnsTech("");
    setAnsFlow("");
    setWizardStep("welcome");
  };

  return (
    <div className="space-y-4" id="semantic-memory-panel">
      
      {/* Dynamic Tab Navigation inside Semantic Memory */}
      <div className="flex border-b border-slate-100 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab("assistant")}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === "assistant" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          PMO Assistant Chat
        </button>
        <button
          onClick={() => setActiveSubTab("wizard")}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === "wizard" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          SDD Specification Center (Wizard)
        </button>
        <button
          onClick={() => setActiveSubTab("repo")}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === "repo" ? "border-emerald-600 text-emerald-600 font-bold" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
          Repositorio de Artefactos (Versionado)
          <span className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
            {allArtifacts.length}
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === "assistant" ? (
        /* TAB 1: PMO Assistant Chat */
        <div className="w-full flex flex-col gap-4 min-h-0">
          
          {/* Cognitive Consola Explanation Banner */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100/40 text-xs text-blue-900 leading-relaxed flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Consola Cognitiva Activa:</strong> PmoPilot decodifica tus intenciones en comandos estructurados de ingeniería para sincronizar el Kanban y el equipo.
              </span>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/50 px-2.5 py-0.5 rounded-full">
              Rol actual: {userRole === "leader" ? "Líder de Proyecto" : "Colaborador"}
            </span>
          </div>

          {/* Full-Width Spacious Chat Area */}
          <div className="w-full border border-slate-100 rounded-xl shadow-sm bg-white overflow-hidden flex flex-col h-[490px]">
            {/* Header chat bar */}
            <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Cpu className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Orquestador Semántico PMO</span>
                  <span className="text-[10px] text-slate-400">Sincronizado con ADRs y Metodología SDD</span>
                </div>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">GEMINI 1.5</span>
            </div>

            {/* Chat message stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-50/30">
              {chatHistory.map(msg => (
                <div 
                   key={msg.id} 
                   className={`flex gap-2.5 max-w-[90%] ${
                     msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                   }`}
                >
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[10px] ${
                    msg.sender === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {msg.sender === "user" ? "U" : "PP"}
                  </div>
                  <div>
                    <div className={`p-3.5 rounded-xl text-xs leading-relaxed break-words text-left shadow-sm ${
                      msg.sender === "user" 
                        ? "bg-blue-600 text-white" 
                        : "bg-white border border-slate-100 text-slate-700 whitespace-pre-line"
                    }`}>
                      {msg.text}

                      {msg.proposedAction && (
                        <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-2 text-slate-700">
                          <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                              🛠️ PROPUESTA DE ORQUESTACIÓN
                            </span>
                            <span className={`px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase ${
                              msg.proposedAction.executed ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {msg.proposedAction.executed ? "Aplicado" : "Pendiente"}
                            </span>
                          </div>

                          <div className="space-y-0.5 text-[10px]">
                            <p className="text-slate-400 uppercase text-[8px] font-bold">Acción: <span className="text-blue-600">{msg.proposedAction.type}</span></p>
                            {msg.proposedAction.type === "CREATE_TASK" && (
                              <>
                                <p><strong>Tarea:</strong> {msg.proposedAction.data.title}</p>
                                {msg.proposedAction.data.assignedTo && <p><strong>Asignado:</strong> {msg.proposedAction.data.assignedTo}</p>}
                                {msg.proposedAction.data.description && <p className="text-slate-400 italic">"{msg.proposedAction.data.description}"</p>}
                              </>
                            )}
                            {msg.proposedAction.type === "ADD_MEMBER" && (
                              <p><strong>Desarrollador:</strong> {msg.proposedAction.data.name} ({msg.proposedAction.data.role})</p>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={msg.proposedAction.executed}
                            onClick={() => onExecuteSemanticAction(msg.id, msg.proposedAction!.type, msg.proposedAction!.data)}
                            className={`w-full py-1.5 rounded text-center text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                              msg.proposedAction.executed 
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                            }`}
                          >
                            {msg.proposedAction.executed ? <Check className="w-3 h-3 text-emerald-600" /> : <Play className="w-3 h-3 fill-white" />}
                            {msg.proposedAction.executed ? "Orquestado con éxito" : "Aprobar y Ejecutar"}
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 block px-1 text-left">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5 max-w-[80%] mr-auto items-center">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-500">
                    PP
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-100 text-xs text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                    <span>Consultando memoria de arquitectura...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Horizontal Scrollable Pill Suggestions */}
            <div className="px-3 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto select-none no-scrollbar text-left scroll-smooth">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight shrink-0">Comandos rápidos:</span>
              <button
                type="button"
                onClick={() => setInputValue("Crea una tarea para refactorizar el calculador de tarifas en el envío")}
                className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] text-slate-700 hover:text-blue-700 px-3 py-1 rounded-full transition font-medium shrink-0 whitespace-nowrap shadow-xs"
              >
                ➕ Crear tarea: Tarifas Envío
              </button>
              <button
                type="button"
                onClick={() => setInputValue("Agrega un desarrollador llamado Marcos para Frontend")}
                className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] text-slate-700 hover:text-blue-700 px-3 py-1 rounded-full transition font-medium shrink-0 whitespace-nowrap shadow-xs"
              >
                👤 Invitar a Marcos
              </button>
              <button
                type="button"
                onClick={() => setInputValue("¿Por qué elegimos Amazon DynamoDB como base de datos nativa según el ADR-001?")}
                className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] text-slate-700 hover:text-blue-700 px-3 py-1 rounded-full transition font-medium shrink-0 whitespace-nowrap shadow-xs"
              >
                📖 ¿Por qué DynamoDB? (ADR)
              </button>
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex gap-1.5 bg-white">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Pregunta: ¿Por qué elegimos DynamoDB? ¿Qué hace Carlos? ¿Cómo me ayuda la PMO Semántica?"
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      ) : activeSubTab === "wizard" ? (
        /* TAB 2: SDD Specification Center Wizard */
        <div className="border border-slate-100 rounded-xl shadow-sm bg-white p-5 md:p-6 min-h-[440px] flex flex-col justify-between text-left">
          
          {wizardStep === "welcome" && (
            <div className="space-y-4 max-w-2xl mx-auto text-center py-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto border border-indigo-100">
                <Layers className="w-6 h-6 text-indigo-500 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">Centro de Generación de Artefactos (SDD Wizard)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ¿Eres un fundador no técnico? Describe tu idea de producto en lenguaje sencillo.
                  Te guiaremos paso a paso para formular especificaciones técnicas rigurosas (Briefs, Epics, ADRs) optimizadas para cualquier backend, base de datos y generador agéntico.
                </p>
              </div>

              <div className="space-y-3 pt-2 text-left">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Describe tu idea de negocio o nueva funcionalidad:</label>
                <textarea
                  value={userRawIdea}
                  onChange={e => setUserRawIdea(e.target.value)}
                  placeholder="Ej: 'Quiero crear un sistema para que repartidores vean sus ganancias en tiempo real' o 'Módulo de administración de cupones para restaurantes asociados'"
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white h-24"
                />
                
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold self-center">Sugerencias:</span>
                  <button 
                    onClick={() => setUserRawIdea("Módulo de Cupones y Descuentos Dinámicos")}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-medium text-slate-600 transition"
                  >
                    🚀 Cupones Dinámicos
                  </button>
                  <button 
                    onClick={() => setUserRawIdea("Panel de Historial de Viajes y Ganancias para Repartidores")}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-medium text-slate-600 transition"
                  >
                    🚴 Historial de Repartidores
                  </button>
                </div>
              </div>

              <button
                disabled={!userRawIdea.trim()}
                onClick={() => setWizardStep("q_scale")}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1.5 mx-auto shadow-sm"
              >
                Comenzar Entrevista de Diseño
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* QUESTION 1 */}
          {wizardStep === "q_scale" && (
            <div className="space-y-5 max-w-xl mx-auto py-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded">PASO 1 DE 3</span>
                <h3 className="text-sm font-bold text-slate-800">Dimensionamiento del MVP</h3>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  Arquitecto de PMO Semántica:
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para estructurar el esquema de datos de forma eficiente, necesito dimensionar la escala operativa inicial. ¿Cuál es el volumen esperado de datos o registros en el corto/mediano plazo?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2 text-left">
                <button
                  onClick={() => { setAnsScale("Pequeño MVP (<1,000 registros/mes, enfoque ágil)"); setWizardStep("q_tech"); }}
                  className="w-full text-left p-3.5 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-xl transition text-xs flex justify-between items-center group"
                >
                  <div>
                    <strong className="block text-slate-700">Escala MVP Inicial</strong>
                    <span className="text-slate-400">Menos de 1,000 registros al mes. Prioridad de velocidad de entrega.</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => { setAnsScale("Escala Media en Crecimiento (1,000 a 50,000 operaciones/mes)"); setWizardStep("q_tech"); }}
                  className="w-full text-left p-3.5 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-xl transition text-xs flex justify-between items-center group"
                >
                  <div>
                    <strong className="block text-slate-700">Mediano / Crecimiento</strong>
                    <span className="text-slate-400">Hasta 50,000 registros mensuales. Optimización de particiones de datos.</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-3">
                <button onClick={() => setWizardStep("welcome")} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Atrás</button>
              </div>
            </div>
          )}

          {/* QUESTION 2 */}
          {wizardStep === "q_tech" && (
            <div className="space-y-5 max-w-xl mx-auto py-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded">PASO 2 DE 3</span>
                <h3 className="text-sm font-bold text-slate-800">Modelo de Persistencia y Base de Datos</h3>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Arquitecto de PMO Semántica:
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ¿Qué modelo de base de datos consideras más apropiado para estructurar los datos de este proyecto?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2 text-left">
                <button
                  onClick={() => { setAnsTech("Amazon DynamoDB (Nativo AWS / Single-Table)"); setWizardStep("q_flow"); }}
                  className="w-full text-left p-3.5 bg-white border border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-xl transition text-xs flex justify-between items-center group shadow-xs"
                >
                  <div>
                    <strong className="block text-indigo-900">Amazon DynamoDB (Nativo AWS - Recomendado ADR-001)</strong>
                    <span className="text-slate-500">Un solo dominio de persistencia, alta velocidad, escalabilidad nativa AWS sin puntos de falla duales.</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => { setAnsTech("PostgreSQL / Relacional"); setWizardStep("q_flow"); }}
                  className="w-full text-left p-3.5 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-xl transition text-xs flex justify-between items-center group"
                >
                  <div>
                    <strong className="block text-slate-700">Base de Datos Relacional (PostgreSQL / MySQL)</strong>
                    <span className="text-slate-400">Para consultas SQL estructuradas avanzadas y esquemas con migraciones fijas.</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-3">
                <button onClick={() => setWizardStep("q_scale")} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Atrás</button>
              </div>
            </div>
          )}

          {/* QUESTION 3 */}
          {wizardStep === "q_flow" && (
            <div className="space-y-5 max-w-xl mx-auto py-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded">PASO 3 DE 3</span>
                <h3 className="text-sm font-bold text-slate-800">Flujo Crítico de Negocio</h3>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Arquitecto de PMO Semántica:
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Finalmente, definamos el flujo de datos principal que debe implementar el backend para garantizar un MVP de alto impacto. ¿Cuál es el flujo crítico de negocio?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2 text-left">
                <button
                  onClick={() => { setAnsFlow("Creación de Cupón por Comercio + Validación en Carrito de Compra + Descuento de Total"); runSddDrafting(); }}
                  className="w-full text-left p-3.5 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-xl transition text-xs flex justify-between items-center group"
                >
                  <div>
                    <strong className="block text-slate-700">Ingesta, Validación y Aplicación de Descuentos</strong>
                    <span className="text-slate-400">Modelado lógico de cupones, reglas de validación temporal y cálculo matemático del descuento.</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => { setAnsFlow("Registro de Ubicación de Repartidores + Historial de Órdenes + Desglose de Ganancias"); runSddDrafting(); }}
                  className="w-full text-left p-3.5 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-xl transition text-xs flex justify-between items-center group"
                >
                  <div>
                    <strong className="block text-slate-700">Historial y Desglose Logístico</strong>
                    <span className="text-slate-400">Indexación geoespacial de ubicaciones de entrega y consulta veloz de balances financieros del repartidor.</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-3">
                <button onClick={() => setWizardStep("q_tech")} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Atrás</button>
              </div>
            </div>
          )}

          {/* DRAFTING / PREVIEW */}
          {wizardStep === "preview" && (
            <div className="space-y-4 text-left w-full">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
                  <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">BORRADOR DE ESPECIFICACIONES (SDD DRAFT)</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Borrador Técnico Generado</span>
              </div>

              {loadingDraft ? (
                <div className="text-center py-20 space-y-3">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto"></div>
                  <p className="text-xs text-slate-500 font-mono">Deduciendo condiciones de borde y creando el paquete de prompts de ingeniería...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[320px]">
                  
                  {/* Left Column: Brief specification */}
                  <div className="border border-slate-150 rounded-xl bg-slate-50 p-4 overflow-y-auto custom-scrollbar text-[11px]">
                    <div className="flex items-center gap-1.5 mb-2.5 border-b border-slate-200/50 pb-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-slate-800">1. Documento de Especificación (BRIEF-003)</span>
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-600 font-sans leading-relaxed">
                      <SimpleMarkdown content={customBriefContent} />
                    </div>
                  </div>

                  {/* Right Column: ADR draft */}
                  <div className="border border-slate-150 rounded-xl bg-slate-50 p-4 overflow-y-auto custom-scrollbar text-[11px]">
                    <div className="flex items-center gap-1.5 mb-2.5 border-b border-slate-200/50 pb-2">
                      <Database className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-slate-800">2. Registro de Decisión (ADR-003)</span>
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-600 font-sans leading-relaxed">
                      <SimpleMarkdown content={customAdrContent} />
                    </div>
                  </div>

                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetWizard}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-semibold transition"
                  >
                    Sugerir cambios (Reset)
                  </button>
                  <p className="text-[10px] text-slate-400 hidden sm:block">Al aprobar, la especificación se guardará y se inyectará la Épica al Kanban.</p>
                </div>
                
                <button
                  onClick={handleApproveSddArtifacts}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Excelente: Aprobar y Registrar Versión
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS VIEW */}
          {wizardStep === "success" && (
            <div className="text-center py-10 space-y-5 max-w-md mx-auto">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100 shadow-sm">
                <Check className="w-8 h-8 font-bold" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">¡Especificación de Proyecto Registrada!</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Has completado la verbalización técnica de tu idea. PmoPilot ha traducido la visión en requerimientos de ingeniería estables listos para el desarrollo del backend.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-2">
                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block">Acciones Ejecutadas por el Asistente:</span>
                <ul className="space-y-1.5 text-[11px] text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Guardado <strong>BRIEF-003</strong> en el Repositorio de Documentos.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Aprobado <strong>ADR-003: Arquitectura de Datos</strong> e insertado al historial.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Creada <strong>Épica Backend</strong> con tareas críticas en tu Kanban.</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setActiveSubTab("repo"); }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Ver en el Repositorio de Artefactos
                </button>
                <button
                  onClick={handleResetWizard}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-semibold transition"
                >
                  Nueva Especificación
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* TAB 3: Repositorio de Artefactos (Unified Knowledge Vault - Versionable & Editable) */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[460px] text-left">
          
          {/* File structure tree (Cols 4) */}
          <div className="md:col-span-4 space-y-3">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
                Explorador de Artefactos
              </span>
              <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 rounded font-mono font-bold">/docs/*</span>
            </div>

            <div className="space-y-4">
              
              {/* Category 1: Specifications */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-1.5 mb-1">📖 Especificaciones de Diseño</span>
                
                {allArtifacts.filter(a => a.category === "specs").map(art => (
                  <button
                    key={art.id}
                    onClick={() => { setSelectedDocId(art.id); setPreviewTab("markdown"); }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between font-medium ${
                      selectedDocId === art.id ? "bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-600 pl-1.5" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="truncate">{art.title.replace("BRIEF-003: Especificación Funcional - ", "").replace("BRIEF-001: Especificación MVP - ", "")}</span>
                    </div>
                    <span className="text-[8px] font-mono bg-slate-100 text-slate-500 px-1 rounded">
                      {art.versions[art.versions.length - 1].version}
                    </span>
                  </button>
                ))}
              </div>

              {/* Category 2: Architecture ADRs */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-1.5 mb-1">🛠️ Decisiones Técnicas (ADR)</span>
                
                {allArtifacts.filter(a => a.category === "adrs").map(art => (
                  <button
                    key={art.id}
                    onClick={() => { setSelectedDocId(art.id); setPreviewTab("markdown"); }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between font-medium ${
                      selectedDocId === art.id ? "bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-600 pl-1.5" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Database className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="truncate">{art.id.toUpperCase()}: Persistencia</span>
                    </div>
                    <span className="text-[8px] font-mono bg-slate-100 text-slate-500 px-1 rounded">
                      {art.versions[art.versions.length - 1].version}
                    </span>
                  </button>
                ))}
              </div>

              {/* Category 3: Guides */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-1.5 mb-1">📚 Manuales y Procesos</span>
                
                {allArtifacts.filter(a => a.category === "manuals").map(art => (
                  <button
                    key={art.id}
                    onClick={() => { setSelectedDocId(art.id); setPreviewTab("markdown"); }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between font-medium ${
                      selectedDocId === art.id ? "bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-600 pl-1.5" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{art.title.replace("MAN-001: ", "")}</span>
                    </div>
                    <span className="text-[8px] font-mono bg-slate-100 text-slate-500 px-1 rounded">
                      {art.versions[art.versions.length - 1].version}
                    </span>
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Active File Preview with Tabs (Cols 8) */}
          <div className="md:col-span-8 border border-slate-100 rounded-xl bg-white p-5 shadow-sm min-h-[480px] flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Document Metadata Bar */}
              {(() => {
                const doc = allArtifacts.find(a => a.id === selectedDocId)!;
                const activeVersion = doc.versions[doc.currentVersionIndex];
                
                return (
                  <>
                    <div className="flex justify-between items-center bg-slate-50 -m-5 mb-4 p-3 border-b border-slate-100 rounded-t-xl text-[10px] text-slate-400 flex-wrap gap-2">
                      <span className="font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                        Visualizando: {doc.id.toUpperCase()} ({activeVersion.version})
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span>Autor: {activeVersion.author}</span>
                        <span>|</span>
                        <span>Fecha: {activeVersion.date}</span>
                      </div>
                    </div>

                    {/* Document Preview Navigation Subtabs */}
                    <div className="flex border-b border-slate-100 gap-1.5 pb-px">
                      <button
                        onClick={() => setPreviewTab("markdown")}
                        className={`pb-1.5 px-2 text-[11px] font-bold border-b-2 transition flex items-center gap-1 ${
                          previewTab === "markdown" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        Markdown Formateado
                      </button>
                      <button
                        onClick={() => setPreviewTab("json")}
                        className={`pb-1.5 px-2 text-[11px] font-bold border-b-2 transition flex items-center gap-1 ${
                          previewTab === "json" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <FileCode className="w-3 h-3" />
                        Estructura JSON Estándar
                      </button>
                      <button
                        onClick={() => setPreviewTab("history")}
                        className={`pb-1.5 px-2 text-[11px] font-bold border-b-2 transition flex items-center gap-1 ${
                          previewTab === "history" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <History className="w-3 h-3" />
                        Historial de Versiones
                        <span className="bg-slate-100 text-slate-500 px-1 rounded-full text-[9px]">
                          {doc.versions.length}
                        </span>
                      </button>
                      <button
                        onClick={() => setPreviewTab("edit")}
                        className={`pb-1.5 px-2 text-[11px] font-bold border-b-2 transition flex items-center gap-1 ${
                          previewTab === "edit" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        Proponer Modificación (Editar)
                      </button>
                    </div>

                    {/* Tab 1: Formatted Markdown */}
                    {previewTab === "markdown" && (
                      <div className="prose prose-sm max-w-none text-slate-700 min-h-[220px]">
                        <SimpleMarkdown content={activeVersion.content} />
                      </div>
                    )}

                    {/* Tab 2: Standard JSON Format */}
                    {previewTab === "json" && (
                      <div className="space-y-3 min-h-[220px]">
                        <div className="p-3 bg-blue-50/50 rounded-lg text-[10px] text-blue-900 leading-normal border border-blue-100/40">
                          <strong>Especificación de Esquema Estándar JSON:</strong> Este payload representa la estructura de información rígida consumible por bots automáticos como Kiro, asegurando integraciones limpias y robustas de bases de datos.
                        </div>
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[10px] overflow-x-auto border border-slate-800 leading-relaxed max-h-72">
                          <code>{activeVersion.json}</code>
                        </pre>
                      </div>
                    )}

                    {/* Tab 3: Version History Timeline */}
                    {previewTab === "history" && (
                      <div className="space-y-4 min-h-[220px]">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Línea de Tiempo de Cambios de Ingeniería</h4>
                        <div className="space-y-4 pl-2 relative border-l border-slate-200 ml-2 pt-2">
                          {doc.versions.map((ver, idx) => (
                            <div key={idx} className="relative">
                              <span className={`absolute -left-[13px] top-1.5 w-2 h-2 rounded-full border border-white ${
                                idx === doc.currentVersionIndex ? "bg-blue-600 ring-4 ring-blue-100" : "bg-slate-400"
                              }`} />
                              <div className="bg-slate-50 hover:bg-slate-100/75 p-3 rounded-lg border border-slate-150 transition ml-3">
                                <div className="flex justify-between items-center flex-wrap gap-2 mb-1">
                                  <span className="text-xs font-bold text-slate-800">Versión {ver.version}</span>
                                  <span className="text-[10px] font-mono text-slate-400">{ver.date}</span>
                                </div>
                                <p className="text-xs text-slate-600"><strong>Resumen del cambio:</strong> {ver.changeSummary}</p>
                                <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2 border-t border-slate-200/50 pt-1.5 font-mono">
                                  <span>Autor: {ver.author}</span>
                                  <button
                                    onClick={() => {
                                      const updatedArtifacts = allArtifacts.map(a => {
                                        if (a.id === selectedDocId) {
                                          return { ...a, currentVersionIndex: idx };
                                        }
                                        return a;
                                      });
                                      setAllArtifacts(updatedArtifacts);
                                      onAddLog("PMO Orchestrator", `Regresado documento ${doc.id} a la versión ${ver.version}.`, "info");
                                    }}
                                    disabled={idx === doc.currentVersionIndex}
                                    className={`px-2 py-0.5 rounded font-bold uppercase transition ${
                                      idx === doc.currentVersionIndex ? "bg-blue-50 text-blue-700 cursor-not-allowed border border-blue-100" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    {idx === doc.currentVersionIndex ? "Activo" : "Restaurar esta Versión"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Propose Change / Interactive Editor */}
                    {previewTab === "edit" && (
                      <div className="space-y-4 min-h-[220px]">
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>
                            <strong>Redacción Asistida:</strong> Ingresa tus instrucciones en lenguaje natural. El motor de PmoPilot recalibrará el artefacto técnico, generará una <strong>nueva versión (ej. {`v${doc.versions.length + 1}.0.0`})</strong> en el historial y notificará al equipo.
                          </span>
                        </div>

                        {proposalError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>{proposalError}</span>
                          </div>
                        )}

                        {submittingProposal ? (
                          <div className="text-center py-12 space-y-3">
                            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                            <p className="text-xs text-slate-500 font-mono">Analizando dependencias técnicas e integrando requerimientos en el nuevo esquema...</p>
                          </div>
                        ) : (
                          <form onSubmit={handleProposeArtifactChange} className="space-y-4 text-left">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Resumen del Cambio / Título de la Modificación</label>
                              <input
                                type="text"
                                required
                                value={proposalSummary}
                                onChange={(e) => setProposalSummary(e.target.value)}
                                placeholder="Ej: 'Se agrega botón de reembolso automático en panel de comercio' o 'Cambio de motor de búsqueda a ElasticSearch'"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Instrucción de Ingeniería (Describe el cambio en lenguaje natural)</label>
                              <textarea
                                required
                                value={proposalInstruction}
                                onChange={(e) => setProposalInstruction(e.target.value)}
                                placeholder="Escribe en lenguaje sencillo lo que falta o lo que deseas modificar en la especificación..."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white h-24 resize-none"
                              />
                            </div>

                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
                            >
                              <PlusCircle className="w-4 h-4" />
                              Someter Cambios (Generar Nueva Versión)
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

            </div>

            <div className="mt-5 border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>Estructurado bajo metodología Spec-Driven Development (SDD)</span>
              <button 
                onClick={() => {
                  const doc = allArtifacts.find(a => a.id === selectedDocId)!;
                  const activeVersion = doc.versions[doc.currentVersionIndex];
                  navigator.clipboard.writeText(activeVersion.content);
                  onAddLog("PMO Orchestrator", `Copiado contenido Markdown del artefacto ${doc.id} al portapapeles.`, "success");
                  alert("¡Artefacto copiado al portapapeles! Listo para ser inyectado en Cursor o Claude.");
                }} 
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition flex items-center gap-1"
              >
                <FileDown className="w-3 h-3" />
                Copiar Markdown
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
