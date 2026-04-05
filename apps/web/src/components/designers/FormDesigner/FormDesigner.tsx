/**
 * Form Designer - Sürükle-Bırak Form Oluşturucu
 * ===============================================
 * 1C benzeri visual form tasarlayıcı. Kullanıcı:
 * 1. Sol panelden (FieldToolbox) alan tiplerini seçer
 * 2. Ortadaki Canvas'a ekler, sürükleyerek sıralar (dnd-kit)
 * 3. Sağ panelden (PropertyPanel) alan özelliklerini düzenler
 * 4. Altta (FSL Preview) otomatik üretilen FSL kodunu görür
 *
 * Section desteği: "+" butonu ile birden fazla form bölümü oluşturulabilir.
 * Her section bağımsız alan listesine sahiptir.
 *
 * Üretilen FSL kodu gerçek zamanlı güncellenir ve panoya kopyalanabilir.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FieldToolbox } from './FieldToolbox';
import { Canvas } from './Canvas';
import { PropertyPanel } from './PropertyPanel';

export interface DesignerField {
  id: string;
  type: string;
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
}

export interface FormSection {
  id: string;
  name: string;
  label: string;
  fields: DesignerField[];
}

export function FormDesigner() {
  const [sections, setSections] = useState<FormSection[]>([
    { id: 'main', name: 'main', label: 'Main', fields: [] },
  ]);
  const [activeSectionId, setActiveSectionId] = useState('main');
  const [selectedField, setSelectedField] = useState<DesignerField | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formName, setFormName] = useState('MyForm');
  const [entityName, setEntityName] = useState('MyEntity');
  const [layout, setLayout] = useState<'single' | 'two_column'>('single');

  const activeSection = sections.find((s) => s.id === activeSectionId) ?? sections[0];
  const fields = activeSection.fields;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const setFields = useCallback(
    (updater: (prev: DesignerField[]) => DesignerField[]) => {
      setSections((prev) =>
        prev.map((s) =>
          s.id === activeSectionId ? { ...s, fields: updater(s.fields) } : s,
        ),
      );
    },
    [activeSectionId],
  );

  const addField = useCallback(
    (type: string) => {
      const newField: DesignerField = {
        id: crypto.randomUUID(),
        type,
        label: `New ${type}`,
        name: `field_${Date.now()}`,
        required: false,
      };
      setFields((prev) => [...prev, newField]);
      setSelectedField(newField);
    },
    [setFields],
  );

  const updateField = useCallback(
    (updated: DesignerField) => {
      setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setSelectedField(updated);
    },
    [setFields],
  );

  const removeField = useCallback(
    (id: string) => {
      setFields((prev) => prev.filter((f) => f.id !== id));
      setSelectedField((prev) => (prev?.id === id ? null : prev));
    },
    [setFields],
  );

  const addSection = useCallback(() => {
    const id = crypto.randomUUID();
    const name = `section_${sections.length + 1}`;
    setSections((prev) => [...prev, { id, name, label: `Section ${sections.length + 1}`, fields: [] }]);
    setActiveSectionId(id);
  }, [sections.length]);

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setFields((prev) => {
        const oldIndex = prev.findIndex((f) => f.id === active.id);
        const newIndex = prev.findIndex((f) => f.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    },
    [setFields],
  );

  const activeField = activeId ? fields.find((f) => f.id === activeId) : null;

  // Generate FSL
  const fslCode = useMemo(() => {
    let fsl = `form ${formName} {\n`;
    fsl += `  entity: ${entityName}\n`;
    fsl += `  layout: "${layout}"\n\n`;
    fsl += `  sections {\n`;
    for (const section of sections) {
      fsl += `    ${section.name} {\n`;
      fsl += `      label: "${section.label}"\n`;
      if (section.fields.length > 0) {
        fsl += `      fields: [${section.fields.map((f) => `"${f.name}"`).join(', ')}]\n`;
      }
      fsl += `    }\n`;
    }
    fsl += `  }\n\n`;
    fsl += `  actions {\n`;
    fsl += `    save { label: "Save", style: "primary" }\n`;
    fsl += `    cancel { label: "Cancel" }\n`;
    fsl += `  }\n`;
    fsl += `}`;
    return fsl;
  }, [formName, entityName, layout, sections]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)]">
        {/* Left: Field Toolbox */}
        <div className="col-span-2 bg-white rounded-lg shadow p-4 overflow-y-auto border-r border-gray-200">
          <FieldToolbox onAddField={addField} />
        </div>

        {/* Center: Canvas */}
        <div className="col-span-7 bg-gray-50 rounded-lg shadow p-4 overflow-y-auto">
          {/* Section tabs */}
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSectionId(s.id)}
                className={`px-3 py-1 text-sm rounded-t ${
                  s.id === activeSectionId
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={addSection}
              className="px-2 py-1 text-sm text-gray-400 hover:text-primary-600"
            >
              + Section
            </button>
          </div>

          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <Canvas
              fields={fields}
              selectedField={selectedField}
              onSelect={setSelectedField}
              onRemove={removeField}
            />
          </SortableContext>
        </div>

        {/* Right: Property Panel */}
        <div className="col-span-3 bg-white rounded-lg shadow p-4 overflow-y-auto border-l border-gray-200">
          <PropertyPanel
            field={selectedField}
            onUpdate={updateField}
            formName={formName}
            entityName={entityName}
            layout={layout}
            onFormNameChange={setFormName}
            onEntityNameChange={setEntityName}
            onLayoutChange={setLayout}
          />
        </div>

        {/* Bottom: FSL Code Preview */}
        <div className="col-span-12 bg-gray-900 rounded-lg shadow p-4 max-h-[200px] overflow-auto border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Generated FSL</span>
            <button
              onClick={() => navigator.clipboard.writeText(fslCode)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Copy
            </button>
          </div>
          <pre className="text-green-400 text-sm font-mono">{fslCode}</pre>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeField ? (
          <div className="p-3 rounded-lg border-2 border-primary-400 bg-white shadow-lg opacity-90">
            <span className="text-sm font-medium">{activeField.label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
