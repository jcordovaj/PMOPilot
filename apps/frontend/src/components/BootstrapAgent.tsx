/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Settings, 
  ShieldCheck, 
  Download, 
  Copy, 
  FileCode, 
  FolderSync,
  Sparkles,
  Check
} from "lucide-react";

import { ProjectState, UserRole } from "../types";

interface GeneratedFile {
  path: string;
  content: string;
}

interface BootstrapAgentProps {
  onInitializeProject: (projectName: string, members: string[]) => void;
  onAddLog: (agent: string, text: string, type: string) => void;
  cloudflareConfig: any;
  setCloudflareConfig: (cfg: any) => void;
  userRole: UserRole;
  checkPermission: (actionName: string) => boolean;
}

export default function BootstrapAgent({ 
  onInitializeProject, 
  onAddLog,
  cloudflareConfig,
  setCloudflareConfig,
  userRole,
  checkPermission
}: BootstrapAgentProps) {
  const [projectName, setProjectName] = useState("MyAwesomeApp");
  const [framework, setFramework] = useState("React & Node (Vite)");
  const [branchProtection, setBranchProtection] = useState(true);
  const [leadDeveloper, setLeadDeveloper] = useState("carlos-lead");
  const [loading, setLoading] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [activeFileIdx, setActiveFileIdx] = useState<number>(0);
  const [settingsSummary, setSettingsSummary] = useState<any>(null);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    if (!checkPermission("BOOTSTRAP_PROJECT")) {
      onAddLog("System Guard", "Acción bloqueada: Tu rol de Colaborador/Tester no tiene permisos de inicialización de infraestructura.", "error");
      return;
    }

    setLoading(true);
    onAddLog("Bootstrap Agent", `Inicializando flujo de creación para el proyecto: ${projectName}...`, "info");
    
    try {
      const response = await fetch("/api/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          framework,
          branchProtection,
          teamMembers: [leadDeveloper]
        })
      });

      if (!response.ok) {
        throw new Error("Bootstrap generation failed");
      }

      const data = await response.json();
      setGeneratedFiles(data.files);
      setSettingsSummary(data.settingsSummary);
      setActiveFileIdx(0);
      
      // Update parent project state
      const members = [`${leadDeveloper} (Lead Dev)`, "Ana (Frontend Dev)", "David (Backend Dev)", "Sofia (Product Owner)"];
      onInitializeProject(projectName, members);
      
      onAddLog("Bootstrap Agent", `¡Proyecto '${projectName}' inicializado con éxito! Generados 3 archivos de configuración.`, "success");
      onAddLog("Git Guardian", "Rama 'main' protegida automáticamente. Se prohibieron los direct-pushes.", "success");
    } catch (err: any) {
      console.error(err);
      onAddLog("Bootstrap Agent", `Error al inicializar: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, path: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(path);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="space-y-6" id="bootstrap-agent-panel">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bootstrap Agent</h2>
        <p className="text-sm text-slate-500">Configura la infraestructura de gobierno técnico de tu repositorio sin lidiar con YAMLs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Config Form (Left) */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-100 rounded-xl shadow-sm space-y-5 h-fit">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            Configuración del Proyecto
          </h3>

          <form onSubmit={handleBootstrap} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre del Proyecto</label>
              <input 
                type="text" 
                value={projectName} 
                onChange={e => setProjectName(e.target.value)}
                placeholder="Nombre de la app o repositorio" 
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Stack Tecnológico</label>
              <select 
                value={framework} 
                onChange={e => setFramework(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              >
                <option value="React & Node (Vite)">React & Node (Vite)</option>
                <option value="Python Flask/Django">Python Flask / Django</option>
                <option value="Next.js (App Router)">Next.js (App Router)</option>
                <option value="Svelte / Tailwind">Svelte / Tailwind</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Lead Developer (GitHub User)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-mono">@</span>
                <input 
                  type="text" 
                  value={leadDeveloper} 
                  onChange={e => setLeadDeveloper(e.target.value)}
                  placeholder="github-username" 
                  required
                  className="w-full pl-7 pr-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Branch Protection Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={branchProtection} 
                  onChange={e => setBranchProtection(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-700 block">Protección de Rama 'main'</span>
                  <span className="text-xs text-slate-400">Prohíbe los pushes directos y obliga a abrir PRs evaluadas por el PR Arbiter.</span>
                </div>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <>
                  <FolderSync className="w-4 h-4 animate-spin" />
                  Estructurando Proyecto...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Bootstrap de Repositorio
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Workspace (Right) */}
        <div className="lg:col-span-3 space-y-4">
          {generatedFiles.length === 0 ? (
            <div className="p-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-3 h-full min-h-[350px]">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Esperando Inicialización</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">Completa el formulario de la izquierda para generar automáticamente los archivos bases de tu SDD.</p>
              </div>
            </div>
          ) : (
            <div className="border border-slate-100 rounded-xl shadow-sm bg-white overflow-hidden flex flex-col h-full min-h-[450px]">
              
              {/* File Tabs Header */}
              <div className="flex items-center justify-between bg-slate-50 border-b border-slate-100 px-4 py-2">
                <div className="flex gap-2">
                  {generatedFiles.map((file, idx) => (
                    <button
                      key={file.path}
                      onClick={() => setActiveFileIdx(idx)}
                      className={`px-3 py-1.5 text-xs font-mono rounded border transition ${
                        activeFileIdx === idx 
                          ? "bg-white border-slate-200 text-slate-800 font-bold shadow-sm" 
                          : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {file.path.split("/").pop()}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(generatedFiles[activeFileIdx].content, generatedFiles[activeFileIdx].path)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition text-xs flex items-center gap-1.5"
                    title="Copiar código"
                  >
                    {copiedFile === generatedFiles[activeFileIdx].path ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-600 font-mono text-[10px]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="font-mono text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Area */}
              <div className="flex-1 p-5 bg-slate-900 text-slate-200 font-mono text-xs overflow-auto h-[280px] leading-relaxed select-all">
                <pre>{generatedFiles[activeFileIdx].content}</pre>
              </div>

              {/* Governance summary banner footer */}
              <div className="bg-slate-50 border-t border-slate-100 p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-700">Protección Activa</span>
                    <span className="text-slate-400 text-[11px]">{settingsSummary?.branchProtection}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FolderSync className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-700">GitFlow Standard</span>
                    <span className="text-slate-400 text-[11px]">Branches: {settingsSummary?.gitFlowConvention}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileCode className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-700">Validación CI/CD</span>
                    <span className="text-slate-400 text-[11px]">{settingsSummary?.continuousIntegration}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
