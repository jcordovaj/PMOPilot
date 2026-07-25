/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  GitBranch, 
  GitPullRequest, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Users, 
  Activity, 
  Clock, 
  FileText,
  Shield,
  Send,
  Lock,
  Unlock,
  Sliders,
  RefreshCw,
  Database,
  BarChart3,
  Mail,
  Cpu,
  Server,
  Network,
  Check
} from "lucide-react";
import { ProjectState, Task, UserRole } from "../types";

interface DashboardProps {
  projectState: ProjectState;
  logs: Array<{ time: string; agent: string; text: string; type: string }>;
  onClearLogs: () => void;
  onAddTask: (task: Task) => void;
  notifications: any[];
  cloudflareConfig: any;
  setCloudflareConfig: (cfg: any) => void;
  userRole: UserRole;
  onTriggerSendGrid: (subject: string, to: string, body: string, templateId: string) => void;
}

export default function Dashboard({ 
  projectState, 
  logs, 
  onClearLogs, 
  onAddTask,
  notifications,
  cloudflareConfig,
  setCloudflareConfig,
  userRole,
  onTriggerSendGrid
}: DashboardProps) {
  // Statistics
  const totalTasks = projectState.tasks.length;
  const completedTasks = projectState.tasks.filter(t => t.status === "done").length;
  const inProgressTasks = projectState.tasks.filter(t => t.status === "in_progress").length;
  const todoTasks = projectState.tasks.filter(t => t.status === "todo").length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Telemetry Load States
  const [simulatedLoad, setSimulatedLoad] = useState(45);
  const [activeTelemetryTab, setActiveTelemetryTab] = useState<"grafana" | "sendgrid" | "cloudflare">("grafana");
  
  // SendGrid form fields
  const [sendGridEmail, setSendGridEmail] = useState("fundador@startup.com");
  const [sendGridSubject, setSendGridSubject] = useState("Alerta PMO: Sincronización de Backlog Correcta");
  const [sendGridBody, setSendGridBody] = useState(
    "Hola Carlos,\n\nSe han mapeado correctamente todas las especificaciones y ADRs inyectando las épicas de arquitectura al Kanban.\n\nAtentamente,\nServicio de Notificación SendGrid para PmoPilot"
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // Dynamic values calculated from simulatedLoad
  const latency = Math.round(simulatedLoad * 1.8 + 12);
  const cpuTemp = Math.round(35 + (simulatedLoad * 0.45));
  const queryPerSecond = Math.round(simulatedLoad * 14.2 + 80);

  // Trigger SendGrid Simulation
  const handleSendEmailSimulation = () => {
    setSendingEmail(true);
    setEmailStatus("Conectando con el SMTP relay de SendGrid...");
    setTimeout(() => {
      onTriggerSendGrid(sendGridSubject, sendGridEmail, sendGridBody, "d-custom-template-pmo");
      setSendingEmail(false);
      setEmailStatus("¡Notificación despachada con éxito!");
      setTimeout(() => setEmailStatus(null), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-6" id="observability-agent-panel">
      
      {/* Overview Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-xs flex items-center gap-3 text-left">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">4 Ramas Activas</div>
            <div className="text-xs text-slate-400">1 Conflicto mitigado</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-xs flex items-center gap-3 text-left">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">2 Pull Requests</div>
            <div className="text-xs text-slate-400">1 aprobada para fusión</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-xs flex items-center gap-3 text-left">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">92.5% Cobertura</div>
            <div className="text-xs text-slate-400">Pruebas unitarias pasadas</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-xs flex items-center gap-3 text-left">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">0 Vulnerabilidades</div>
            <div className="text-xs text-slate-400">SAST Security scan: A+</div>
          </div>
        </div>
      </div>

      {/* CORE INTEGRATIONS TELEMETRY WORKSPACE (Grafana Portal Focus) */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        
        {/* Observability Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
            <div>
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest font-mono">
                PmoPilot Infrastructure Observability Engine
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Mapeo gráfico de Grafana, SendGrid API Gateway y protección perimetral Cloudflare.</p>
            </div>
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTelemetryTab("grafana")}
              className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition flex items-center gap-1.5 ${
                activeTelemetryTab === "grafana" ? "bg-orange-500 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Grafana Dashboard
            </button>
            <button
              onClick={() => setActiveTelemetryTab("sendgrid")}
              className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition flex items-center gap-1.5 ${
                activeTelemetryTab === "sendgrid" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              SendGrid Mail Gateway
            </button>
            <button
              onClick={() => setActiveTelemetryTab("cloudflare")}
              className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition flex items-center gap-1.5 ${
                activeTelemetryTab === "cloudflare" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Cloudflare DDOS Shield
            </button>
          </div>
        </div>

        {/* Telemetry Tab Container */}
        <div className="p-5 md:p-6 min-h-[290px]">
          
          {/* TAB 1: GRAFANA INTERACTIVE PORTAL */}
          {activeTelemetryTab === "grafana" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
              
              {/* Telemetry controls and digital gauges */}
              <div className="lg:col-span-4 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Gauges de Servidor</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">CPU Load</span>
                    <span className="text-xl font-bold text-orange-400 font-mono">{simulatedLoad}%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full" style={{ width: `${simulatedLoad}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">Latency</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono">{latency}ms</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (latency / 200) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">Core Temp</span>
                    <span className="text-xl font-bold text-yellow-400 font-mono">{cpuTemp}°C</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${Math.min(100, (cpuTemp / 100) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">Throughput</span>
                    <span className="text-xl font-bold text-blue-400 font-mono">{queryPerSecond}/s</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (queryPerSecond / 1500) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5" /> Simular Carga de Tráfico</span>
                    <span>{simulatedLoad}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={simulatedLoad}
                    onChange={(e) => setSimulatedLoad(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="text-[8px] text-slate-500 block">Modifica el potenciómetro para simular estrés de API y ver la fluctuación del renderizador.</span>
                </div>
              </div>

              {/* Graphical representation of the Live wave dashboard */}
              <div className="lg:col-span-8 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Grafana Live Waveform Telemetry</span>
                  <span className="text-[9px] bg-slate-950 text-emerald-400 font-mono border border-slate-800 px-2 py-0.5 rounded">
                    PROMETHEUS SYNCED
                  </span>
                </div>

                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 relative">
                  {/* Grid Lines mockup */}
                  <div className="absolute inset-0 grid grid-rows-4 grid-cols-6 pointer-events-none opacity-10">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="border-t border-r border-slate-100" />
                    ))}
                  </div>

                  {/* SVG Line Graph representation */}
                  <div className="h-44 flex items-end relative z-10 pt-4">
                    <svg className="w-full h-full text-orange-500" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M0,40 Q10,${35 - simulatedLoad * 0.15} 25,${38 - simulatedLoad * 0.25} T50,${25 - simulatedLoad * 0.22} T75,${30 - simulatedLoad * 0.28} T100,${40 - simulatedLoad * 0.35} L100,40 L0,40 Z`}
                        fill="url(#chartGrad)"
                        className="transition-all duration-500"
                      />
                      <path
                        d={`M0,40 Q10,${35 - simulatedLoad * 0.15} 25,${38 - simulatedLoad * 0.25} T50,${25 - simulatedLoad * 0.22} T75,${30 - simulatedLoad * 0.28} T100,${40 - simulatedLoad * 0.35}`}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="1.2"
                        className="transition-all duration-500"
                      />
                    </svg>

                    {/* Floating status badges */}
                    <div className="absolute bottom-2 left-2 bg-slate-900/95 border border-slate-800 px-2 py-1 rounded text-[9px] font-mono text-slate-400 flex items-center gap-1">
                      <Server className="w-3 h-3 text-orange-500" />
                      <span>PostgreSQL Master Pool: <strong>OK</strong></span>
                    </div>

                    <div className="absolute top-2 right-2 bg-slate-900/95 border border-slate-800 px-2 py-1 rounded text-[9px] font-mono text-slate-400 flex items-center gap-1">
                      <Network className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>Inbound: <strong>{simulatedLoad * 4.5} req/sec</strong></span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SENDGRID GATEWAY EMAIL NOTIFIER */}
          {activeTelemetryTab === "sendgrid" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
              
              {/* Email drafting dispatch portal */}
              <div className="lg:col-span-6 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Despacho de Alertas SMTP SendGrid</span>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Destinatario (Email del Líder)</label>
                      <input
                        type="email"
                        value={sendGridEmail}
                        onChange={(e) => setSendGridEmail(e.target.value)}
                        placeholder="ej. founder@startup.com"
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Template SendGrid ID</label>
                      <input
                        type="text"
                        disabled
                        value="d-sg-pmo-custom-template"
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Asunto de Notificación Transaccional</label>
                    <input
                      type="text"
                      value={sendGridSubject}
                      onChange={(e) => setSendGridSubject(e.target.value)}
                      placeholder="Asunto"
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Cuerpo del Email (HTML/Texto)</label>
                    <textarea
                      value={sendGridBody}
                      onChange={(e) => setSendGridBody(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {emailStatus && (
                    <div className="p-2 bg-slate-950 border border-blue-900 rounded-lg text-[10px] text-blue-400 font-mono">
                      {emailStatus}
                    </div>
                  )}

                  <button
                    onClick={handleSendEmailSimulation}
                    disabled={sendingEmail || !sendGridEmail || !sendGridSubject}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-mono font-bold rounded-lg text-[10px] flex items-center justify-center gap-1.5 transition"
                  >
                    {sendingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Gatillar Notificación de Correo SendGrid
                  </button>
                </div>
              </div>

              {/* Sent alerts tray history log */}
              <div className="lg:col-span-6 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Historial de Alertas Despachadas</span>
                
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 h-64 overflow-y-auto divide-y divide-slate-900 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-600 italic font-mono text-center pt-16">Sin registros de emails despachados.</p>
                  ) : (
                    notifications.map(mail => (
                      <div key={mail.id} className="py-2.5 first:pt-0 last:pb-0 text-left space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <strong className="text-slate-200 truncate">{mail.subject}</strong>
                          <span className="text-[9px] text-slate-500 font-mono shrink-0 ml-1">{mail.time}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 line-clamp-1 truncate font-mono">Para: {mail.to}</p>
                        <div className="flex items-center justify-between mt-1 text-[8px] font-mono">
                          <span className="bg-slate-900 border border-slate-800 px-1 rounded text-slate-500">Template: {mail.templateId}</span>
                          <span className="text-emerald-500 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> ENTREGADO (SMTP: OK)
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CLOUDFLARE PROTECTION CONTROL */}
          {activeTelemetryTab === "cloudflare" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left relative overflow-hidden">
              
              {/* Cloudflare settings list */}
              <div className="lg:col-span-6 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Parámetros de Seguridad Perimetral</span>
                
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">Perímetro SSL</span>
                      <span className="text-xs font-bold font-mono text-white">Full / Strict Encryption</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">Firewall Shield</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">ACTIVADO</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">Zone ID de Producción</span>
                    <span className="text-xs font-mono text-slate-300 break-all">{cloudflareConfig.zoneId || "cf_zone_pmo_pilot_prod_9812"}</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">API Token JWT Key</span>
                    <span className="text-xs font-mono text-slate-400">••••••••••••••••••••••••••••••••••••••</span>
                  </div>
                </div>
              </div>

              {/* Cloudflare live attack maps mockup */}
              <div className="lg:col-span-6 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Monitoreo de Mitigaciones en Vivo</span>
                
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 h-44 flex flex-col justify-between font-mono text-[10px]">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Mitigaciones DDOS</span>
                    <span className="text-emerald-400">0 Ataques Activos</span>
                  </div>
                  
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[9px] border-b border-slate-900 pb-1">
                      <span className="text-slate-400">10:45:12 - Inyección SQL bloqueada</span>
                      <span className="text-amber-500">IP: 185.12.92.1</span>
                    </div>
                    <div className="flex justify-between text-[9px] border-b border-slate-900 pb-1">
                      <span className="text-slate-400">11:15:30 - Bloqueo de bot de scraping</span>
                      <span className="text-amber-500">IP: 92.185.2.14</span>
                    </div>
                    <div className="flex justify-between text-[9px] pb-1">
                      <span className="text-slate-400">12:02:44 - Sanitización de encabezados HTTP</span>
                      <span className="text-emerald-400">IP: 200.15.92.11</span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 p-2 rounded text-[9px] text-slate-500 text-center">
                    Los filtros perimetrales limpian el tráfico antes de tocar tu base de datos relacional.
                  </div>
                </div>
              </div>

              {/* Protected overlay if role isn't leader */}
              {userRole !== "leader" && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 transition duration-200 z-30">
                  <Lock className="w-10 h-10 text-orange-500 animate-bounce mb-2" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Consola Cloudflare Protegida por RBAC</span>
                  <p className="text-[11px] text-slate-300 max-w-[340px] leading-relaxed mt-1">
                    Solo los usuarios con rol de **Líder (Carlos)** poseen tokens criptográficos para modificar los parámetros de protección en el API de Cloudflare.
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Main Dashboard Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* Left Col: Backlog progress and active branches */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Backlog Summary Card */}
          <div className="p-6 bg-white border border-slate-100 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                Resumen de Progreso Semántico del Proyecto
              </h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
                {completionPercentage}% Completado
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>

            {/* Mini task lists grouped */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100/50">
                <span className="block text-xl font-bold text-slate-700">{todoTasks}</span>
                <span className="text-xs text-slate-400">Por Hacer</span>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100/20">
                <span className="block text-xl font-bold text-blue-600">{inProgressTasks}</span>
                <span className="text-xs text-blue-400">En Curso</span>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100/20">
                <span className="block text-xl font-bold text-emerald-600">{completedTasks}</span>
                <span className="text-xs text-emerald-400">Hecho</span>
              </div>
            </div>

            {/* List of active key tasks */}
            <div className="space-y-2.5 pt-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tareas Prioritarias en Curso</h4>
              {projectState.tasks.length === 0 ? (
                <div className="text-center p-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded">
                  No hay tareas registradas. Dirígete al Tablero Kanban para poblar el backlog.
                </div>
              ) : (
                projectState.tasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50/50 transition flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        task.status === "done" ? "bg-emerald-500" : task.status === "in_progress" ? "bg-blue-500" : "bg-slate-400"
                      }`} />
                      <div>
                        <span className="text-[9px] text-slate-400 block font-mono">#{task.id}</span>
                        <span className="text-xs font-semibold text-slate-700">{task.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        task.priority === "high" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                        task.priority === "medium" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                        "bg-slate-50 text-slate-600 border border-slate-200"
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                        {task.assignedTo || "No asignada"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Branches and conflict checks */}
          <div className="p-6 bg-white border border-slate-100 rounded-xl shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-slate-500" />
              Estado de Ramas Activas (Git Guardian Shield)
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-slate-600" />
                  <span className="font-mono text-xs font-bold text-slate-700">main</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold">PROTEGER</span>
                  <span className="text-[10px] text-slate-400">Limpia de conflictos</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span className="font-mono text-xs font-bold text-slate-700">feature/checkout-validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-bold">PR #104 Abierta</span>
                  <span className="text-[10px] text-slate-400 font-medium">Ana (Tester)</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/40 rounded-lg border border-amber-100/50 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-amber-600" />
                  <span className="font-mono text-xs font-bold text-amber-800">feature/billing-refund</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Alerta de Conflicto
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">David (Backend)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Team members, Logs terminal */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Members Card */}
          <div className="p-6 bg-white border border-slate-100 rounded-xl shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              Equipo de Ingeniería (CODEOWNERS)
            </h3>

            <div className="space-y-3.5">
              {projectState.members.map((member, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                      {member.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block">{member.split(" (")[0]}</span>
                      <span className="text-[10px] text-slate-400">{member.split(" (")[1]?.replace(")", "") || "Colaborador"}</span>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                </div>
              ))}
            </div>
          </div>

          {/* Live Terminal logs */}
          <div className="p-6 bg-slate-900 text-slate-200 rounded-xl shadow-md border border-slate-800 space-y-3 flex flex-col h-[330px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Stream de Eventos (PMO Log)
              </span>
              <button 
                onClick={onClearLogs}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition"
              >
                Clear Log
              </button>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-2 pr-1 custom-scrollbar text-left leading-normal">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic text-center pt-8">Ningún evento registrado.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="leading-relaxed break-words">
                    <span className="text-slate-500">[{log.time}]</span>{" "}
                    <span className="text-indigo-400">[{log.agent}]</span>:{" "}
                    <span className={
                      log.type === "success" ? "text-emerald-400" :
                      log.type === "warning" ? "text-amber-400" :
                      log.type === "error" ? "text-rose-400" : "text-slate-300"
                    }>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
