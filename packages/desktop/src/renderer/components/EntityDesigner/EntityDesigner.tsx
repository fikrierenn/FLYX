/**
 * Entity Designer - 1C Benzeri Görsel Entity Tasarımcı
 * =====================================================
 * Tablo görünümünde entity field'larını gösterir ve düzenlemeye izin verir.
 *
 * 1C:Enterprise'daki tablo tasarımcısı benzeri:
 * ┌──────────┬──────────┬──────┬────────┬─────────┐
 * │ Alan Adı │ Veri Tipi│ Zor. │ Benzrsz│ Varsyln │
 * ├──────────┼──────────┼──────┼────────┼─────────┤
 * │ code     │ String   │  ☑   │  ☑     │         │
 * │ name     │ String   │  ☑   │  ☐     │         │
 * │ email    │ Email    │  ☐   │  ☑     │         │
 * └──────────┴──────────┴──────┴────────┴─────────┘
 *
 * Alt kısımda üretilen FSL kodu önizleme.
 */

import React, { useState, useMemo } from 'react';

interface DesignerField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  indexed: boolean;
  defaultValue: string;
}

const DATA_TYPES = [
  'String', 'Number', 'Decimal', 'Boolean', 'Date', 'DateTime',
  'Email', 'Phone', 'URL', 'Text', 'JSON', 'Enum', 'Relation',
  'File', 'Image', 'Money',
];

const DEFAULT_FIELDS: DesignerField[] = [
  { id: '1', name: 'code', type: 'String', required: true, unique: true, indexed: true, defaultValue: '' },
  { id: '2', name: 'name', type: 'String', required: true, unique: false, indexed: false, defaultValue: '' },
  { id: '3', name: 'status', type: 'Enum', required: false, unique: false, indexed: false, defaultValue: 'active' },
];

interface EntityDesignerProps {
  entityName: string;
}

export function EntityDesigner({ entityName }: EntityDesignerProps) {
  const [fields, setFields] = useState<DesignerField[]>(DEFAULT_FIELDS);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const addField = () => {
    const newField: DesignerField = {
      id: crypto.randomUUID(),
      name: `field_${fields.length + 1}`,
      type: 'String',
      required: false,
      unique: false,
      indexed: false,
      defaultValue: '',
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const updateField = (id: string, key: keyof DesignerField, value: any) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  // FSL kod önizleme
  const fslCode = useMemo(() => {
    let code = `entity ${entityName} {\n  fields {\n`;
    for (const f of fields) {
      const constraints: string[] = [];
      if (f.required) constraints.push('required');
      if (f.unique) constraints.push('unique');
      if (f.indexed) constraints.push('indexed');
      if (f.defaultValue) constraints.push(`default: "${f.defaultValue}"`);

      const constraintStr = constraints.length > 0 ? ` { ${constraints.join(', ')} }` : '';
      code += `    ${f.name}: ${f.type}${constraintStr}\n`;
    }
    code += '  }\n}';
    return code;
  }, [entityName, fields]);

  return (
    <div className="flex flex-col h-full">
      {/* Başlık */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <span className="text-lg">📦</span>
          <h2 className="font-semibold">{entityName}</h2>
          <span className="text-xs text-gray-400">Entity Designer</span>
        </div>
        <div className="flex gap-2">
          <button onClick={addField} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
            + Alan Ekle
          </button>
          <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
            Derle
          </button>
        </div>
      </div>

      {/* Alan Tablosu - 1C Benzeri */}
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1.5 text-left w-8">#</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left">Alan Adı</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left w-32">Veri Tipi</th>
              <th className="border border-gray-300 px-2 py-1.5 text-center w-16">Zorunlu</th>
              <th className="border border-gray-300 px-2 py-1.5 text-center w-16">Benzersiz</th>
              <th className="border border-gray-300 px-2 py-1.5 text-center w-16">İndeks</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left">Varsayılan</th>
              <th className="border border-gray-300 px-2 py-1.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, i) => (
              <tr
                key={field.id}
                onClick={() => setSelectedFieldId(field.id)}
                className={`cursor-pointer ${
                  selectedFieldId === field.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <td className="border border-gray-300 px-2 py-1 text-gray-400">{i + 1}</td>
                <td className="border border-gray-300 px-1 py-0.5">
                  <input
                    value={field.name}
                    onChange={(e) => updateField(field.id, 'name', e.target.value)}
                    className="w-full px-1 py-0.5 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-0.5">
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.id, 'type', e.target.value)}
                    className="w-full px-1 py-0.5 bg-transparent focus:bg-white focus:outline-none text-xs"
                  >
                    {DATA_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="border border-gray-300 text-center">
                  <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, 'required', e.target.checked)} />
                </td>
                <td className="border border-gray-300 text-center">
                  <input type="checkbox" checked={field.unique} onChange={(e) => updateField(field.id, 'unique', e.target.checked)} />
                </td>
                <td className="border border-gray-300 text-center">
                  <input type="checkbox" checked={field.indexed} onChange={(e) => updateField(field.id, 'indexed', e.target.checked)} />
                </td>
                <td className="border border-gray-300 px-1 py-0.5">
                  <input
                    value={field.defaultValue}
                    onChange={(e) => updateField(field.id, 'defaultValue', e.target.value)}
                    className="w-full px-1 py-0.5 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                    placeholder="-"
                  />
                </td>
                <td className="border border-gray-300 text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                    className="text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alt Panel - FSL Kod Önizleme */}
      <div className="h-48 border-t bg-gray-900 p-3 overflow-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 text-xs uppercase">Üretilen FSL Kodu</span>
          <button
            onClick={() => navigator.clipboard.writeText(fslCode)}
            className="text-gray-500 hover:text-white text-xs"
          >
            Kopyala
          </button>
        </div>
        <pre className="text-green-400 text-xs font-mono whitespace-pre">{fslCode}</pre>
      </div>
    </div>
  );
}
