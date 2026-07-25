import { Epic, Story, Task, Adr, PullRequest } from "../types";

export const INITIAL_MEMBERS = ["Carlos (Lead Dev)", "Ana (Frontend Dev)", "David (Backend Dev)", "Sofia (Product Owner)"];

export const INITIAL_EPICS: Epic[] = [
  {
    id: "epic-1",
    title: "Módulo de Facturación & Suscripciones",
    description: "Crear pasarela de pago para planes Pro y Enterprise, integrando Stripe.",
    status: "in_progress"
  },
  {
    id: "epic-2",
    title: "Optimización de Rendimiento Frontend",
    description: "Reducir el First Contentful Paint a < 1.2s y depurar dependencias.",
    status: "todo"
  },
  {
    id: "epic-3",
    title: "Notificaciones Multicanal",
    description: "Implementar alertas de email, push e integración con Slack.",
    status: "done"
  }
];

export const INITIAL_STORIES: Story[] = [
  {
    id: "story-1",
    title: "Como cliente, quiero pagar con tarjeta de crédito mediante Stripe",
    description: "Permitir la captura segura de tarjetas de crédito y procesamiento inmediato de suscripciones recurrentes.",
    epicId: "epic-1",
    status: "in_progress"
  },
  {
    id: "story-2",
    title: "Como administrador, quiero gestionar reembolsos de pagos",
    description: "Crear consola interna y endpoints backend para devolver cargos desde la API de Stripe.",
    epicId: "epic-1",
    status: "todo"
  },
  {
    id: "story-3",
    title: "Como desarrollador, quiero implementar lazy loading de componentes pesados",
    description: "Utilizar React.lazy y Suspense para dividir el bundle inicial del dashboard y agilizar el FCP.",
    epicId: "epic-2",
    status: "todo"
  },
  {
    id: "story-4",
    title: "Como usuario, quiero recibir resúmenes semanales por correo electrónico",
    description: "Programar un cron job semanal que consolide las métricas y despache boletines elegantes vía SendGrid.",
    epicId: "epic-3",
    status: "done"
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Configurar Stripe Webhooks en el Backend",
    description: "Configurar firma y verificación de eventos webhook recibidos de Stripe en la ruta /api/webhooks/stripe.",
    status: "in_progress",
    priority: "high",
    epicId: "epic-1",
    storyId: "story-1",
    assignedTo: "David (Backend Dev)"
  },
  {
    id: "task-2",
    title: "Diseñar el modal de selección de Plan de Pago",
    description: "Crear interfaz modal con Tailwind CSS que muestre los planes mensual y anual, con transiciones suaves.",
    status: "todo",
    priority: "medium",
    epicId: "epic-1",
    storyId: "story-1",
    assignedTo: "Ana (Frontend Dev)"
  },
  {
    id: "task-3",
    title: "Integrar Stripe Elements en el formulario de Checkout",
    description: "Validar números de tarjeta de crédito, fecha de expiración y CVC del lado del cliente antes de enviar el token.",
    status: "todo",
    priority: "high",
    epicId: "epic-1",
    storyId: "story-1",
    assignedTo: "Ana (Frontend Dev)"
  },
  {
    id: "task-4",
    title: "Crear endpoint POST /api/billing/refund para administradores",
    description: "Integrar el cliente de Stripe SDK para emitir devoluciones totales o parciales validadas por rol.",
    status: "todo",
    priority: "low",
    epicId: "epic-1",
    storyId: "story-2",
    assignedTo: "David (Backend Dev)"
  },
  {
    id: "task-5",
    title: "Configurar plantillas de correo en SendGrid",
    description: "Disenar las plantillas HTML responsivas para correos transaccionales y de bienvenida.",
    status: "done",
    priority: "medium",
    epicId: "epic-3",
    storyId: "story-4",
    assignedTo: "David (Backend Dev)"
  }
];

export const INITIAL_ADRS: Adr[] = [
  {
    id: "ADR-001",
    title: "Elección de Stack Arquitectónico PmoPilot",
    status: "accepted",
    date: "2026-07-23",
    author: "Arquitecto Principal",
    context: "PmoPilot necesita un backend robusto capaz de conectarse de forma segura con la API de Gemini sin exponer llaves privadas en el frontend, y un frontend dinámico para mostrar el panel interactivo del PMO.",
    decision: "Seleccionar una arquitectura full-stack integrada (Express + React con Vite y Tailwind v4). El backend procesará todas las peticiones de IA, y el frontend servirá de consola visual.",
    consequences: "Estructura unificada, seguridad absoluta de la GEMINI_API_KEY, renderizado ultrarrápido sin flickering de HMR."
  },
  {
    id: "ADR-002",
    title: "Adopción de Metodología Spec-Driven Development (SDD)",
    status: "accepted",
    date: "2026-07-23",
    author: "CTO / PmoPilot Orchestrator",
    context: "El desarrollo mediante agentes de software genera problemas de consistencia si no se definen las entradas, los flujos y las salidas esperadas de forma explícita.",
    decision: "Establecer que cada Epic, Story y Task generados por PmoPilot se estructuren de forma técnica con su descripción orientada a prompts (Input, Process, Output y Checkpoints de QA).",
    consequences: "Reducción drástica del desperdicio de tokens por reescritura, automatización completa del PR Arbiter para evaluar cumplimiento de especificaciones."
  }
];

export const SAMPLE_PRS: PullRequest[] = [
  {
    id: "pr-1",
    number: 104,
    title: "feat: checkout screen implementation with card validation",
    branch: "feature/checkout-validation",
    author: "Ana (Frontend Dev)",
    status: "open",
    codeChanges: `import React, { useState } from 'react';

export default function CheckoutForm({ onPaymentSuccess }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validaciones basicas del lado del cliente
    if (cardNumber.length < 16) {
      setError('Número de tarjeta inválido (mínimo 16 dígitos).');
      return;
    }
    if (!expiry.includes('/') || expiry.length < 5) {
      setError('Formato de expiración inválido (MM/AA).');
      return;
    }
    if (cvc.length < 3) {
      setError('Código CVC inválido.');
      return;
    }

    setLoading(true);
    try {
      // Simular llamada de pago seguro con Stripe
      setTimeout(() => {
        setLoading(false);
        onPaymentSuccess();
      }, 1500);
    } catch (err) {
      setError('La pasarela de pago rechazó la transacción.');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-slate-200 rounded-lg">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Detalle de Pago</h3>
      {error && <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm rounded border border-red-100">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Número de Tarjeta</label>
          <input 
            type="text" 
            value={cardNumber} 
            onChange={e => setCardNumber(e.target.value)} 
            placeholder="4111 2222 3333 4444" 
            className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Expiración (MM/AA)</label>
            <input 
              type="text" 
              value={expiry} 
              onChange={e => setExpiry(e.target.value)} 
              placeholder="12/28" 
              className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">CVC</label>
            <input 
              type="password" 
              value={cvc} 
              onChange={e => setCvc(e.target.value)} 
              placeholder="123" 
              className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Procesando pago...' : 'Pagar Suscripción'}
        </button>
      </form>
    </div>
  );
}`,
    checks: [
      { id: "chk-1", name: "Compilación & Bundling", status: "success", message: "Build exitoso en dist/ en 1.4s" },
      { id: "chk-2", name: "Linter (ESLint / TSC)", status: "success", message: "0 errores, 0 advertencias de tipos" },
      { id: "chk-3", name: "Pruebas Unitarias", status: "success", message: "4 pruebas ejecutadas, todas exitosas" },
      { id: "chk-4", name: "Análisis de Seguridad (SAST)", status: "success", message: "Ninguna clave privada expuesta." }
    ]
  },
  {
    id: "pr-2",
    number: 105,
    title: "draft: billing refund backend API route",
    branch: "feature/billing-refund",
    author: "David (Backend Dev)",
    status: "open",
    codeChanges: `// POST /api/billing/refund
// endpoint borrador para reembolsos
import Stripe from 'stripe';

export default async function handleRefund(req, res) {
  const { chargeId, amount } = req.body;
  
  // TODO: verificar si el usuario es administrador
  
  try {
    const refund = { id: 'ref_123', status: 'pending' };
    res.json({ success: true, refund });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}`,
    checks: [
      { id: "chk-1", name: "Compilación & Bundling", status: "success", message: "Compilación Node completada" },
      { id: "chk-2", name: "Linter (ESLint / TSC)", status: "success", message: "2 advertencias detectadas (TODO pendientes)" },
      { id: "chk-3", name: "Pruebas Unitarias", status: "pending", message: "Pruebas pendientes de ejecución" },
      { id: "chk-4", name: "Análisis de Seguridad (SAST)", status: "failed", message: "Advertencia crítica: El endpoint no realiza validación de autorización del rol administrador." }
    ]
  }
];

export const RECENT_LOGS = [
  { time: "12:05:32", agent: "Git Guardian", text: "Nueva rama detectada: feature/billing-refund creada por David.", type: "info" },
  { time: "11:58:12", agent: "PR Arbiter", text: "Pull Request #104 analizada. Verificación de Spec-Driven exitosa.", type: "success" },
  { time: "11:50:00", agent: "Bootstrap Agent", text: "Firma CODEOWNERS verificada para Carlos (Lead Dev).", type: "success" },
  { time: "10:30:15", agent: "Planning Agent", text: "Backlog sincronizado automáticamente con los ADRs.", type: "info" },
  { time: "09:12:45", agent: "Git Guardian", text: "Conflicto potencial mitigado entre feature/checkout-validation y master.", type: "warning" }
];
