/**
 * FLYX React Liste Sayfası Üretici
 * ==================================
 * FSL entity tanımından Tailwind CSS ile stillendirilmiş bir React liste
 * sayfası bileşeni üretir. Zustand store ile entegre çalışır.
 *
 * Üretilen sayfa özellikleri:
 * - Tablo görünümünde veri listesi (responsive, overflow-x-auto)
 * - Yeni kayıt ekleme butonu
 * - Düzenleme ve silme butonları (her satırda)
 * - Yükleme durumu göstergesi (loading state)
 * - Boş durum mesajı ("Kayıt bulunamadı")
 * - Form modal entegrasyonu (oluşturma ve düzenleme için)
 * - Zustand store'dan otomatik veri çekme (useEffect ile)
 *
 * Alan Filtreleme Kararları:
 * - JSON alanları: Tabloda gösterilmez (karmaşık yapı, tablo hücresine sığmaz)
 * - Text alanları: Gösterilmez (uzun metin, tablo için uygun değil)
 * - Computed alanları: Gösterilmez (sunucu tarafında hesaplanır)
 *
 * Veri Tipi Bazlı Hücre Gösterimi:
 * - Enum: Renkli badge (active→yeşil, inactive→gri, diğer→kırmızı)
 * - Boolean: "Evet" / "Hayır" metni
 * - Decimal/Money: Sağa hizalı, monospace font, toLocaleString formatı
 * - Diğer: Düz metin, null ise '-' gösterilir
 */

import type { EntityDeclaration, FieldDeclaration } from '@flyx/fsl-compiler';
import { toCamelCase, toPlural, toLabel } from '../../core/naming/index.js';

/**
 * React liste sayfası üretici sınıfı.
 * Entity tanımından tam işlevsel bir tablo sayfası bileşeni üretir.
 */
export class ReactListPageGenerator {
  /**
   * Verilen entity için React liste sayfası kodu üretir.
   *
   * @param entity - FSL entity tanımı
   * @returns JSX içeren React bileşen kaynak kodu
   */
  generate(entity: EntityDeclaration): string {
    const name = entity.name;
    const plural = toPlural(name);
    const storeName = `use${name}Store`;
    const formModal = `${name}FormModal`;

    // Tabloda gösterilecek alanları filtrele - JSON, Text ve Computed hariç
    const visibleFields = entity.fields.filter(
      (f) => !['JSON', 'Text', 'Computed'].includes(f.dataType.name),
    );

    // Tablo başlık hücrelerini üret (her alan için bir <th>)
    const headers = visibleFields
      .map((f) => `              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">${toLabel(f.name)}</th>`)
      .join('\n');

    // Tablo veri hücrelerini üret (veri tipine göre özel gösterim)
    const cells = visibleFields
      .map((f) => this.generateCell(f))
      .join('\n');

    return `import { useState, useEffect } from 'react';
import { ${storeName} } from '../../stores/${toCamelCase(name)}Store';
import { ${formModal} } from './${formModal}';

export function ${name}sPage() {
  const { ${plural}, loading, fetch${name}s, delete${name} } = ${storeName}();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    fetch${name}s();
  }, []);

  const handleEdit = (item: any) => {
    setEditing(item);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditing(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">${name}</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Yeni ${name}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Yukleniyor...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
${headers}
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {${plural}.length === 0 ? (
                <tr>
                  <td colSpan={${visibleFields.length + 1}} className="px-4 py-8 text-center text-gray-400">
                    Kayit bulunamadi
                  </td>
                </tr>
              ) : (
                ${plural}.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
${cells}
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                        Duzenle
                      </button>
                      <button onClick={() => delete${name}(item.id)} className="text-red-600 hover:text-red-800">
                        Sil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <${formModal} isOpen={isModalOpen} onClose={handleClose} ${toCamelCase(name)}={editing} />
    </div>
  );
}`;
  }

  /**
   * Veri tipine göre tablo hücresi JSX kodu üretir.
   * Her veri tipi farklı bir görsel sunum alır:
   * - Enum: Renkli yuvarlak badge (durum göstergesi)
   * - Boolean: Türkçe "Evet"/"Hayır" metni
   * - Decimal/Money: Sağa hizalı, monospace font, sayı formatı
   * - Diğer: Düz metin, null/undefined ise '-' gösterilir
   */
  private generateCell(field: FieldDeclaration): string {
    if (field.dataType.name === 'Enum') {
      return `                    <td className="px-4 py-3">
                      <span className={\`px-2 py-1 rounded-full text-xs font-medium \${
                        item.${field.name} === 'active' ? 'bg-green-100 text-green-700' :
                        item.${field.name} === 'inactive' ? 'bg-gray-100 text-gray-600' :
                        'bg-red-100 text-red-700'
                      }\`}>
                        {item.${field.name}}
                      </span>
                    </td>`;
    }
    if (field.dataType.name === 'Boolean') {
      return `                    <td className="px-4 py-3">{item.${field.name} ? 'Evet' : 'Hayir'}</td>`;
    }
    if (field.dataType.name === 'Decimal' || field.dataType.name === 'Money') {
      return `                    <td className="px-4 py-3 text-right font-mono">{item.${field.name}?.toLocaleString()}</td>`;
    }
    return `                    <td className="px-4 py-3">{item.${field.name} ?? '-'}</td>`;
  }
}
