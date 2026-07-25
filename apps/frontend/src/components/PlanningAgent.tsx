/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Sparkles, 
  Layers, 
  KanbanSquare, 
  ArrowRight, 
  User, 
  FileText, 
  CheckSquare, 
  Copy, 
  Check, 
  Cpu 
} from "lucide-react";
import { Epic, Story, Task, ProjectState, UserRole } from "../types";

interface PlanningAgentProps {
  projectState: ProjectState;
  onSetBacklog: (epics: Epic[], stories: Story[], tasks: Task[]) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: "todo" | "in_progress" | "done") => void;
  onAddLog: (agent: string, text: string, type: string) => void;
  userRole: UserRole;
  onTriggerSendGrid: (subject: string, to: string, body: string, templateId: string) => void;
}

export default function PlanningAgent({ 
  projectState, 
  onSetBacklog, 
  onUpdateTaskStatus, 
  onAddLog,
  userRole,
  onTriggerSendGrid
}: PlanningAgentProps) {
  const [brief, setBrief] = useState(
    "Necesitamos crear un módulo de facturación con Stripe para nuestra startup, que permita a los usuarios suscribirse a un plan mensual de $10 USD o anual de $100 USD. El backend en Python (FastAPI) debe registrar la suscripción en DynamoDB y verificar webhooks."
  );
  const [stack, setStack] = useState("React + Python (FastAPI) + AWS DynamoDB");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"kanban" | "backlog">("kanban");
  const [selectedTaskForPrompt, setSelectedTaskForPrompt] = useState<Task | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleGenerateBacklog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brief.trim()) return;

    if (userRole === "tester") {
      onAddLog("System Guard", "Acción bloqueada: Tu rol de Tester no tiene permisos para planificar o generar backlog en el Planning Agent. Cambia a rol de Líder o Colaborador.", "error");
      return;
    }

    setLoading(true);
    onAddLog("Planning Agent", "Analizando el brief del producto con Gemini AI...", "info");

    try {
      const response = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, stack })
      });

      if (!response.ok) {
        throw new Error("Failed to generate planning backlog");
      }

      const data = await response.json();
      
      // Update parent state
      onSetBacklog(data.epics, data.stories, data.tasks);
      setSelectedTaskForPrompt(data.tasks[0] || null);
      
      onAddLog(
        "Planning Agent", 
        `¡Backlog generado con éxito! ${data.epics.length} Épicas, ${data.stories.length} Historias, ${data.tasks.length} Tareas estructuradas bajo metodología SDD.`, 
        "success"
      );

      // Trigger SendGrid email notification
      onTriggerSendGrid(
        `[PmoPilot Alert] Nuevo Backlog estructurado para ${projectState.name || "App"}`,
        "equipo-pmo@startup.com",
        `Se han generado e inyectado correctamente ${data.epics.length} Épicas, ${data.stories.length} Historias de usuario y ${data.tasks.length} Tareas bajo metodología SDD.`,
        "d-backlog-alert-101"
      );
    } catch (error: any) {
      console.error(error);
      onAddLog("Planning Agent", `Error al generar planeación: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Generate cursor prompt optimized for SDD
  const generateSddPrompt = (task: Task) => {
    if (!task) return "";
    const parentStory = projectState.stories.find(s => s.id === task.storyId);
    const parentEpic = projectState.epics.find(e => e.id === task.epicId);

    return `=====================================================
PROMPT DE ESPECIFICACIÓN TÉCNICA (SDD) - CURSOR / CLAUDE CODE
=====================================================
Épica: ${parentEpic?.title || "Módulo Integrado"}
Historia: ${parentStory?.title || "Requerimiento Base"}
Tarea: ${task.title}

INSTRUCCIONES DE IMPLEMENTACIÓN:
Actúa como un desarrollador experto en "${stack}". Tu misión es implementar estrictamente los requerimientos definidos a continuación, sin desviaciones de alcance, respetando las mejores prácticas de codificación limpia.

REQUERIMIENTO ESPECÍFICO:
${task.description}

REGLAS DE DISEÑO Y CÓDIGO:
1. Utiliza Tailwind CSS para cualquier interfaz visual. Mantén un esquema de color claro, tipografía legible y paddings consistentes de 16px en contenedores.
2. Todo el código debe ser modular. Separa helpers, componentes y tipado si aplica.
3. No expongas variables de entorno o credenciales secretas en código del lado del cliente.
4. Incluye comentarios claros explicando decisiones técnicas que deban preservarse en la memoria colectiva.

ENTREGABLE ESPERADO:
Escribe el código completo y optimizado. Asegura que compile exitosamente sin warnings de tipado de TypeScript.
=====================================================`;
  };

  const handleCopyPrompt = () => {
    if (!selectedTaskForPrompt) return;
    navigator.clipboard.writeText(generateSddPrompt(selectedTaskForPrompt));
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
    onAddLog("Planning Agent", `Copiado prompt package de la tarea #${selectedTaskForPrompt.id} al portapapeles. Listo para Claude/Cursor.`, "success");
  };

  const moveTask = (taskId: string, targetStatus: "todo" | "in_progress" | "done") => {
    onUpdateTaskStatus(taskId, targetStatus);
    const statusLabel = targetStatus === "todo" ? "Por Hacer" : targetStatus === "in_progress" ? "En Curso" : "Hecho";
    onAddLog("Git Guardian", `Tarea #${taskId} movida al estado: ${statusLabel}.`, "info");
  };

  return (
    <div className="space-y-6" id="planning-agent-panel">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Planning Agent</h2>
        <p className="text-sm text-slate-500">Decompón ideas de negocio complejas en un backlog estructurado de épicas, historias y tareas listas para IA.</p>
      </div>

      {/* Input Brief Section */}
      <div className="p-6 bg-white border border-slate-100 rounded-xl shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          Generador de Backlog de Alta Fidelidad (Gemini API)
        </h3>

        <form onSubmit={handleGenerateBacklog} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Brief de la Funcionalidad (Lenguaje Natural)</label>
              <textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder="Describe qué funcionalidad quieres añadir..."
                rows={3}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Stack Tecnológico</label>
              <input
                type="text"
                value={stack}
                onChange={e => setStack(e.target.value)}
                placeholder="React, Python (FastAPI), AWS DynamoDB..."
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white mb-3"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin" />
                    Diseñando Backlog...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Estructurar Backlog
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab("kanban")}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "kanban" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <KanbanSquare className="w-4 h-4" />
          Tablero Kanban
        </button>
        <button
          onClick={() => setActiveTab("backlog")}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "backlog" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Layers className="w-4 h-4" />
          Épicas e Historias
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "kanban" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columns */}
          {(["todo", "in_progress", "done"] as const).map(colStatus => {
            const colTasks = projectState.tasks.filter(t => t.status === colStatus);
            return (
              <div key={colStatus} className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-4 min-h-[350px]">
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      colStatus === "todo" ? "bg-slate-400" : colStatus === "in_progress" ? "bg-blue-500" : "bg-emerald-500"
                    }`} />
                    {colStatus === "todo" ? "Por Hacer" : colStatus === "in_progress" ? "En Curso" : "Hecho"}
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Task Cards */}
                <div className="space-y-3">
                  {colTasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => setSelectedTaskForPrompt(task)}
                      className={`p-4 bg-white border rounded-lg shadow-sm cursor-pointer transition flex flex-col justify-between gap-3 ${
                        selectedTaskForPrompt?.id === task.id ? "border-blue-500 ring-2 ring-blue-50" : "border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-400">#{task.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                            task.priority === "high" ? "bg-red-50 text-red-500 border border-red-100" :
                            task.priority === "medium" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{task.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                      </div>

                      {/* Card Action footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs">
                        <span className="text-slate-400 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {task.assignedTo || "Sin asignar"}
                        </span>
                        
                        {/* Status Mover */}
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          {colStatus !== "todo" && (
                            <button 
                              onClick={() => moveTask(task.id, colStatus === "done" ? "in_progress" : "todo")}
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition"
                              title="Mover atrás"
                            >
                              ←
                            </button>
                          )}
                          {colStatus !== "done" && (
                            <button 
                              onClick={() => moveTask(task.id, colStatus === "todo" ? "in_progress" : "done")}
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition"
                              title="Mover adelante"
                            >
                              →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Epics and Stories Breakdown */
        <div className="p-6 bg-white border border-slate-100 rounded-xl shadow-sm space-y-6">
          {projectState.epics.length === 0 ? (
            <div className="text-center p-12 text-slate-400">No hay épicas configuradas. Genera el backlog arriba.</div>
          ) : (
            projectState.epics.map(epic => {
              const epicStories = projectState.stories.filter(s => s.epicId === epic.id);
              return (
                <div key={epic.id} className="space-y-3 border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-500 font-mono uppercase bg-indigo-50 px-2 py-0.5 rounded">Épica #{epic.id}</span>
                      <h3 className="text-base font-bold text-slate-800 mt-1">{epic.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{epic.description}</p>
                    </div>
                  </div>

                  <div className="pl-4 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Historias de Usuario Asociadas</h4>
                    {epicStories.map(story => {
                      const storyTasks = projectState.tasks.filter(t => t.storyId === story.id);
                      return (
                        <div key={story.id} className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                          <h5 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {story.title}
                          </h5>
                          
                          {/* Mini tasks status indicators inside story */}
                          <div className="flex flex-wrap gap-2 pt-1 pl-3">
                            {storyTasks.map(t => (
                              <span key={t.id} className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200/80 text-slate-500 flex items-center gap-1">
                                <span className={`w-1 h-1 rounded-full ${t.status === "done" ? "bg-emerald-500" : "bg-blue-400"}`} />
                                {t.title.substring(0, 25)}...
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SDD Prompt Exporter Section (If task is selected) */}
      {selectedTaskForPrompt && (
        <div className="p-6 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase font-mono">Cursor / Claude Code Prompt Exporter</span>
                <h4 className="text-sm font-bold text-white">Generar Spec para la Tarea #{selectedTaskForPrompt.id}</h4>
              </div>
            </div>
            <button
              onClick={handleCopyPrompt}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Prompt
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Este prompt package encapsula el contexto de la épica, historia de usuario y las reglas matemáticas de diseño necesarias para que tu IA de codificación preferida cree el código sin desviaciones técnicas.
          </p>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono leading-relaxed text-slate-300 overflow-auto max-h-[160px] custom-scrollbar select-all">
            <pre>{generateSddPrompt(selectedTaskForPrompt)}</pre>
          </div>
        </div>
      )}

    </div>
  );
}
