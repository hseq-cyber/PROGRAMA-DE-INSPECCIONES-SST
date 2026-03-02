import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Download,
  Camera,
  ExternalLink,
  MoreVertical,
  ArrowUpRight,
  Edit2,
  Trash2,
  X,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Finding } from '../types';

export default function FindingsTracking() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [filter, setFilter] = useState('All');
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);

  useEffect(() => {
    fetch('/api/findings').then(res => res.json()).then(setFindings);
  }, []);

  const updateStatus = async (id: number, newStatus: string) => {
    const response = await fetch(`/api/findings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (response.ok) {
      setFindings(findings.map(f => f.id === id ? { ...f, status: newStatus as any } : f));
    }
  };

  const deleteFinding = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este hallazgo?')) return;
    const response = await fetch(`/api/findings/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setFindings(findings.filter(f => f.id !== id));
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFinding) return;
    const response = await fetch(`/api/findings/${editingFinding.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingFinding)
    });
    if (response.ok) {
      setFindings(findings.map(f => f.id === editingFinding.id ? editingFinding : f));
      setEditingFinding(null);
    }
  };

  const filteredFindings = findings.filter(f => filter === 'All' || f.status === filter);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Closed': return 'bg-emerald-100 text-emerald-700';
      case 'In Process': return 'bg-blue-100 text-blue-700';
      case 'Open': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Hallazgos', value: findings.length, icon: AlertCircle, color: 'text-slate-600' },
          { label: 'Abiertos', value: findings.filter(f => f.status === 'Open').length, icon: Clock, color: 'text-red-600' },
          { label: 'En Proceso', value: findings.filter(f => f.status === 'In Process').length, icon: ExternalLink, color: 'text-blue-600' },
          { label: 'Cerrados', value: findings.filter(f => f.status === 'Closed').length, icon: CheckCircle2, color: 'text-emerald-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <stat.icon size={18} className={stat.color} />
              <span className="text-sm font-medium text-slate-500">{stat.label}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar hallazgo..." 
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select 
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">Todos los estados</option>
              <option value="Open">Abiertos</option>
              <option value="In Process">En Proceso</option>
              <option value="Closed">Cerrados</option>
            </select>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all text-sm font-semibold">
          <Download size={18} /> Exportar Reporte
        </button>
      </div>

      {/* Findings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Hallazgo / Inspección</th>
                <th className="px-6 py-4">Riesgo</th>
                <th className="px-6 py-4">Plan de Acción</th>
                <th className="px-6 py-4">Responsable</th>
                <th className="px-6 py-4">Vencimiento</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFindings.map((finding) => (
                <tr key={finding.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 line-clamp-1">{finding.description}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <ArrowUpRight size={12} /> {finding.inspection_type}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getRiskColor(finding.risk_level)}`}>
                      {finding.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 line-clamp-2 max-w-xs">{finding.action_plan}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{finding.responsible}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {finding.due_date ? format(new Date(finding.due_date), 'dd MMM yyyy', { locale: es }) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer ${getStatusColor(finding.status)}`}
                      value={finding.status}
                      onChange={(e) => updateStatus(finding.id, e.target.value)}
                    >
                      <option value="Open">Abierto</option>
                      <option value="In Process">En Proceso</option>
                      <option value="Closed">Cerrado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {finding.photo_evidence && (
                        <button 
                          onClick={() => window.open(finding.photo_evidence, '_blank')}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Camera size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => setEditingFinding(finding)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteFinding(finding.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingFinding && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Editar Hallazgo</h3>
                <button onClick={() => setEditingFinding(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                    <textarea 
                      required
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={editingFinding.description}
                      onChange={(e) => setEditingFinding({ ...editingFinding, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nivel de Riesgo</label>
                    <select 
                      className="w-full p-3 rounded-xl border border-slate-200"
                      value={editingFinding.risk_level}
                      onChange={(e) => setEditingFinding({ ...editingFinding, risk_level: e.target.value as any })}
                    >
                      <option value="Low">Bajo</option>
                      <option value="Medium">Medio</option>
                      <option value="High">Alto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
                    <select 
                      className="w-full p-3 rounded-xl border border-slate-200"
                      value={editingFinding.status}
                      onChange={(e) => setEditingFinding({ ...editingFinding, status: e.target.value as any })}
                    >
                      <option value="Open">Abierto</option>
                      <option value="In Process">En Proceso</option>
                      <option value="Closed">Cerrado</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Plan de Acción</label>
                    <textarea 
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={editingFinding.action_plan}
                      onChange={(e) => setEditingFinding({ ...editingFinding, action_plan: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Responsable</label>
                    <input 
                      type="text"
                      className="w-full p-3 rounded-xl border border-slate-200"
                      value={editingFinding.responsible}
                      onChange={(e) => setEditingFinding({ ...editingFinding, responsible: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Compromiso</label>
                    <input 
                      type="date"
                      className="w-full p-3 rounded-xl border border-slate-200"
                      value={editingFinding.due_date}
                      onChange={(e) => setEditingFinding({ ...editingFinding, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingFinding(null)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
