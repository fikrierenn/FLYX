import { Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DesignerField } from './FormDesigner';

interface CanvasProps {
  fields: DesignerField[];
  selectedField: DesignerField | null;
  onSelect: (field: DesignerField) => void;
  onRemove: (id: string) => void;
}

function SortableField({
  field,
  isSelected,
  onSelect,
  onRemove,
}: {
  field: DesignerField;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <FieldPreview type={field.type} placeholder={field.placeholder} />
      </div>
      <span className="text-[10px] text-gray-400 font-mono">{field.type}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-1 text-gray-400 hover:text-red-500"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function FieldPreview({ type, placeholder }: { type: string; placeholder?: string }) {
  switch (type) {
    case 'checkbox':
    case 'toggle':
      return (
        <div className="mt-1 flex items-center gap-2">
          <div className="w-4 h-4 border border-gray-300 rounded" />
          <span className="text-xs text-gray-400">{placeholder || 'Check option'}</span>
        </div>
      );
    case 'dropdown':
      return (
        <div className="mt-1 h-8 bg-gray-100 rounded border border-gray-200 flex items-center px-2 justify-between">
          <span className="text-xs text-gray-400">{placeholder || 'Select...'}</span>
          <span className="text-gray-400 text-xs">&#9662;</span>
        </div>
      );
    case 'textarea':
      return <div className="mt-1 h-16 bg-gray-100 rounded border border-gray-200" />;
    default:
      return (
        <div className="mt-1 h-8 bg-gray-100 rounded border border-gray-200 flex items-center px-2">
          <span className="text-xs text-gray-400">{placeholder || ''}</span>
        </div>
      );
  }
}

export function Canvas({ fields, selectedField, onSelect, onRemove }: CanvasProps) {
  if (fields.length === 0) {
    return (
      <div className="h-full min-h-[300px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
        <div className="text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-lg mb-1">Drop zone</p>
          <p className="text-sm">Click fields from the toolbox to add them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <SortableField
          key={field.id}
          field={field}
          isSelected={selectedField?.id === field.id}
          onSelect={() => onSelect(field)}
          onRemove={() => onRemove(field.id)}
        />
      ))}
    </div>
  );
}
