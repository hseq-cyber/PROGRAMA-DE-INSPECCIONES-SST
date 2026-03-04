import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit2, 
  Trash2, 
  Calendar, 
  User, 
  FileText,
  X,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateInspectionPDF } from '../utils/pdfGenerator';

export default function InspectionHistory() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingInspection, setViewingInspection] = useState<any>(null);
  const [editingInspection, setEditingInspection] = useState<any>(null);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const response = await fetch('/api/inspections');
      const data = await response.json();
      setInspections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteInspection = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta inspección y todos sus hallazgos asociados?')) return;
    try {
      const response = await fetch(`/api/inspections/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setInspections(inspections.filter(i => i.id !== id));
      }
    } catch (error) {
      console.error('Error deleting inspection:', error);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInspection) return;
    try {
      const response = await fetch(`/api/inspections/${editingInspection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspector_name: editingInspection.inspector_name,
          data: editingInspection.data
        })
      });
      if (response.ok) {
        setInspections(inspections.map(i => i.id === editingInspection.id ? editingInspection : i));
        setEditingInspection(null);
      }
    } catch (error) {
      console.error('Error updating inspection:', error);
    }
  };

  const filteredInspections = inspections.filter(i => {
    const matchesFilter = filter === 'All' || i.type_name === filter;
    const matchesSearch = i.inspector_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         i.type_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const inspectionTypes = Array.from(new Set(inspections.map(i => i.type_name)));

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por inspector o tipo..." 
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select 
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">Todos los tipos</option>
              {inspectionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Inspección</th>
                <th className="px-6 py-4">Fecha Ejecución</th>
                <th className="px-6 py-4">Inspector</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">Cargando historial...</td>
                </tr>
              ) : filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">No se encontraron inspecciones.</td>
                </tr>
              ) : filteredInspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                      <span className="font-semibold text-slate-700">{insp.type_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {format(new Date(insp.execution_date), 'dd MMM yyyy HH:mm', { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{insp.inspector_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                      Completada
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => {
                          const data = typeof insp.data === 'string' ? JSON.parse(insp.data) : insp.data;
                          setViewingInspection({ ...insp, data });
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Ver Detalles"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          const data = typeof insp.data === 'string' ? JSON.parse(insp.data) : insp.data;
                          setEditingInspection({ ...insp, data });
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteInspection(insp.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          const data = typeof insp.data === 'string' ? JSON.parse(insp.data) : insp.data;
                          generateInspectionPDF({ ...insp, data });
                        }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Descargar PDF"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {viewingInspection && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{viewingInspection.type_name}</h3>
                    <p className="text-xs text-slate-500">Ejecutada por {viewingInspection.inspector_name} el {format(new Date(viewingInspection.execution_date), 'PPP', { locale: es })}</p>
                  </div>
                </div>
                <button onClick={() => setViewingInspection(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                {/* Render data based on type */}
                {viewingInspection.type_id === 1 ? (
                  <div className="space-y-6">
                    <h4 className="font-bold text-slate-800 border-b pb-2">Detalle de Extintores</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border p-2">N°</th>
                            <th className="border p-2">Agente</th>
                            <th className="border p-2">Capacidad</th>
                            <th className="border p-2">Ubicación</th>
                            <th className="border p-2">Estado General</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingInspection.data.extinguishers?.map((ext: any, idx: number) => (
                            <tr key={idx}>
                              <td className="border p-2 text-center">{ext['N° Extintor'] || idx + 1}</td>
                              <td className="border p-2">{ext['Agente']}</td>
                              <td className="border p-2">{ext['Capacidad']}</td>
                              <td className="border p-2">{ext['Ubicación']}</td>
                              <td className="border p-2 text-center">
                                <span className={`px-2 py-0.5 rounded-full ${ext['Cilindro'] === 'Cumple' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                  {ext['Cilindro'] || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(viewingInspection.data).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-medium text-slate-500">{key}</span>
                        <span className={`text-sm font-bold ${value === 'No cumple' || value === 'Vencido' ? 'text-red-600' : 'text-slate-900'}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setViewingInspection(null)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingInspection && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Editar Inspección</h3>
                <button onClick={() => setEditingInspection(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Inspector</label>
                  <input 
                    required
                    type="text"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editingInspection.inspector_name}
                    onChange={(e) => setEditingInspection({ ...editingInspection, inspector_name: e.target.value })}
                  />
                </div>
                
                <div className="pt-4">
                  <h4 className="font-bold text-slate-800 mb-4">Datos de la Inspección</h4>
                  <div className="space-y-4">
                    {editingInspection.type_id === 1 ? (
                      <p className="text-sm text-slate-500 italic">La edición detallada de tablas de extintores está limitada en esta vista. Por favor, modifique el nombre del inspector o elimine y recree si es necesario.</p>
                    ) : (
                      Object.entries(editingInspection.data).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium text-slate-600 flex-1">{key}</span>
                          <select 
                            className="p-2 rounded-lg border border-slate-200 text-sm outline-none"
                            value={value}
                            onChange={(e) => {
                              const newData = { ...editingInspection.data, [key]: e.target.value };
                              setEditingInspection({ ...editingInspection, data: newData });
                            }}
                          >
                            <option value="Cumple">Cumple</option>
                            <option value="No cumple">No cumple</option>
                            <option value="No aplica">No aplica</option>
                            <option value="Vencido">Vencido</option>
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button 
                    type="button"
                    onClick={() => setEditingInspection(null)}
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
