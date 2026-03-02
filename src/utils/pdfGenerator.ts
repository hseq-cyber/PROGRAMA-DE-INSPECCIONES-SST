import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generateInspectionPDF = (inspection: any) => {
  const doc = new jsPDF();
  const typeName = inspection.type_name || 'Inspección';
  const dateStr = format(new Date(inspection.execution_date), 'dd/MM/yyyy HH:mm');
  const inspectorName = inspection.inspector_name || 'N/A';
  const formData = typeof inspection.data === 'string' ? JSON.parse(inspection.data) : inspection.data;
  const findings = inspection.findings || [];

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('METALPREST SAS', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Resultado de Inspección SST', 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Tipo: ${typeName}`, 20, 45);
  doc.text(`Fecha: ${dateStr}`, 20, 52);
  doc.text(`Inspector: ${inspectorName}`, 20, 59);

  // Form Data
  if (inspection.type_id === 1 || typeName.toLowerCase().includes('extintor')) { // Extintores
    const extinguishers = formData.extinguishers || [];
    const checklistItems = [
      'N° Extintor', 'Agente', 'Capacidad', 'Cilindro', 'Pintura', 'Presinto', 'Pasador', 
      'Manijas', 'Manómetro', 'Presión', 'Manguera', 'Boquilla', 'Corneta', 'Soporte', 
      'Instrucciones', 'Señalización', 'Rotulación', 'Ubicación', 'Acceso libre'
    ];

    const tableData = checklistItems.map(item => {
      const row = [item];
      extinguishers.forEach((ext: any) => {
        row.push(ext[item] || '-');
      });
      return row;
    });

    const head = [['Ítem', ...extinguishers.map((_: any, i: number) => `Extintor ${i + 1}`)]];

    autoTable(doc, {
      startY: 70,
      head: head,
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8 }
    });
  } else {
    // Generic table for other forms
    const tableData = Object.entries(formData).map(([key, value]) => [key, String(value)]);
    autoTable(doc, {
      startY: 70,
      head: [['Campo', 'Valor']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
  }

  // Findings
  if (findings.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Hallazgos Identificados', 20, finalY);
    
    const findingsData = findings.map((f: any) => [
      f.description,
      f.risk_level,
      f.action_plan || 'N/A',
      f.responsible || 'N/A'
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Descripción', 'Riesgo', 'Plan de Acción', 'Responsable']],
      body: findingsData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] }
    });
  }

  doc.save(`Inspeccion_${typeName.replace(/\s+/g, '_')}_${format(new Date(inspection.execution_date), 'yyyyMMdd')}.pdf`);
};
