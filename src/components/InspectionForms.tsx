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
    fetch('/api/inspection-types')
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch'))
      .then(data => {
        setTypes(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setTypes([
          { id: 1, name: "Inspección de Extintores", frequency: "monthly", responsible: "Coordinador SST" },
          { id: 2, name: "Inspección de Botiquín", frequency: "quarterly", responsible: "Brigadista" },
          { id: 3, name: "Inspección General de Áreas", frequency: "monthly", responsible: "Supervisor" },
          { id: 4, name: "Inspección de Sustancias Químicas", frequency: "semiannual", responsible: "Ingeniero Químico" }
        ]);
      });

    fetch('/api/schedule')
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch'))
      .then(data => {
        setSchedule(Array.isArray(data) ? data.filter((s: any) => s.status === 'pending') : []);
      })
      .catch(() => {
        setSchedule([
          { id: 1, type_id: 1, type_name: "Inspección de Extintores", scheduled_date: format(new Date(), 'yyyy-MM-dd'), status: 'pending', responsible: 'Coordinador SST' },
          { id: 2, type_id: 2, type_name: "Inspección de Botiquín", scheduled_date: format(new Date(), 'yyyy-MM-dd'), status: 'pending', responsible: 'Brigadista' },
          { id: 3, type_id: 3, type_name: "Inspección General de Áreas", scheduled_date: format(new Date(), 'yyyy-MM-dd'), status: 'pending', responsible: 'Supervisor' },
          { id: 4, type_id: 4, type_name: "Inspección de Sustancias Químicas", scheduled_date: format(new Date(), 'yyyy-MM-dd'), status: 'pending', responsible: 'Ingeniero Químico' }
        ]);
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
      } else {
        alert('Error al guardar la inspección. Por favor verifique los datos e intente de nuevo.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderExtinguisherForm = () => {
    const extinguishers = formData.extinguishers || Array(8).fill({}).map(() => ({}));
    const checklistItems = [
      'Cilindro', 'Pintura', 'Presinto', 'Pasador', 
      'Manijas', 'Manómetro', 'Presión', 'Manguera', 'Boquilla', 'Corneta', 'Soporte', 
      'Instrucciones', 'Señalización', 'Rotulación', 'Acceso libre'
    ];
    
    const metaColumns = [
      { label: 'ID/N°', key: 'N° Extintor', type: 'text', width: 'w-20' },
      { label: 'Agente', key: 'Agente', type: 'select', options: ['', 'PQS', 'Solkaflan', 'CO2', 'Agua'], width: 'w-28' },
      { label: 'Capac.', key: 'Capacidad', type: 'text', width: 'w-20' },
      { label: 'Ubicación', key: 'Ubicación', type: 'text', width: 'w-40' },
      { label: 'F. Recarga', key: 'Fecha Recarga', type: 'date', width: 'w-32' },
      { label: 'P. Recarga', key: 'Proxima Recarga', type: 'date', width: 'w-32' },
    ];
    
    const updateExtinguisher = (extIdx: number, item: string, value: any) => {
      const newExts = [...extinguishers];
      newExts[extIdx] = { ...newExts[extIdx], [item]: value };
      setFormData({ ...formData, extinguishers: newExts });

      if (value === 'No cumple' || value === 'Vencido') {
        const desc = `Falla en extintor #${newExts[extIdx]['N° Extintor'] || extIdx + 1}: ${item}`;
        const existingIdx = findings.findIndex(f => f.description.includes(desc));
        if (existingIdx === -1) {
          addFinding(desc);
        }
      } else {
        const desc = `Falla en extintor #${newExts[extIdx]['N° Extintor'] || extIdx + 1}: ${item}`;
        setFindings(findings.filter(f => !f.description.includes(desc)));
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
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden font-sans">
        {/* Minimalist Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
              <ClipboardCheck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">Inspección de Extintores</h3>
              <p className="text-[10px] text-slate-400 font-medium">Metalprest SAS • Formato Técnico</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setFormData({ ...formData, extinguishers: [...extinguishers, {}] })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-[10px] hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-wider"
          >
            <Plus size={14} /> Agregar Fila
          </button>
        </div>
        
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-collapse table-fixed min-w-[1400px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="w-10 px-2 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50 z-30 border-r border-slate-100 text-center">
                  #
                </th>
                {metaColumns.map((col, i) => (
                  <th key={i} className={`${col.width} px-3 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-100`}>
                    {col.label}
                  </th>
                ))}
                {checklistItems.map((item, i) => (
                  <th key={i} className="w-11 px-0 py-0 border-r border-slate-100 bg-white relative h-32">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-bold uppercase tracking-tighter text-slate-400 h-full flex items-center justify-center">
                        {item}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="w-12 px-2 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  -
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {extinguishers.map((ext, extIdx) => (
                <tr key={extIdx} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-2 py-3 text-[10px] font-medium text-slate-300 text-center sticky left-0 bg-white z-20 border-r border-slate-100 group-hover:bg-slate-50/50">
                    {extIdx + 1}
                  </td>
                  
                  {/* Meta Data Cells */}
                  {metaColumns.map((col) => (
                    <td key={col.key} className="px-2 py-2 border-r border-slate-100 bg-white group-hover:bg-slate-50/20">
                      {col.type === 'select' ? (
                        <select 
                          className="w-full p-1.5 text-[10px] font-medium rounded border border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none bg-transparent transition-all"
                          value={ext[col.key] || ''}
                          onChange={(e) => updateExtinguisher(extIdx, col.key, e.target.value)}
                        >
                          {col.options?.map(opt => <option key={opt} value={opt}>{opt || '-'}</option>)}
                        </select>
                      ) : col.type === 'date' ? (
                        <input 
                          type="date"
                          className="w-full p-1.5 text-[10px] font-medium rounded border border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none bg-transparent transition-all"
                          value={ext[col.key] || ''}
                          onChange={(e) => updateExtinguisher(extIdx, col.key, e.target.value)}
                        />
                      ) : (
                        <input 
                          type="text"
                          className="w-full p-1.5 text-[10px] font-medium rounded border border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none bg-transparent placeholder:text-slate-200 transition-all"
                          placeholder="..."
                          value={ext[col.key] || ''}
                          onChange={(e) => updateExtinguisher(extIdx, col.key, e.target.value)}
                        />
                      )}
                    </td>
                  ))}

                  {/* Checklist Cells */}
                  {checklistItems.map((item) => {
                    const value = ext[item] || '';
                    const isNegative = value === 'No cumple' || value === 'Vencido';
                    const desc = `Falla en extintor #${ext['N° Extintor'] || extIdx + 1}: ${item}`;
                    const finding = findings.find(f => f.description.includes(desc));

                    return (
                      <td key={item} className={`px-0.5 py-2 border-r border-slate-100 text-center align-middle relative ${isNegative ? 'bg-red-50/30' : ''}`}>
                        <div className="flex flex-col items-center">
                          <select 
                            className={`w-9 h-7 p-0 text-[9px] font-bold rounded border text-center appearance-none cursor-pointer outline-none transition-all ${
                              value === 'Cumple' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' :
                              isNegative ? 'border-red-200 bg-red-100 text-red-600' :
                              'border-transparent bg-transparent text-slate-300 hover:text-slate-500'
                            }`}
                            value={value}
                            onChange={(e) => updateExtinguisher(extIdx, item, e.target.value)}
                          >
                            <option value="">-</option>
                            <option value="Cumple">C</option>
                            <option value="No cumple">NC</option>
                            <option value="Vencido">V</option>
                          </select>

                          {isNegative && finding && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-56 bg-white p-3 rounded-lg shadow-xl border border-slate-200 z-[100] animate-in fade-in zoom-in duration-150">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hallazgo</span>
                                <AlertCircle size={12} className="text-red-400" />
                              </div>
                              <textarea 
                                placeholder="Describa el hallazgo..."
                                className="w-full p-2 text-[10px] font-medium rounded border border-slate-100 bg-slate-50 outline-none focus:border-indigo-500 h-16 resize-none"
                                value={finding.action_plan}
                                onChange={(e) => updateFindingDetail(desc, 'action_plan', e.target.value)}
                              />
                              <div className="mt-2 flex items-center gap-2">
                                <label className="flex-1 flex items-center justify-center gap-1.5 p-1.5 rounded border border-slate-100 bg-white cursor-pointer hover:bg-slate-50 transition-all text-[9px] font-bold text-slate-500">
                                  <Camera size={12} />
                                  {finding.photo_evidence ? 'Foto OK' : 'Adjuntar'}
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
                                  <div className="relative group">
                                    <img src={finding.photo_evidence} className="w-8 h-8 rounded border border-slate-100 object-cover" />
                                    <button 
                                      onClick={() => updateFindingDetail(desc, 'photo_evidence', null)}
                                      className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white rounded-full p-0.5 shadow-sm"
                                    >
                                      <X size={8} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  <td className="px-2 py-3 text-center bg-white group-hover:bg-slate-50/20">
                    <button 
                      type="button"
                      onClick={() => {
                        const newExts = extinguishers.filter((_, idx) => idx !== extIdx);
                        setFormData({ ...formData, extinguishers: newExts });
                      }}
                      className="p-1 text-slate-200 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Minimalist Footer */}
        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex gap-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
            <span>C: Cumple</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-red-400 rounded-full"></span>
            <span>NC: No Cumple</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
            <span>V: Vencido</span>
          </div>
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
