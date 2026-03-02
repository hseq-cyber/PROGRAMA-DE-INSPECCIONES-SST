import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Download, 
  Calendar as CalendarIcon, 
  Filter, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  FileText,
  Table as TableIcon,
  X,
  Edit2,
  Trash2,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScheduleItem, InspectionType } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function InspectionProgram() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [types, setTypes] = useState<InspectionType[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ type_id: '', scheduled_date: format(new Date(), 'yyyy-MM-dd'), frequency: 'once' });

  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    fetch('/api/schedule').then(res => res.json()).then(setSchedule);
    fetch('/api/inspection-types').then(res => res.json()).then(setTypes);
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSchedule)
    });
    if (response.ok) {
      const data = await fetch('/api/schedule').then(res => res.json());
      setSchedule(data);
      setIsModalOpen(false);
      setNewSchedule({ type_id: '', scheduled_date: format(new Date(), 'yyyy-MM-dd'), frequency: 'once' });
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta programación?')) return;
    const response = await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setSchedule(schedule.filter(s => s.id !== id));
    }
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    const response = await fetch(`/api/schedule/${editingSchedule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingSchedule)
    });
    if (response.ok) {
      setSchedule(schedule.map(s => s.id === editingSchedule.id ? editingSchedule : s));
      setEditingSchedule(null);
    }
  };

  const getStatusInfo = (item: ScheduleItem) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(item.scheduled_date);
    scheduledDate.setHours(0, 0, 0, 0);
    
    if (item.status === 'executed') return { label: 'Ejecutada', class: 'bg-emerald-100 text-emerald-700' };
    if (scheduledDate < today) return { label: 'Retrasado', class: 'bg-red-100 text-red-700' };
    return { label: 'Pendiente', class: 'bg-amber-100 text-amber-700' };
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(schedule);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cronograma");
    XLSX.writeFile(wb, "Cronograma_Inspecciones.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Programa de Inspecciones SST", 14, 15);
    (doc as any).autoTable({
      startY: 20,
      head: [['Tipo', 'Fecha Programada', 'Responsable', 'Estado']],
      body: schedule.map(s => [s.type_name, s.scheduled_date, s.responsible, s.status]),
    });
    doc.save("Programa_Inspecciones.pdf");
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setCurrentDate(addMonths(currentDate, -1))}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 font-bold text-slate-700 min-w-[150px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </span>
          <button 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all text-sm font-semibold"
          >
            <TableIcon size={18} /> Excel
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all text-sm font-semibold"
          >
            <FileText size={18} /> PDF
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-semibold shadow-lg shadow-indigo-200"
          >
            <Plus size={18} /> Nueva Inspección
          </button>
        </div>
      </div>

      {/* Edit Schedule Modal */}
      <AnimatePresence>
        {editingSchedule && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Editar Programación</h3>
                <button onClick={() => setEditingSchedule(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleUpdateSchedule} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tipo</label>
                  <input 
                    disabled
                    type="text"
                    className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-500"
                    value={editingSchedule.type_name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Programada</label>
                  <input 
                    required
                    type="date"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={editingSchedule.scheduled_date}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, scheduled_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-slate-200"
                    value={editingSchedule.status}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, status: e.target.value as any })}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="executed">Ejecutada</option>
                    <option value="overdue">Vencida</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingSchedule(null)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for New Schedule */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Planificar Inspección</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Inspección</label>
                <select 
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={newSchedule.type_id}
                  onChange={(e) => setNewSchedule({ ...newSchedule, type_id: e.target.value })}
                >
                  <option value="">Seleccione...</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Inicial</label>
                <input 
                  required
                  type="date"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={newSchedule.scheduled_date}
                  onChange={(e) => setNewSchedule({ ...newSchedule, scheduled_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Frecuencia de Repetición</label>
                <select 
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={newSchedule.frequency}
                  onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value })}
                >
                  <option value="once">Una sola vez</option>
                  <option value="monthly">Mensual</option>
                  <option value="bimonthly">Bimensual</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="semiannual">Semestral</option>
                  <option value="annual">Anual</option>
                </select>
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

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {/* Empty cells for padding */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="h-32 border-r border-b border-slate-50 bg-slate-50/30" />
          ))}
          
          {days.map(day => {
            const dayInspections = schedule.filter(s => isSameDay(new Date(s.scheduled_date), day));
            return (
              <div key={day.toString()} className="h-32 border-r border-b border-slate-100 p-2 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday(day) ? 'bg-indigo-600 text-white' : 'text-slate-500'
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1 overflow-y-auto max-h-20 scrollbar-hide">
                  {dayInspections.map((insp, i) => {
                    const status = getStatusInfo(insp);
                    return (
                      <div 
                        key={i} 
                        className={`text-[10px] p-1.5 rounded-lg border truncate font-medium ${status.class}`}
                      >
                        {insp.type_name}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
</div>
</div>

{/* List View */}
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
<div className="p-6 border-b border-slate-100 flex items-center justify-between">
  <h3 className="font-bold text-slate-900">Próximas Inspecciones</h3>
  <button className="text-indigo-600 text-sm font-semibold hover:underline">Ver todo</button>
</div>
<div className="overflow-x-auto">
  <table className="w-full text-left">
    <thead>
      <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
        <th className="px-6 py-4">Tipo de Inspección</th>
        <th className="px-6 py-4">Fecha Programada</th>
        <th className="px-6 py-4">Responsable</th>
        <th className="px-6 py-4">Estado</th>
        <th className="px-6 py-4">Acciones</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {schedule.slice(0, 5).map((item) => {
        const status = getStatusInfo(item);
        return (
          <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CalendarIcon size={16} />
                </div>
                <span className="font-semibold text-slate-700">{item.type_name}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-slate-600">
              {format(new Date(item.scheduled_date), 'dd MMM yyyy', { locale: es })}
            </td>
            <td className="px-6 py-4 text-sm text-slate-600">{item.responsible}</td>
            <td className="px-6 py-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.class}`}>
                {status.label}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => setEditingSchedule(item)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteSchedule(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>
</div>
    </div>
  );
}
