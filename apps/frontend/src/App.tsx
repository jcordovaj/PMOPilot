/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Cpu, 
  Activity, 
  FolderPlus, 
  Sparkles, 
  GitPullRequest, 
  Database,
  ArrowUpRight,
  RefreshCw,
  Bell,
  Mail,
  MessageSquare,
  Shield,
  Check,
  Globe,
  Settings,
  X,
  Send,
  Lock,
  Layers,
  User as UserIcon
} from "lucide-react";

import { ProjectState, Epic, Story, Task, Adr, PullRequest, Message, UserRole, SendGridNotification } from "./types";
import { 
  INITIAL_MEMBERS, 
  INITIAL_EPICS, 
  INITIAL_STORIES, 
  INITIAL_TASKS, 
  INITIAL_ADRS, 
  SAMPLE_PRS, 
  RECENT_LOGS 
} from "./data/mockData";

// Import custom agent sub-components
import Dashboard from "./components/Dashboard";
import BootstrapAgent from "./components/BootstrapAgent";
import PlanningAgent from "./components/PlanningAgent";
import GitGuardian from "./components/GitGuardian";
import SemanticMemory from "./components/SemanticMemory";

interface CrispMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  role: string;
}

const INITIAL_NOTIFICATIONS: SendGridNotification[] = [
  {
    id: "mail-1",
    subject: "⚠️ Alerta de Conflicto en rama feature/billing-refund",
    to: "carlos-lead@almaproject.com",
    time: "Hace 5 min",
    status: "sent",
    body: "Hola Carlos,\n\nEl módulo Git Guardian de PmoPilot ha detectado un conflicto de fusión activo en la rama 'feature/billing-refund' de David con la rama principal 'main'.\n\nEste conflicto requiere revisión manual. Por favor coordina con David para resolver el merge.\n\nAtentamente,\nServicio de Notificación SendGrid para PmoPilot",
    templateId: "d-sg-conflict-alert"
  },
  {
    id: "mail-2",
    subject: "🚀 Épica 'Autenticación' registrada en Kanban",
    to: "sofia-po@almaproject.com",
    time: "Hace 1 hora",
    status: "sent",
    body: "Hola Sofía,\n\nTe notificamos que un artefacto SDD BRIEF-003 ha sido validado y aprobado. Se ha inyectado una nueva Épica al tablero Kanban con las tareas e integraciones de base de datos correspondientes.\n\nAtentamente,\nServicio de Notificación SendGrid para PmoPilot",
    templateId: "d-sg-epic-success"
  }
];

const INITIAL_CRISP_MESSAGES: CrispMessage[] = [
  {
    id: "crisp-1",
    sender: "Carlos",
    role: "Líder",
    text: "Hola equipo, ¿cómo van con la de Stripe? Recuerden subir sus specs a la memoria PMO.",
    time: "10:15"
  },
  {
    id: "crisp-2",
    sender: "David",
    role: "Backend",
    text: "Tengo listo el handler de webhooks para la pasarela de pagos, pero me sale conflicto en Git Guardian.",
    time: "11:20"
  },
  {
    id: "crisp-3",
    sender: "Ana",
    role: "Tester",
    text: "Yo puedo revisarlo David! Estoy corriendo las pruebas de regresión semántica desde la consola.",
    time: "11:25"
  }
];

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"memory" | "planning" | "guardian" | "observability" | "bootstrap">("memory");

  // User Authentication & Roles State
  const [userRole, setUserRole] = useState<UserRole>("leader");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // SendGrid Notifications State
  const [notifications, setNotifications] = useState<SendGridNotification[]>(INITIAL_NOTIFICATIONS);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [viewingNotification, setViewingNotification] = useState<SendGridNotification | null>(null);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);

  // Crisp Chat State
  const [crispOpen, setCrispOpen] = useState(false);
  const [crispMessages, setCrispMessages] = useState<CrispMessage[]>(INITIAL_CRISP_MESSAGES);
  const [crispInput, setCrispInput] = useState("");

  // Cloudflare Settings State
  const [cloudflareConfig, setCloudflareConfig] = useState({
    apiToken: "cf_token_prod_84918239x81a",
    zoneId: "cf_zone_9128309182",
    sslMode: "Strict",
    underAttackMode: false,
    rateLimiting: true,
    dashboardProtected: true
  });

  // Project state
  const [projectState, setProjectState] = useState<ProjectState>({
    id: "proj-1",
    name: "PmoPilot Core",
    description: "Plataforma de orquestación de equipos SDD con IA.",
    status: "active",
    epics: INITIAL_EPICS,
    stories: INITIAL_STORIES,
    tasks: INITIAL_TASKS,
    members: INITIAL_MEMBERS
  });

  // PR state
  const [pullRequests, setPullRequests] = useState<PullRequest[]>(SAMPLE_PRS);

  // Terminal Logs state
  const [logs, setLogs] = useState<Array<{ time: string; agent: string; text: string; type: string }>>(RECENT_LOGS);

  // Chat History state
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "assistant",
      text: "¡Hola! Soy PmoPilot, tu Semantic PMO de cabecera. He sincronizado la memoria del proyecto (incluyendo los registros de ADR y especificaciones). Estoy listo para ayudarte a coordinar ramas, crear planificaciones o responder dudas de arquitectura. ¿Qué haremos hoy?",
      timestamp: "12:10"
    }
  ]);

  // ADR Registry state
  const [adrs, setAdrs] = useState<Adr[]>(INITIAL_ADRS);

  // Helper actions
  const handleAddLog = (agent: string, text: string, type: string) => {
    const newLog = {
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      agent,
      text,
      type
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleClearLogs = () => {
    setLogs([]);
    handleAddLog("System", "Log de consola limpiado por el usuario.", "info");
  };

  const checkPermission = (actionName: string): boolean => {
    if (userRole === "leader") {
      return true;
    }
    const errorMsg = `Acción Restringida: Su rol actual (${userRole === "tester" ? "Tester / Colaborador Semántico" : "Invitado"}) no posee privilegios para '${actionName}'. Solo el rol de Líder (Carlos) puede realizar modificaciones estructurales en este repositorio.`;
    setPermissionError(errorMsg);
    handleAddLog("Guardian", `Intento de acceso denegado a '${actionName}' para el rol ${userRole}.`, "warning");
    setTimeout(() => setPermissionError(null), 6000);
    return false;
  };

  // Trigger SendGrid email notification mock helper
  const handleTriggerSendGrid = (subject: string, to: string, body: string, templateId: string) => {
    const newMail: SendGridNotification = {
      id: `mail-${Date.now()}`,
      subject,
      to,
      time: "Ahora mismo",
      status: "sent",
      body,
      templateId
    };
    setNotifications(prev => [newMail, ...prev]);
    setHasUnreadNotification(true);
    handleAddLog("SendGrid", `Notificación enviada con éxito a ${to} (Plantilla: ${templateId}).`, "success");
  };

  const handleInitializeProject = (projectName: string, members: string[]) => {
    if (!checkPermission("Bootstrap de Repositorio")) return;
    setProjectState(prev => ({
      ...prev,
      name: projectName,
      members: members,
      status: "active"
    }));
    handleTriggerSendGrid(
      `🚀 Proyecto '${projectName}' inicializado correctamente`,
      "equipo-sdd@almaproject.com",
      `Hola equipo,\n\nSe ha realizado el bootstrap completo para el repositorio '${projectName}'. Se generaron automáticamente el CODEOWNERS, dev-flow de CI/CD y documentación base.\n\nAtentamente,\nPmoPilot Server`,
      "d-sg-bootstrap-ready"
    );
  };

  const handleSetBacklog = (epics: Epic[], stories: Story[], tasks: Task[]) => {
    setProjectState(prev => ({
      ...prev,
      epics,
      stories,
      tasks
    }));
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: "todo" | "in_progress" | "done") => {
    setProjectState(prev => {
      const updatedTasks = prev.tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, status: newStatus };
        }
        return t;
      });
      return { ...prev, tasks: updatedTasks };
    });
  };

  const handleMergePr = (prId: string, taskId: string) => {
    if (!checkPermission("Fusión de Pull Request (Merge)")) return;
    // 1. Mark PR as merged
    setPullRequests(prev => prev.map(pr => {
      if (pr.id === prId) {
        return { ...pr, status: "merged" as const };
      }
      return pr;
    }));

    // 2. Mark the linked task as done
    handleUpdateTaskStatus(taskId, "done");

    // 3. Log it
    handleAddLog("Git Guardian", "Pruebas de regresión unitarias pasadas al fusionar.", "success");

    // 4. SendGrid mail dispatch
    const mergedPr = pullRequests.find(p => p.id === prId);
    handleTriggerSendGrid(
      `✓ PR #${mergedPr?.number || 104} Fusionada: ${mergedPr?.title || "Cambios"}`,
      "carlos-lead@almaproject.com",
      `Hola Carlos,\n\nTe notificamos que la Pull Request #${mergedPr?.number || 104} de ${mergedPr?.author || "Ana"} ha sido auditada, validada por PR Arbiter y fusionada exitosamente en 'main'. La tarea #${taskId} se marcó como HECHA.\n\nAtentamente,\nPmoPilot SendGrid Agent`,
      "d-sg-pr-merged"
    );
  };

  const handleUpdatePrChecks = (prId: string, reviewMarkdown: string, checks: any[]) => {
    setPullRequests(prev => prev.map(pr => {
      if (pr.id === prId) {
        return {
          ...pr,
          aiReview: reviewMarkdown,
          checks: checks
        };
      }
      return pr;
    }));
  };

  const handleAddChatMessage = (message: Message) => {
    setChatHistory(prev => [...prev, message]);
  };


  const handleExecuteSemanticAction = (messageId: string, actionType: string, actionData: any) => {
    // 1. Mark the action as executed in the chat history
    setChatHistory(prev => prev.map(msg => {
      if (msg.id === messageId && msg.proposedAction) {
        return {
          ...msg,
          proposedAction: {
            ...msg.proposedAction,
            executed: true
          }
        };
      }
      return msg;
    }));

    // 2. Apply state mutations based on action type
    switch (actionType) {
      case "CREATE_TASK": {
        const newTask: Task = {
          id: `task-${Date.now()}`,
          title: actionData.title,
          description: actionData.description || "Nueva tarea orquestada semánticamente.",
          status: "todo",
          priority: actionData.priority || "medium",
          assignedTo: actionData.assignedTo || "Unassigned"
        };
        setProjectState(prev => ({
          ...prev,
          tasks: [...prev.tasks, newTask]
        }));
        handleAddLog("PmoPilot PMO", `Acción Semántica: Creada tarea "${newTask.title}" asignada a ${newTask.assignedTo}.`, "success");
        break;
      }
      case "ADD_MEMBER": {
        const newMember = actionData.name;
        setProjectState(prev => {
          if (prev.members.includes(newMember)) return prev;
          return {
            ...prev,
            members: [...prev.members, newMember]
          };
        });
        handleAddLog("PmoPilot PMO", `Acción Semántica: Añadido desarrollador "${newMember}" al equipo.`, "success");
        break;
      }
      case "UPDATE_TASK_STATUS": {
        const { taskId, status } = actionData;
        setProjectState(prev => {
          const updatedTasks = prev.tasks.map(t => {
            if (t.id === taskId || t.title.toLowerCase().includes(taskId.toLowerCase())) {
              return { ...t, status: status as any };
            }
            return t;
          });
          return { ...prev, tasks: updatedTasks };
        });
        handleAddLog("PmoPilot PMO", `Acción Semántica: Tarea ${taskId} reubicada a "${status}".`, "success");
        break;
      }
      case "BOOTSTRAP_PROJECT": {
        setProjectState(prev => ({
          ...prev,
          name: actionData.projectName,
          status: "active",
          members: actionData.teamMembers || prev.members
        }));
        handleAddLog("PmoPilot PMO", `Acción Semántica: Nuevo proyecto "${actionData.projectName}" inicializado vía orquestación semántica.`, "success");
        break;
      }
      default:
        console.warn("Unknown semantic action type:", actionType);
    }
  };

  const handleAddAdr = (newAdr: Adr) => {
    setAdrs(prev => [...prev, newAdr]);
  };

  const handleAddEpic = (newEpic: Epic, newStories: Story[], newTasks: Task[]) => {
    setProjectState(prev => ({
      ...prev,
      epics: [...prev.epics, newEpic],
      stories: [...prev.stories, ...newStories],
      tasks: [...prev.tasks, ...newTasks]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-700 flex flex-col font-sans relative">
      
      {/* Role Restriction Toast Alert */}
      {permissionError && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-rose-50 border border-rose-200 text-rose-950 p-4 rounded-xl shadow-xl flex gap-3 items-start animate-bounce">
          <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Permiso Denegado (RBAC)</h4>
            <p className="text-xs text-rose-700 mt-1">{permissionError}</p>
          </div>
          <button onClick={() => setPermissionError(null)} className="text-rose-400 hover:text-rose-600 ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Professional Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 z-30 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-950 tracking-tight">PmoPilot</h1>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase border border-blue-100">
                Semantic PMO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Spec-Driven Development Orchestrator</p>
          </div>
        </div>

        {/* Central Top Active project pill */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-full text-xs text-slate-600">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          <span>Proyecto Activo: <strong>{projectState.name}</strong></span>
        </div>

        {/* Action controls & Auth integrations */}
        <div className="flex items-center flex-wrap gap-4 ml-auto sm:ml-0">
          
          {/* SendGrid Notifications Bell Dropdown */}
          <div className="relative">
            <button 
              onClick={() => {
                setNotificationDropdownOpen(!notificationDropdownOpen);
                setHasUnreadNotification(false);
                setRoleDropdownOpen(false);
              }}
              className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition"
              title="Notificaciones de Correo SendGrid"
            >
              <Bell className="w-5 h-5" />
              {hasUnreadNotification && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-ping"></span>
              )}
            </button>

            {notificationDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    Buzón SendGrid Notificaciones
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                    MOCK LIVE
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.map(mail => (
                    <div 
                      key={mail.id} 
                      onClick={() => {
                        setViewingNotification(mail);
                        setNotificationDropdownOpen(false);
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition text-left"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[11px] font-semibold text-slate-800 break-words line-clamp-1">
                          {mail.subject}
                        </span>
                        <span className="text-[9px] text-slate-400 shrink-0 whitespace-nowrap">
                          {mail.time}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 whitespace-pre-wrap">
                        {mail.body}
                      </p>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {mail.templateId}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Enviado
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-slate-50 text-center border-t border-slate-100">
                  <p className="text-[9px] text-slate-400">
                    Las alertas se despachan automáticamente en tiempo real usando plantillas de SendGrid.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Interactive User Switcher (RBAC Console) */}
          <div className="relative">
            <button 
              onClick={() => {
                setRoleDropdownOpen(!roleDropdownOpen);
                setNotificationDropdownOpen(false);
              }}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
              title="Selector de Autenticación y Roles"
            >
              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
                <UserIcon className="w-3 h-3" />
              </div>
              <span className="hidden sm:inline">
                {userRole === "leader" ? "Carlos (Líder)" : userRole === "tester" ? "Ana (Tester)" : "Invitado (Guest)"}
              </span>
              <Shield className={`w-3.5 h-3.5 ${userRole === "leader" ? "text-blue-600" : userRole === "tester" ? "text-emerald-600" : "text-slate-400"}`} />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden text-left">
                <div className="p-3 bg-slate-50 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-950">Gobernanza & Roles (RBAC)</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Define privilegios de acceso para interactuar con el repositorio.</p>
                </div>
                <div className="p-1.5 space-y-1">
                  <button 
                    onClick={() => {
                      setUserRole("leader");
                      setRoleDropdownOpen(false);
                      handleAddLog("Auth", "Sesión cambiada a 'Carlos (Líder / Propietario)'. Privilegios completos.", "info");
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-center justify-between text-xs transition ${userRole === "leader" ? "bg-blue-50 text-blue-900 font-bold" : "hover:bg-slate-50 text-slate-700"}`}
                  >
                    <div>
                      <span>Carlos (Líder / Propietario)</span>
                      <span className="block text-[9px] text-slate-400 font-normal">Acceso total (Merge, Bootstrap, Cloudflare).</span>
                    </div>
                    {userRole === "leader" && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>

                  <button 
                    onClick={() => {
                      setUserRole("tester");
                      setRoleDropdownOpen(false);
                      handleAddLog("Auth", "Sesión cambiada a 'Ana (Tester / Colaborador)'. Acceso restringido.", "info");
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-center justify-between text-xs transition ${userRole === "tester" ? "bg-emerald-50 text-emerald-900 font-bold" : "hover:bg-slate-50 text-slate-700"}`}
                  >
                    <div>
                      <span>Ana (Tester / Colaborador)</span>
                      <span className="block text-[9px] text-slate-400 font-normal">Puede chatear, sugerir tareas. No puede fusionar ni bootstrap.</span>
                    </div>
                    {userRole === "tester" && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>

                  <button 
                    onClick={() => {
                      setUserRole("guest");
                      setRoleDropdownOpen(false);
                      handleAddLog("Auth", "Sesión cambiada a 'Invitado (Solo Lectura)'. Acceso deshabilitado.", "info");
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-center justify-between text-xs transition ${userRole === "guest" ? "bg-slate-100 text-slate-900 font-bold" : "hover:bg-slate-50 text-slate-700"}`}
                  >
                    <div>
                      <span>Invitado (Guest)</span>
                      <span className="block text-[9px] text-slate-400 font-normal">Modo consulta. Sin permisos de edición.</span>
                    </div>
                    {userRole === "guest" && <Check className="w-4 h-4 text-slate-600 shrink-0" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <span className="text-xs text-slate-300 hidden sm:inline">|</span>
          
          <button 
            onClick={() => {
              setProjectState(prev => ({
                ...prev,
                epics: INITIAL_EPICS,
                stories: INITIAL_STORIES,
                tasks: INITIAL_TASKS,
                name: "PmoPilot Core"
              }));
              setPullRequests(SAMPLE_PRS);
              setLogs(RECENT_LOGS);
              setNotifications(INITIAL_NOTIFICATIONS);
              handleAddLog("System", "Restablecido estado de simulación al inicial.", "info");
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Restaurar estado base de prueba"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset State
          </button>
        </div>
      </header>

      {/* Main SendGrid Email Preview Overlay Modal */}
      {viewingNotification && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 rounded text-white">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-50">Plantilla de Notificación SendGrid</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Template: {viewingNotification.templateId}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingNotification(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex-1 bg-slate-50 text-slate-800 text-sm">
              <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm space-y-2 mb-3 text-left">
                <div className="text-xs">
                  <strong className="text-slate-400 font-normal">De:</strong> <span className="font-semibold text-slate-700">PmoPilot SendGrid Services &lt;no-reply@pmopilot-sdd.ai&gt;</span>
                </div>
                <div className="text-xs border-b border-slate-100 pb-2">
                  <strong className="text-slate-400 font-normal">Para:</strong> <span className="font-semibold text-slate-700">{viewingNotification.to}</span>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  Asunto: {viewingNotification.subject}
                </div>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm min-h-48 text-left whitespace-pre-wrap font-sans text-xs text-slate-600 leading-relaxed">
                {viewingNotification.body}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-400">Canal de Notificaciones PmoPilot</span>
              <button 
                onClick={() => setViewingNotification(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
              >
                Cerrar Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Global Navigation Bar (Z-Pattern Flow) */}
      <div className="bg-white border-b border-slate-200/60 px-6 py-2.5 sticky top-[72px] z-20">
        <div className="max-w-7xl w-full mx-auto flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("memory")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "memory" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Orquestador Central (PMO Assistant & Wizard)
          </button>

          <button
            onClick={() => setActiveTab("planning")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "planning" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <Layers className="w-4 h-4" />
            Tablero Kanban y Backlog
          </button>

          <button
            onClick={() => setActiveTab("guardian")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "guardian" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            Gobernabilidad Git y PRs
          </button>

          <button
            onClick={() => setActiveTab("observability")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "observability" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <Activity className="w-4 h-4" />
            Consola de Observabilidad (Grafana & SendGrid)
          </button>

          <button
            onClick={() => setActiveTab("bootstrap")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "bootstrap" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            Configuración de Proyecto
          </button>
        </div>
      </div>

      {/* App Body Shell - Full Width Single Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 min-h-0">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 md:p-6 min-h-[560px]">
          {activeTab === "memory" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-left">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Orquestador Central de PMO Semántica</h2>
                  <p className="text-xs text-slate-500">Administra el chat de asistente, genera especificaciones paso a paso y visualiza / edita el repositorio de documentos.</p>
                </div>
              </div>
              <SemanticMemory 
                projectState={projectState}
                adrs={adrs}
                chatHistory={chatHistory}
                userRole={userRole}
                onAddChatMessage={handleAddChatMessage}
                onExecuteSemanticAction={handleExecuteSemanticAction}
                onAddLog={handleAddLog}
                onAddAdr={handleAddAdr}
                onAddEpic={handleAddEpic}
                onTriggerSendGrid={handleTriggerSendGrid}
              />
            </div>
          )}

          {activeTab === "planning" && (
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Tablero Kanban de Alta Fidelidad</h2>
                  <p className="text-xs text-slate-500">Visualiza las historias de usuario y tareas de ingeniería inyectadas. Los cambios en los documentos semánticos se reflejan aquí.</p>
                </div>
              </div>
              <PlanningAgent 
                projectState={projectState}
                onSetBacklog={handleSetBacklog}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onAddLog={handleAddLog}
                userRole={userRole}
                onTriggerSendGrid={handleTriggerSendGrid}
              />
            </div>
          )}

          {activeTab === "guardian" && (
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Git Guardian & PR Arbiter</h2>
                  <p className="text-xs text-slate-500 font-medium">Audita Pull Requests usando pruebas automáticas de regresión y fusiona cambios.</p>
                </div>
              </div>
              <GitGuardian 
                projectState={projectState}
                pullRequests={pullRequests}
                onMergePr={handleMergePr}
                onUpdatePrChecks={handleUpdatePrChecks}
                onAddLog={handleAddLog}
                userRole={userRole}
                checkPermission={checkPermission}
              />
            </div>
          )}

          {activeTab === "observability" && (
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Activity className="w-5 h-5 text-orange-500 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Consola de Observabilidad de Infraestructura</h2>
                  <p className="text-xs text-slate-500">Simulación del portal de Grafana, gateway de notificaciones de SendGrid y perfiles perimetrales de Cloudflare.</p>
                </div>
              </div>
              <Dashboard 
                projectState={projectState} 
                logs={logs} 
                onClearLogs={handleClearLogs}
                notifications={notifications}
                cloudflareConfig={cloudflareConfig}
                setCloudflareConfig={setCloudflareConfig}
                userRole={userRole}
                onTriggerSendGrid={handleTriggerSendGrid}
                onAddTask={(task) => {
                  setProjectState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
                  handleAddLog("System", `Nueva tarea añadida: ${task.title}`, "info");
                }}
              />
            </div>
          )}

          {activeTab === "bootstrap" && (
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Bootstrap de Proyecto (Gobernanza)</h2>
                  <p className="text-xs text-slate-500">Inicializa nuevos repositorios, genera el archivo CODEOWNERS y el pipeline de CI/CD base.</p>
                </div>
              </div>
              <BootstrapAgent 
                onInitializeProject={handleInitializeProject}
                onAddLog={handleAddLog}
                cloudflareConfig={cloudflareConfig}
                setCloudflareConfig={setCloudflareConfig}
                userRole={userRole}
                checkPermission={checkPermission}
              />
            </div>
          )}
        </div>
      </div>

      {/* Crisp Floating Chat Widget */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => setCrispOpen(!crispOpen)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 text-white rounded-full shadow-2xl flex items-center justify-center transition duration-200 relative group"
          title="Crisp Team Chat"
        >
          {crispOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 animate-pulse" />}
          {!crispOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              3
            </span>
          )}
        </button>

        {crispOpen && (
          <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[420px] transition-all">
            <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse">
                </div>
                <div>
                  <h4 className="text-sm font-bold">Crisp Team LiveChat</h4>
                  <p className="text-[10px] text-blue-100">4 desarrolladores en línea</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-blue-700 px-2 py-0.5 rounded font-bold">INTEGRATED</span>
              </div>
            </div>

            {/* Members banner */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px] text-slate-500">
              <span className="font-semibold text-slate-400 mr-1">Canal:</span>
              <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded-full font-medium text-slate-700">#sdd-core</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full font-medium">Carlos</span>
              <span className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium">Ana</span>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-full font-medium">David</span>
              <span className="bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded-full font-medium">Sofia</span>
            </div>

            {/* Chat message listing */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
              {crispMessages.map(msg => {
                const isMe = msg.sender === "User";
                const senderColor = 
                  msg.sender === "Carlos" ? "text-blue-600 bg-blue-50 border-blue-100" :
                  msg.sender === "Ana" ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                  msg.sender === "David" ? "text-indigo-600 bg-indigo-50 border-indigo-100" :
                  msg.sender === "Sofia" ? "text-rose-600 bg-rose-50 border-rose-100" :
                  "text-slate-600 bg-slate-100 border-slate-200";

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-bold text-slate-700">
                        {isMe ? `${userRole === "leader" ? "Carlos (Líder)" : userRole === "tester" ? "Ana (Tester)" : "Invitado"}` : msg.sender}
                      </span>
                      {!isMe && (
                        <span className={`text-[8px] uppercase px-1 py-0.2 rounded font-bold border ${senderColor}`}>
                          {msg.role}
                        </span>
                      )}
                      <span className="text-[8px] text-slate-400 font-medium ml-1">{msg.time}</span>
                    </div>
                    <div className={`p-2.5 rounded-2xl max-w-[85%] text-xs text-left shadow-sm ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!crispInput.trim()) return;
                const userMsg: CrispMessage = {
                  id: `crisp-u-${Date.now()}`,
                  sender: "User",
                  role: userRole,
                  text: crispInput,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                };
                setCrispMessages(prev => [...prev, userMsg]);
                setCrispInput("");

                // Simulated reactive response from PMO team
                setTimeout(() => {
                  const botReply: CrispMessage = {
                    id: `crisp-bot-${Date.now()}`,
                    sender: "PmoPilot Bot",
                    role: "AI Agent",
                    text: `He tomado nota de tu comentario en el chat de Crisp. He sincronizado la conversación en los logs de control. ¡Sigamos construyendo bajo SDD!`,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  };
                  setCrispMessages(prev => [...prev, botReply]);
                  handleAddLog("Crisp", "Nuevo mensaje indexado en el canal de comunicación del equipo.", "info");
                }, 1200);
              }}
              className="p-3 border-t border-slate-100 bg-white flex gap-2"
            >
              <input 
                type="text"
                value={crispInput}
                onChange={(e) => setCrispInput(e.target.value)}
                placeholder="Escribe un mensaje al equipo..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
              <button 
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 px-6 text-center text-xs text-slate-400 mt-auto">
        <p className="font-medium">
          PmoPilot &copy; 2026. Diseñado como la PMO Semántica inteligente para desarrollo ágil y Spec-Driven Development (SDD).
        </p>
        <p className="text-[10px] text-slate-300 mt-1">
          Utilizando el stack Node/Express, React, Vite, Tailwind CSS y Gemini API.
        </p>
      </footer>
    </div>
  );
}
