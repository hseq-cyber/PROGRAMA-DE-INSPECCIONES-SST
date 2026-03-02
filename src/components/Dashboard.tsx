import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react';
import { DashboardStats } from '../types';
import { generateInspectionPDF } from '../utils/pdfGenerator';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInspections, setRecentInspections] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(setStats);
    
    fetch('/api/inspections')
      .then(res => res.json())
      .then(data => setRecentInspections(data.slice(0, 5)));
  }, []);

  const handleDownloadPDF = async (id: number) => {
    const res = await fetch(`/api/inspections/${id}`);
    const data = await res.json();
    generateInspectionPDF(data);
  };

  if (!stats) return <div className="flex items-center justify-center h-64">Cargando indicadores...</div>;

  const kpis = [
    { label: 'Programadas', value: stats.totalScheduled, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Ejecutadas', value: stats.executed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pendientes', value: stats.pending, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Hallazgos Abiertos', value: stats.openFindings, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Hallazgos Cerrados', value: stats.closedFindings, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Índice Corrección', value: `${stats.riskCorrectionIndex}%`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  const complianceData = [
    { name: 'Extintores', value: 85 },
    { name: 'Botiquín', value: 92 },
    { name: 'Locativo', value: 78 },
    { name: 'Químicos', value: 65 },
  ];

  const findingsByStatus = [
    { name: 'Abiertos', value: stats.openFindings },
    { name: 'Cerrados', value: stats.closedFindings },
  ];

  const trendData = [
    { month: 'Ene', inspections: 12 },
    { month: 'Feb', inspections: 15 },
    { month: 'Mar', inspections: 18 },
    { month: 'Abr', inspections: 14 },
    { month: 'May', inspections: 20 },
    { month: 'Jun', inspections: 22 },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${kpi.bg} ${kpi.color} p-2 rounded-lg`}>
                <kpi.icon size={20} />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight size={12} /> 12%
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{kpi.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Cumplimiento por Tipo de Inspección</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Hallazgos por Estado</h3>
          <div className="h-80 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={findingsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {findingsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Tendencia Mensual de Inspecciones</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="inspections" stroke="#6366f1" strokeWidth={3} dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Alertas Automáticas</h3>
          <div className="space-y-4">
            {[
              { title: 'Inspección Vencida', desc: 'Extintores - Área Producción', date: 'Hace 2 días', type: 'error' },
              { title: 'Próxima Recarga', desc: 'Extintor #045 - CO2', date: 'En 5 días', type: 'warning' },
              { title: 'Hallazgo Crítico', desc: 'Riesgo Eléctrico - Bodega', date: 'Vence mañana', type: 'error' },
              { title: 'Inspección Pendiente', desc: 'Botiquín - Oficinas', date: 'Programada hoy', type: 'info' },
            ].map((alert, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                  alert.type === 'error' ? 'bg-red-500' : 
                  alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{alert.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{alert.desc}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">{alert.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Inspections Full Width */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold mb-6">Historial de Inspecciones Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-4 py-3">Tipo de Inspección</th>
                <th className="px-4 py-3">Fecha de Ejecución</th>
                <th className="px-4 py-3">Inspector Responsable</th>
                <th className="px-4 py-3 text-right">Reporte PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-700">{insp.type_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {format(new Date(insp.execution_date), 'dd MMM yyyy HH:mm', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{insp.inspector_name}</td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDownloadPDF(insp.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all text-xs font-bold"
                    >
                      <ArrowUpRight size={14} /> Descargar
                    </button>
                  </td>
                </tr>
              ))}
              {recentInspections.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm italic">
                    No hay inspecciones registradas aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
