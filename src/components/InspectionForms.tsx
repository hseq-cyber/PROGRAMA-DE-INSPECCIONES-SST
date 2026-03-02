import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Camera, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Save,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { InspectionType, ScheduleItem } from '../types';
import { format } from 'date-fns';
import { generateInspectionPDF } from '../utils/pdfGenerator';

export default function InspectionForms() {
  const [types, setTypes] = useState<InspectionType[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [inspectorName, setInspectorName] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [findings, setFindings] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/inspection-types').then(res => res.json()).then(setTypes);
    fetch('/api/schedule').then(res => res.json()).then(data => {
      setSchedule(data.filter((s: any) => s.status === 'pending'));
    });
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, findingIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newFindings = [...findings];
        newFindings[findingIndex].photo_evidence = reader.result as string;
        setFindings(newFindings);
      };
      reader.readAsDataURL(file);
    }
  };

  const addFinding = (description: string) => {
    setFindings([...findings, {
      description,
      risk_level: 'Medium',
      action_plan: '',
      responsible: '',
      due_date: format(new Date(), 'yyyy-MM-dd'),
      photo_evidence: null
    }]);
  };

  const generatePDF = () => {
    const typeName = types.find(t => t.id === selectedType)?.name || 'Inspección';
    generateInspectionPDF({
      type_id: selectedType,
      type_name: typeName,
      execution_date: new Date().toISOString(),
      inspector_name: inspectorName,
      data: formData,
      findings: findings
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: selectedSchedule,
          type_id: selectedType,
          inspector_name: inspectorName,
          data: formData,
          findings
        })
      });
      if (response.ok) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderExtinguisherForm = () => {
    const extinguishers = formData.extinguishers || [{}, {}, {}, {}, {}]; // Default 5 as requested
    const checklistItems = [
      'Cilindro', 'Pintura', 'Presinto', 'Pasador', 
      'Manijas', 'Manómetro', 'Presión', 'Manguera', 'Boquilla', 'Corneta', 'Soporte', 
      'Instrucciones', 'Señalización', 'Rotulación', 'Acceso libre'
    ];
    
    const updateExtinguisher = (extIdx: number, item: string, value: any) => {
      const newExts = [...extinguishers];
      newExts[extIdx] = { ...newExts[extIdx], [item]: value };
      setFormData({ ...formData, extinguishers: newExts });

      if (value === 'No cumple' || value === 'Vencido') {
        const desc = `Falla en extintor #${newExts[extIdx]['N° Extintor'] || extIdx + 1}: ${item}`;
        // Check if finding already exists for this item/extinguisher
        const existingIdx = findings.findIndex(f => f.description.includes(desc));
        if (existingIdx === -1) {
          addFinding(desc);
        }
      }
    };

    const updateFindingDetail = (desc: string, field: string, value: any) => {
      const newFindings = [...findings];
      const idx = newFindings.findIndex(f => f.description.includes(desc));
      if (idx !== -1) {
        newFindings[idx] = { ...newFindings[idx], [field]: value };
        setFindings(newFindings);
      }
    };

    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider sticky left-0 bg-slate-800 z-20 border-r border-slate-700 w-48">
                  Ítem de Inspección
                </th>
                {extinguishers.map((_, i) => (
                  <th key={i} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center border-r border-slate-700 min-w-[200px]">
                    Extintor {i + 1}
                    <button 
                      type="button"
                      onClick={() => {
                        const newExts = extinguishers.filter((_, idx) => idx !== i);
                        setFormData({ ...formData, extinguishers: newExts });
                      }}
                      className="ml-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Metadata Rows */}
              {[
                { label: 'ID / N°', key: 'N° Extintor', type: 'text', placeholder: 'Ej. EXT-01' },
                { label: 'Agente', key: 'Agente', type: 'select', options: ['', 'PQS', 'Solkaflan 123', 'CO2', 'Agua'] },
                { label: 'Capacidad', key: 'Capacidad', type: 'text', placeholder: 'Ej. 10 Lbs' },
                { label: 'Ubicación', key: 'Ubicación', type: 'text', placeholder: 'Ej. Pasillo A' }
              ].map((meta) => (
                <tr key={meta.key} className="bg-slate-50/50">
                  <td className="px-4 py-3 text-xs font-bold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    {meta.label}
                  </td>
                  {extinguishers.map((ext, i) => (
                    <td key={i} className="px-4 py-2 border-r border-slate-100">
                      {meta.type === 'select' ? (
                        <select 
                          className="w-full p-2 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          value={ext[meta.key] || ''}
                          onChange={(e) => updateExtinguisher(i, meta.key, e.target.value)}
                        >
                          {meta.options?.map(opt => <option key={opt} value={opt}>{opt || '-'}</option>)}
                        </select>
                      ) : (
                        <input 
                          type="text"
                          className="w-full p-2 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          placeholder={meta.placeholder}
                          value={ext[meta.key] || ''}
                          onChange={(e) => updateExtinguisher(i, meta.key, e.target.value)}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Checklist Items */}
              {checklistItems.map((item) => (
                <tr key={item} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    {item}
                  </td>
                  {extinguishers.map((ext, i) => {
                    const isNegative = ext[item] === 'No cumple' || ext[item] === 'Vencido';
                    const desc = `Falla en extintor #${ext['N° Extintor'] || i + 1}: ${item}`;
                    const finding = findings.find(f => f.description.includes(desc));

                    return (
                      <td key={i} className="px-4 py-2 border-r border-slate-100 align-top">
                        <div className="space-y-2">
                          <select 
                            className={`w-full p-2 text-xs rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500 ${
                              isNegative ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 bg-white'
                            }`}
                            value={ext[item] || ''}
                            onChange={(e) => updateExtinguisher(i, item, e.target.value)}
                          >
                            <option value="">-</option>
                            <option value="Cumple">Cumple</option>
                            <option value="No cumple">No cumple</option>
                            <option value="Vencido">Vencido</option>
                          </select>

                          {isNegative && finding && (
                            <div className="bg-red-50 p-2 rounded-lg border border-red-100 space-y-2 animate-in fade-in slide-in-from-top-1">
                              <textarea 
                                placeholder="Hallazgo..."
                                className="w-full p-1.5 text-[10px] rounded border border-red-200 bg-white outline-none focus:ring-1 focus:ring-red-500"
                                value={finding.action_plan}
                                onChange={(e) => updateFindingDetail(desc, 'action_plan', e.target.value)}
                              />
                              <div className="flex items-center gap-1">
                                <label className="flex-1 flex items-center justify-center gap-1 p-1.5 rounded border border-red-200 bg-white cursor-pointer hover:bg-red-100 transition-colors text-[9px] font-bold text-red-700">
                                  <Camera size={10} />
                                  {finding.photo_evidence ? 'OK' : 'Foto'}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => updateFindingDetail(desc, 'photo_evidence', reader.result as string);
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                                {finding.photo_evidence && (
                                  <img src={finding.photo_evidence} className="w-6 h-6 rounded object-cover border border-red-200" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center">
          <button 
            type="button"
            onClick={() => setFormData({ ...formData, extinguishers: [...extinguishers, {}] })}
            className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 text-indigo-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus size={16} /> Agregar Columna de Extintor
          </button>
        </div>
      </div>
    );
  };

  const renderKitForm = () => {
    const items = [
      'Algodón', 'Gasas', 'Micropore', 'Aplicadores', 'Bajalenguas', 'Vendas elásticas', 
      'Venda triangular', 'Curitas', 'Tapabocas', 'Jeringas', 'Guantes', 'Tijeras', 
      'Linterna', 'Bolsa roja', 'Solución salina'
    ];
    
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Elemento del Botiquín</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado / Cantidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">{item}</td>
                <td className="px-6 py-4">
                  <select 
                    className="w-full max-w-xs p-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData[item] || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, [item]: e.target.value });
                      if (e.target.value === 'No cumple' || e.target.value === 'Vencido') {
                        addFinding(`Falla en botiquín: ${item}`);
                      }
                    }}
                  >
                    <option value="">Seleccione...</option>
                    <option value="Cumple">Cumple</option>
                    <option value="No cumple">No cumple</option>
                    <option value="No aplica">No aplica</option>
                    <option value="Vencido">Vencido</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderGeneralForm = () => {
    const sections = [
      { title: '1. Locativo', items: ['Pisos en buen estado', 'Paredes sin grietas', 'Techos sin goteras', 'Escaleras con antideslizante'] },
      { title: '2. Riesgo Eléctrico', items: ['Cables sin peladuras', 'Tomas debidamente tapadas', 'Tableros señalizados', 'Sin sobrecarga de multitomas'] },
      { title: '3. Orden y Aseo', items: ['Áreas libres de obstáculos', 'Residuos clasificados', 'Herramientas en su lugar', 'Escritorios limpios'] }
    ];

    return (
      <div className="space-y-8">
        {sections.map(section => (
          <div key={section.title} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100">
              <h4 className="font-bold text-indigo-700 text-sm">{section.title}</h4>
            </div>
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-100">
                {section.items.map(item => (
                  <tr key={item} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{item}</td>
                    <td className="px-6 py-4 w-64">
                      <select 
                        className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData[item] || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, [item]: e.target.value });
                          if (e.target.value === 'No cumple') addFinding(`Falla en ${section.title}: ${item}`);
                        }}
                      >
                        <option value="">-</option>
                        <option value="Cumple">Cumple</option>
                        <option value="No cumple">No cumple</option>
                        <option value="No aplica">No aplica</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  const renderChemicalsForm = () => {
    const items = [
      'Hojas de datos de seguridad (HDS) disponibles',
      'Envases debidamente etiquetados (SGA)',
      'Almacenamiento por compatibilidad',
      'Diques de contención en buen estado',
      'Kit de derrames completo y accesible',
      'EPP específico disponible',
      'Duchas y lavaojos funcionales',
      'Personal capacitado en manejo',
      'Ventilación adecuada en el área',
      'Sin envases deteriorados o con fugas'
    ];

    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100">
          <h4 className="font-bold text-indigo-700 text-sm">Inspección de Sustancias Químicas (Puntos Críticos)</h4>
        </div>
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">{item}</td>
                <td className="px-6 py-4 w-64">
                  <select 
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData[item] || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, [item]: e.target.value });
                      if (e.target.value === 'No cumple') addFinding(`Falla en Sustancias Químicas: ${item}`);
                    }}
                  >
                    <option value="">-</option>
                    <option value="Cumple">Cumple</option>
                    <option value="No cumple">No cumple</option>
                    <option value="No aplica">No aplica</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-100"
        >
          <Check size={48} />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">¡Inspección Guardada!</h2>
          <p className="text-slate-500 text-lg">Los resultados han sido registrados correctamente en el sistema.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={generatePDF}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Save size={20} /> Descargar PDF de Resultado
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
          >
            Realizar Otra Inspección
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Nueva Inspección</h2>
            <p className="text-slate-500">Complete el formulario para registrar los resultados</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Inspección</label>
              <select 
                required
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={selectedType || ''}
                onChange={(e) => {
                  setSelectedType(Number(e.target.value));
                  setFormData({});
                  setFindings([]);
                }}
              >
                <option value="">Seleccione tipo...</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Programación</label>
              <select 
                required
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={selectedSchedule || ''}
                onChange={(e) => setSelectedSchedule(Number(e.target.value))}
              >
                <option value="">Seleccione fecha...</option>
                {schedule.filter(s => s.type_id === selectedType).map(s => (
                  <option key={s.id} value={s.id}>{s.scheduled_date}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Inspector</label>
              <input 
                required
                type="text" 
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Ej. Juan Pérez"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            {selectedType === 1 && renderExtinguisherForm()}
            {selectedType === 2 && renderKitForm()}
            {selectedType === 3 && renderGeneralForm()}
            {selectedType === 4 && renderChemicalsForm()}
          </div>

          {/* Findings Section */}
          {findings.length > 0 && (
            <div className="pt-8 border-t border-slate-100 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={20} />
                Hallazgos Detectados ({findings.length})
              </h3>
              <div className="space-y-4">
                {findings.map((finding, idx) => (
                  <div key={idx} className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-4">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-amber-900">{finding.description}</p>
                      <button 
                        type="button"
                        onClick={() => setFindings(findings.filter((_, i) => i !== idx))}
                        className="text-amber-400 hover:text-amber-600"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">Plan de Acción</label>
                        <input 
                          type="text" 
                          className="w-full p-2 rounded-lg border border-amber-200 bg-white"
                          value={finding.action_plan}
                          onChange={(e) => {
                            const newFindings = [...findings];
                            newFindings[idx].action_plan = e.target.value;
                            setFindings(newFindings);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">Responsable</label>
                        <input 
                          type="text" 
                          className="w-full p-2 rounded-lg border border-amber-200 bg-white"
                          value={finding.responsible}
                          onChange={(e) => {
                            const newFindings = [...findings];
                            newFindings[idx].responsible = e.target.value;
                            setFindings(newFindings);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">Evidencia Fotográfica</label>
                        <div className="flex items-center gap-2">
                          <label className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border border-amber-200 bg-white cursor-pointer hover:bg-amber-100 transition-colors text-xs font-bold text-amber-700">
                            <Camera size={14} />
                            {finding.photo_evidence ? 'Foto Cargada' : 'Subir Foto'}
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, idx)}
                            />
                          </label>
                          {finding.photo_evidence && (
                            <img src={finding.photo_evidence} className="w-10 h-10 rounded object-cover border border-amber-200" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-8">
            <button 
              type="button"
              className="px-8 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              disabled={isSubmitting || !selectedType}
              type="submit"
              className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={20} />
              {isSubmitting ? 'Guardando...' : 'Finalizar Inspección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
