import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Shield, 
  User, 
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InspectionType } from '../types';

export default function Settings() {
  const [types, setTypes] = useState<InspectionType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<InspectionType | null>(null);
  const [newType, setNewType] = useState({ name: '', frequency: 'monthly', responsible: '' });

  useEffect(() => {
    fetch('/api/inspection-types')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTypes(data);
        } else {
          setTypes([
            { id: 1, name: "Inspección de Extintores", frequency: "monthly", responsible: "Coordinador SST" },
            { id: 2, name: "Inspección de Botiquín", frequency: "quarterly", responsible: "Brigadista" },
            { id: 3, name: "Inspección General de Áreas", frequency: "monthly", responsible: "Supervisor" },
            { id: 4, name: "Inspección de Sustancias Químicas", frequency: "semiannual", responsible: "Ingeniero Químico" }
          ]);
        }
      })
      .catch(() => {
        setTypes([
          { id: 1, name: "Inspección de Extintores", frequency: "monthly", responsible: "Coordinador SST" },
          { id: 2, name: "Inspección de Botiquín", frequency: "quarterly", responsible: "Brigadista" },
          { id: 3, name: "Inspección General de Áreas", frequency: "monthly", responsible: "Supervisor" },
          { id: 4, name: "Inspección de Sustancias Químicas", frequency: "semiannual", responsible: "Ingeniero Químico" }
        ]);
      });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/inspection-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newType)
    });
    if (response.ok) {
      const data = await fetch('/api/inspection-types').then(res => res.json());
      setTypes(data);
      setIsModalOpen(false);
      setNewType({ name: '', frequency: 'monthly', responsible: '' });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    const response = await fetch(`/api/inspection-types/${editingType.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingType)
    });
    if (response.ok) {
      setTypes(types.map(t => t.id === editingType.id ? editingType : t));
      setEditingType(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este tipo de inspección? Esto podría afectar programaciones existentes.')) return;
    const response = await fetch(`/api/inspection-types/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setTypes(types.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Configuración de Inspecciones</h2>
          <p className="text-sm text-slate-500 text-balance">Administre los tipos de inspección, sus frecuencias y responsables.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-semibold shadow-lg shadow-indigo-200"
        >
          <Plus size={18} /> Nuevo Tipo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {types.map((type) => (
          <motion.div 
            key={type.id}
            layout
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Shield size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => setEditingType(type)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(type.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-slate-900 mb-4">{type.name}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={16} className="text-slate-400" />
                <span>Frecuencia: <span className="font-semibold text-slate-900">{type.frequency}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User size={16} className="text-slate-400" />
                <span>Responsable: <span className="font-semibold text-slate-900">{type.responsible}</span></span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Nuevo Tipo de Inspección</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de la Inspección</label>
                  <input 
                    required
                    type="text"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newType.name}
                    onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Frecuencia</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-slate-200"
                    value={newType.frequency}
                    onChange={(e) => setNewType({ ...newType, frequency: e.target.value })}
                  >
                    <option value="monthly">Mensual</option>
                    <option value="bimonthly">Bimensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="semiannual">Semestral</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Cargo Responsable</label>
                  <input 
                    required
                    type="text"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newType.responsible}
                    onChange={(e) => setNewType({ ...newType, responsible: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingType && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Editar Tipo de Inspección</h3>
                <button onClick={() => setEditingType(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre</label>
                  <input 
                    required
                    type="text"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editingType.name}
                    onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Frecuencia</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-slate-200"
                    value={editingType.frequency}
                    onChange={(e) => setEditingType({ ...editingType, frequency: e.target.value })}
                  >
                    <option value="monthly">Mensual</option>
                    <option value="bimonthly">Bimensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="semiannual">Semestral</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Responsable</label>
                  <input 
                    required
                    type="text"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editingType.responsible}
                    onChange={(e) => setEditingType({ ...editingType, responsible: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingType(null)}
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
