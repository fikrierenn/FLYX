import type { DesignerField } from './FormDesigner';

interface PropertyPanelProps {
  field: DesignerField | null;
  onUpdate: (field: DesignerField) => void;
  formName: string;
  entityName: string;
  layout: 'single' | 'two_column';
  onFormNameChange: (name: string) => void;
  onEntityNameChange: (name: string) => void;
  onLayoutChange: (layout: 'single' | 'two_column') => void;
}

export function PropertyPanel({
  field,
  onUpdate,
  formName,
  entityName,
  layout,
  onFormNameChange,
  onEntityNameChange,
  onLayoutChange,
}: PropertyPanelProps) {
  return (
    <div className="space-y-6">
      {/* Form Properties */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Form Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Form Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => onFormNameChange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Entity</label>
            <input
              type="text"
              value={entityName}
              onChange={(e) => onEntityNameChange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Layout</label>
            <select
              value={layout}
              onChange={(e) => onLayoutChange(e.target.value as 'single' | 'two_column')}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-primary-500 outline-none"
            >
              <option value="single">Single Column</option>
              <option value="two_column">Two Columns</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Field Properties */}
      {field && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Field Properties</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Label</label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => onUpdate({ ...field, label: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Field Name</label>
              <input
                type="text"
                value={field.name}
                onChange={(e) => onUpdate({ ...field, name: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Placeholder</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate({ ...field, required: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label className="text-sm text-gray-700">Required</label>
            </div>
            <div className="text-xs text-gray-400">
              Type: <span className="font-mono">{field.type}</span>
            </div>
          </div>
        </div>
      )}

      {!field && (
        <div className="text-sm text-gray-400 text-center py-8">
          Select a field to edit properties
        </div>
      )}
    </div>
  );
}
