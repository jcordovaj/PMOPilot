/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  GitPullRequest, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowUpRight, 
  Eye, 
  Cpu, 
  Check, 
  Sparkles 
} from "lucide-react";
import { PullRequest, ProjectState, Task, UserRole } from "../types";

interface GitGuardianProps {
  projectState: ProjectState;
  pullRequests: PullRequest[];
  onMergePr: (prId: string, taskId: string) => void;
  onUpdatePrChecks: (prId: string, reviewMarkdown: string, checks: any[]) => void;
  onAddLog: (agent: string, text: string, type: string) => void;
  userRole: UserRole;
  checkPermission: (actionName: string) => boolean;
}

export default function GitGuardian({ 
  projectState, 
  pullRequests, 
  onMergePr, 
  onUpdatePrChecks, 
  onAddLog,
  userRole,
  checkPermission
}: GitGuardianProps) {
  const [selectedPrId, setSelectedPrId] = useState<string>(pullRequests[0]?.id || "");
  const [auditingPrId, setAuditingPrId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  const activePr = pullRequests.find(pr => pr.id === selectedPrId);

  // Trigger PR Arbiter AI Audit
  const handlePrAudit = async () => {
    if (!activePr) return;

    setAuditingPrId(activePr.id);
    onAddLog("PR Arbiter", `Iniciando auditoría de código asistida por IA para la PR #${activePr.number}...`, "info");

    // Attempt to link PR with a corresponding task specification
    const linkedTask = projectState.tasks.find(t => t.id === selectedTaskId) || projectState.tasks[0];
    const taskSpec = linkedTask ? `${linkedTask.title}: ${linkedTask.description}` : "Implementar pasarela de facturación e inicio de checkout";

    try {
      const response = await fetch("/api/pr-arbiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prTitle: activePr.title,
          prBranch: activePr.branch,
          codeChanges: activePr.codeChanges,
          taskSpec
        })
      });

      if (!response.ok) {
        throw new Error("PR Audit failed");
      }

      const data = await response.json();
      
      // Update checks and review in parent state
      onUpdatePrChecks(activePr.id, data.review, data.checks);
      
      onAddLog("PR Arbiter", `Auditoría completada para PR #${activePr.number}. Análisis de cumplimiento SDD registrado.`, "success");
      if (data.isMock) {
        onAddLog("Git Guardian", "Corriendo linter local y verificaciones de empaquetado automáticas (simulación).", "info");
      }
    } catch (error: any) {
      console.error(error);
      onAddLog("PR Arbiter", `Error durante auditoría: ${error.message}`, "error");
    } finally {
      setAuditingPrId(null);
    }
  };

  const handleMerge = () => {
    if (!activePr) return;
    
    if (!checkPermission("COMMIT_CODE")) {
      onAddLog("System Guard", "Acción bloqueada: Tu rol de Tester no tiene permisos para fusionar (merge) código en 'main'. Cambia a rol de Líder o Colaborador.", "error");
      return;
    }
    
    // Linked task ID
    const taskId = selectedTaskId || "task-1";
    onMergePr(activePr.id, taskId);
    onAddLog("PR Arbiter", `¡Pull Request #${activePr.number} fusionada con éxito en 'main'!`, "success");
    onAddLog("Git Guardian", `Cerrada rama activa: ${activePr.branch}.`, "info");
  };

  return (
    <div className="space-y-6" id="git-guardian-panel">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Git Guardian & PR Arbiter</h2>
        <p className="text-sm text-slate-500">Supervisa integraciones de código de forma colaborativa, validando automáticamente la adherencia a las especificaciones originales.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Pull Requests List (Left Column) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-slate-400" />
            Pull Requests Abiertas
          </h3>

          <div className="space-y-3">
            {pullRequests.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center text-xs text-slate-400">
                No hay Pull Requests abiertas en este momento.
              </div>
            ) : (
              pullRequests.map(pr => {
                const pendingChecks = pr.checks.filter(c => c.status === "pending").length;
                const failedChecks = pr.checks.filter(c => c.status === "failed").length;
                
                return (
                  <div 
                    key={pr.id}
                    onClick={() => setSelectedPrId(pr.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition space-y-3 ${
                      selectedPrId === pr.id 
                        ? "bg-white border-blue-500 ring-2 ring-blue-50 shadow-sm" 
                        : "bg-white border-slate-100 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-400">PR #{pr.number}</span>
                        <h4 className="text-sm font-bold text-slate-800 mt-0.5 line-clamp-1">{pr.title}</h4>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                          <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{pr.branch}</span>
                          <span>by {pr.author.split(" (")[0]}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        pr.status === "open" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                        pr.status === "merged" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        "bg-slate-50 text-slate-500"
                      }`}>
                        {pr.status === "open" ? "Abierta" : "Fusionada"}
                      </span>
                    </div>

                    {/* Mini checks checklist status bar */}
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-50 text-slate-400">
                      <span>Checks automáticos</span>
                      <span className="flex items-center gap-1">
                        {failedChecks > 0 ? (
                          <span className="text-red-500 flex items-center gap-0.5"><XCircle className="w-3.5 h-3.5" /> Falla</span>
                        ) : pendingChecks > 0 ? (
                          <span className="text-amber-500 flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> {pendingChecks} pendiente</span>
                        ) : (
                          <span className="text-emerald-500 flex items-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" /> Todo OK</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PR Workspace Detail (Right Column) */}
        <div className="lg:col-span-3 space-y-4">
          {activePr ? (
            <div className="p-6 bg-white border border-slate-100 rounded-xl shadow-sm space-y-6">
              
              {/* Header and main actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">Pull Request #{activePr.number}</span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="font-mono text-xs text-slate-500">{activePr.branch}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mt-1">{activePr.title}</h3>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePrAudit}
                    disabled={!!auditingPrId || activePr.status !== "open"}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm"
                  >
                    {auditingPrId ? (
                      <>
                        <Cpu className="w-4 h-4 animate-spin" />
                        Auditando Código...
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4" />
                        Audit con PR Arbiter
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleMerge}
                    disabled={activePr.status !== "open" || activePr.checks.some(c => c.status === "failed" || c.status === "pending")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    Merge Pull Request
                  </button>
                </div>
              </div>

              {/* Linking task configuration */}
              {activePr.status === "open" && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-700 block">Vincular con Tarea Backlog</span>
                    <span className="text-slate-400 text-[11px]">Asocia esta PR con la especificación SDD para validar adherencia técnica.</span>
                  </div>
                  <select
                    value={selectedTaskId}
                    onChange={e => setSelectedTaskId(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Seleccionar Tarea --</option>
                    {projectState.tasks.filter(t => t.status === "in_progress" || t.status === "todo").map(t => (
                      <option key={t.id} value={t.id}>#{t.id} - {t.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Code Changes Accordion */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  Cambios de Código en la PR
                </h4>
                <div className="p-4 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[220px] custom-scrollbar">
                  <pre>{activePr.codeChanges}</pre>
                </div>
              </div>

              {/* Pipeline Checks list */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Línea de Validación Técnica (Checks)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activePr.checks.map(check => (
                    <div key={check.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2.5">
                      {check.status === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      ) : check.status === "failed" ? (
                        <XCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0 animate-pulse" />
                      )}
                      <div>
                        <span className="text-xs font-semibold text-slate-700 block">{check.name}</span>
                        <span className="text-[11px] text-slate-400 leading-normal block mt-0.5">{check.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PR Arbiter AI Review Output */}
              {activePr.aiReview && (
                <div className="p-5 bg-indigo-50/40 border border-indigo-100 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Análisis del PR Arbiter (Gemini Evaluation)
                  </h4>
                  <div className="text-xs text-slate-700 leading-relaxed space-y-1.5 whitespace-pre-wrap font-sans">
                    {activePr.aiReview}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center h-full min-h-[350px]">
              <div className="p-4 bg-slate-100 text-slate-400 rounded-full">
                <GitPullRequest className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mt-2">Selecciona una PR</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">Haz clic en alguna de las Pull Requests en el listado izquierdo para auditar el código con el PR Arbiter.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
