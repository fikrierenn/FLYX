/**
 * FLYX React Form Modal Üretici
 * ===============================
 * FSL entity tanımından hem oluşturma (create) hem de düzenleme (edit)
 * işlemleri için kullanılan bir React modal form bileşeni üretir.
 *
 * Üretilen modal özellikleri:
 * - Overlay ile tam ekran modal (fixed positioning, z-50)
 * - Oluşturma ve düzenleme modları (entity prop'una göre otomatik geçiş)
 * - Dinamik form alanları (veri tipine göre uygun input tipi)
 * - Zustand store entegrasyonu (create ve update aksiyonları)
 * - Form state yönetimi (useState + useEffect ile senkronizasyon)
 * - Kaydırılabilir içerik (max-h-[90vh] overflow-y-auto)
 *
 * Alan Tipi → Form Elemanı Eşlemesi:
 * - Enum: <select> dropdown (constraint values'dan seçenekler)
 * - Boolean: <input type="checkbox">
 * - Text: <textarea> (çok satırlı metin)
 * - Email/Phone/URL/Number/Date: Uygun HTML5 input tipi
 * - Diğer: <input type="text">
 *
 * Computed alanlar formda gösterilmez (sunucu tarafında hesaplanır).
 */

import type { EntityDeclaration, FieldDeclaration } from '@flyx/fsl-compiler';
import { toCamelCase, toLabel } from '../../core/naming/index.js';
import { mapToInputType, getDefaultValue } from '../../core/type-mapper/index.js';

/**
 * React form modal üretici sınıfı.
 * Entity tanımından create/edit modal bileşeni üretir.
 */
export class ReactFormModalGenerator {
  /**
   * Verilen entity için React form modal kodu üretir.
   * Modal hem yeni kayıt oluşturma hem de mevcut kaydı düzenleme için kullanılır.
   * entity prop'u varsa düzenleme modu, yoksa oluşturma modu aktif olur.
   *
   * @param entity - FSL entity tanımı
   * @returns JSX içeren React modal bileşen kaynak kodu
   */
  generate(entity: EntityDeclaration): string {
    const name = entity.name;
    const nameVar = toCamelCase(name);
    const storeName = `use${name}Store`;

    // Computed alanlar form dışında bırakılır (sunucu hesaplar)
    const editableFields = entity.fields.filter(
      (f) => !['Computed'].includes(f.dataType.name),
    );

    // Form'un başlangıç state'i - düzenleme modunda entity değerleri, yoksa varsayılanlar
    const initialState = editableFields
      .map((f) => `    ${f.name}: ${nameVar}?.${f.name} ?? ${getDefaultValue(f)},`)
      .join('\n');

    // Her alan için uygun form elemanı (input, select, textarea, checkbox)
    const formFields = editableFields
      .map((f) => this.generateFormField(f))
      .join('\n');

    return `import { useState, useEffect } from 'react';
import { ${storeName} } from '../../stores/${nameVar}Store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ${nameVar}?: any;
}

export function ${name}FormModal({ isOpen, onClose, ${nameVar} }: Props) {
  const { create${name}, update${name} } = ${storeName}();
  const [formData, setFormData] = useState({
${initialState}
  });

  useEffect(() => {
    if (${nameVar}) {
      setFormData({
${editableFields.map((f) => `        ${f.name}: ${nameVar}.${f.name} ?? ${getDefaultValue(f)},`).join('\n')}
      });
    }
  }, [${nameVar}]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (${nameVar}) {
      await update${name}(${nameVar}.id, formData);
    } else {
      await create${name}(formData);
    }
    onClose();
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {${nameVar} ? '${name} Duzenle' : 'Yeni ${name}'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
${formFields}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              Iptal
            </button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`;
  }

  /**
   * Veri tipine göre uygun form alanı JSX kodu üretir.
   * Her veri tipi farklı bir form elemanı alır:
   * - Enum: <select> dropdown (constraint values'dan seçenekler üretilir)
   * - Boolean: Checkbox (etiket yanında)
   * - Text: <textarea> (uzun metin girişi için, min-h-[80px])
   * - Diğer: HTML5 input tipi (email, tel, url, number, date vb.)
   *
   * Zorunlu alanlar '*' işareti ve HTML required attribute'u alır.
   * String(200) gibi parametre varsa maxLength attribute'u eklenir.
   */
  private generateFormField(field: FieldDeclaration): string {
    const label = toLabel(field.name);
    const required = field.constraints?.required;
    const reqMark = required ? ' *' : '';
    const reqAttr = required ? ' required' : '';

    // Enum alanları: Constraint'teki values dizisinden <option> elemanları üretilir
    if (field.dataType.name === 'Enum' && field.constraints?.values) {
      const options = field.constraints.values
        .map((v) => `              <option value="${v}">${v}</option>`)
        .join('\n');
      return `          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">${label}${reqMark}</label>
            <select value={formData.${field.name}} onChange={(e) => handleChange('${field.name}', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"${reqAttr}>
${options}
            </select>
          </div>`;
    }

    if (field.dataType.name === 'Boolean') {
      return `          <div className="flex items-center gap-2">
            <input type="checkbox" checked={formData.${field.name}}
              onChange={(e) => handleChange('${field.name}', e.target.checked)}
              className="rounded border-gray-300" />
            <label className="text-sm font-medium text-gray-700">${label}</label>
          </div>`;
    }

    if (field.dataType.name === 'Text') {
      return `          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">${label}${reqMark}</label>
            <textarea value={formData.${field.name}} onChange={(e) => handleChange('${field.name}', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[80px]"${reqAttr} />
          </div>`;
    }

    const inputType = mapToInputType(field.dataType);
    const maxLen = field.dataType.params?.[0] ? ` maxLength={${field.dataType.params[0]}}` : '';

    return `          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">${label}${reqMark}</label>
            <input type="${inputType}" value={formData.${field.name}}
              onChange={(e) => handleChange('${field.name}', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"${reqAttr}${maxLen} />
          </div>`;
  }

}
