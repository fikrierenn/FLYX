/**
 * FLYX Studio - Form Customizer (1C Benzeri Ekran Duzenleme)
 * =============================================================
 * 1C'deki "Formu Duzenle" ozelliginin karsiligi.
 * Kullanici acik ekrandaki alanlari surukleme ile siralayabilir,
 * gizleyebilir, section ekleyebilir, layout degistirebilir.
 * Degisiklikler kullanici bazli saklanir (localStorage).
 *
 * Acilma: FormEngine'deki "Ekrani Duzenle" butonu ile
 * Kapanma: "Kaydet" veya "Iptal" ile → FormEngine guncellenir
 */

import React, { useState } from 'react';
import type { FieldSchema, SectionSchema } from '../engine/FormEngine';
import { Eye, EyeOff, GripVertical, Plus, Trash2, Columns, X, Save } from 'lucide-react';

export interface FormCustomization {
  /** Alan siralama ve gorunurluk */
  fieldOrder: { name: string; visible: boolean }[];
  /** Section tanimlari */
  sections: { name: string; label: string; fields: string[]; columns: number }[];
}

interface FormCustomizerProps {
  entityName: string;
  fields: FieldSchema[];
  sections: SectionSchema[];
  onSave: (customization: FormCustomization) => void;
  onCancel: () => void;
}

export function FormCustomizer({ entityName, fields, sections, onSave, onCancel }: FormCustomizerProps) {
  // Mevcut field sirasini ve gorunurlugunu state'e al
  const [fieldOrder, setFieldOrder] = useState<{ name: string; visible: boolean }[]>(
    fields.map((f) => ({ name: f.name, visible: !f.hidden })),
  );

  const [editSections, setEditSections] = useState<{ name: string; label: string; fields: string[]; columns: number }[]>(
    sections.map((s) => ({ name: s.name, label: s.label, fields: [...s.fields], columns: s.columns || 2 })),
  );

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Field gorunurluk toggle
  const toggleField = (name: string) => {
    setFieldOrder((prev) => prev.map((f) => f.name === name ? { ...f, visible: !f.visible } : f));
  };

  // Drag & drop siralama
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...fieldOrder];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setFieldOrder(updated);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  // Section sutun degistir
  const changeSectionColumns = (idx: number, cols: number) => {
    const updated = [...editSections];
    updated[idx].columns = cols;
    setEditSections(updated);
  };

  // Section label degistir
  const changeSectionLabel = (idx: number, label: string) => {
    const updated = [...editSections];
    updated[idx].label = label;
    setEditSections(updated);
  };

  // Section ekle
  const addSection = () => {
    setEditSections([...editSections, {
      name: `section_${Date.now()}`,
      label: 'Yeni Bolum',
      fields: [],
      columns: 2,
    }]);
  };

  // Section sil
  const removeSection = (idx: number) => {
    if (editSections.length <= 1) return;
    setEditSections(editSections.filter((_, i) => i !== idx));
  };

  // Kaydet
  const handleSave = () => {
    const customization: FormCustomization = {
      fieldOrder,
      sections: editSections,
    };
    // localStorage'a kaydet (kullanici bazli)
    localStorage.setItem(`flyx_form_${entityName}`, JSON.stringify(customization));
    onSave(customization);
  };

  const getFieldLabel = (name: string) => fields.find((f) => f.name === name)?.label || name;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
        {/* Baslik */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700">
          <div>
            <h2 className="text-lg font-bold text-white">Ekrani Duzenle</h2>
            <p className="text-blue-200 text-xs mt-0.5">Alanlari surukleyerek siralayabilir, gizleyebilirsiniz</p>
          </div>
          <button onClick={onCancel} className="text-blue-200 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex divide-x divide-gray-100 max-h-[60vh] overflow-hidden">
          {/* Sol: Alan Listesi */}
          <div className="w-1/2 p-4 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Alanlar</h3>
            <div className="space-y-1">
              {fieldOrder.map((fo, idx) => (
                <div
                  key={fo.name}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                    dragIdx === idx ? 'border-blue-400 bg-blue-50 shadow-sm' :
                    fo.visible ? 'border-gray-200 bg-white hover:border-gray-300' :
                    'border-gray-100 bg-gray-50 opacity-50'
                  }`}
                >
                  <GripVertical className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className={`flex-1 text-sm ${fo.visible ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                    {getFieldLabel(fo.name)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{fo.name}</span>
                  <button onClick={() => toggleField(fo.name)}
                    className={`p-1 rounded ${fo.visible ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                    {fo.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sag: Section Ayarlari */}
          <div className="w-1/2 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bolumler</h3>
              <button onClick={addSection}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">
                <Plus className="w-3 h-3" /> Bolum Ekle
              </button>
            </div>

            <div className="space-y-3">
              {editSections.map((section, idx) => (
                <div key={section.name} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input value={section.label} onChange={(e) => changeSectionLabel(idx, e.target.value)}
                      className="flex-1 text-sm font-medium border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none py-0.5" />
                    {editSections.length > 1 && (
                      <button onClick={() => removeSection(idx)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sutun secimi */}
                  <div className="flex items-center gap-1">
                    <Columns className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] text-gray-400 mr-1">Sutun:</span>
                    {[1, 2, 3].map((n) => (
                      <button key={n} onClick={() => changeSectionColumns(idx, n)}
                        className={`px-2 py-0.5 text-xs rounded ${
                          section.columns === n ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/50">
          <button onClick={onCancel}
            className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50">
            Iptal
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm">
            <Save className="w-4 h-4" /> Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

/** localStorage'dan customization yukle */
export function loadCustomization(entityName: string): FormCustomization | null {
  try {
    const raw = localStorage.getItem(`flyx_form_${entityName}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Customization'i FormSchema'ya uygula */
export function applyCustomization(
  fields: FieldSchema[],
  sections: SectionSchema[],
  customization: FormCustomization,
): { fields: FieldSchema[]; sections: SectionSchema[] } {
  // Alan sirasini ve gorunurlugu uygula
  const orderedFields = customization.fieldOrder
    .filter((fo) => fo.visible)
    .map((fo) => fields.find((f) => f.name === fo.name))
    .filter(Boolean) as FieldSchema[];

  // Section'lari uygula
  const customSections = customization.sections.map((cs) => ({
    name: cs.name,
    label: cs.label,
    fields: cs.fields,
    columns: cs.columns,
  }));

  return {
    fields: orderedFields,
    sections: customSections.length > 0 ? customSections : sections,
  };
}
