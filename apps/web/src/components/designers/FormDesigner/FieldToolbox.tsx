import { Type, Hash, Mail, Calendar, CheckSquare, List, Phone, Link, FileText, ToggleLeft } from 'lucide-react';

const FIELD_TYPES = [
  { type: 'text', label: 'Text Input', icon: Type },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'url', label: 'URL', icon: Link },
  { type: 'textarea', label: 'Text Area', icon: FileText },
  { type: 'date', label: 'Date Picker', icon: Calendar },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'toggle', label: 'Toggle', icon: ToggleLeft },
  { type: 'dropdown', label: 'Dropdown', icon: List },
];

interface FieldToolboxProps {
  onAddField: (type: string) => void;
}

export function FieldToolbox({ onAddField }: FieldToolboxProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Fields</h3>
      <div className="space-y-2">
        {FIELD_TYPES.map((field) => (
          <button
            key={field.type}
            onClick={() => onAddField(field.type)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded hover:bg-primary-50 hover:text-primary-700 transition-colors"
          >
            <field.icon className="w-4 h-4" />
            {field.label}
          </button>
        ))}
      </div>
    </div>
  );
}
