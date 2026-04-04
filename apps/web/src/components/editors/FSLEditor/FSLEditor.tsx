/**
 * FSL Kod Editörü
 * ================
 * FSL kodu yazmak için metin editörü. Canlı derleme geri bildirimi sunar:
 * - Yeşil durum: Kod başarıyla derlendi, AST üretildi
 * - Kırmızı durum: Derleme hatası, alt panelde hata detayı gösterilir
 * - AST önizlemesi: Başarılı derleme sonrası JSON formatında AST gösterimi
 *
 * Not: Şu an basit textarea kullanılıyor. İleride Monaco Editor
 * (VSCode'un editör motoru) ile FSL syntax highlighting eklenecek.
 */

import { useCallback } from 'react';
import { useCompiler } from '../../../hooks/useCompiler';

interface FSLEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * FSL code editor with live compilation feedback.
 * Uses a textarea for now; Monaco integration will be added later.
 */
export function FSLEditor({ value, onChange }: FSLEditorProps) {
  const { compile, result, error } = useCompiler();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      compile(newValue);
    },
    [onChange, compile],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
        <span className="text-sm font-medium text-gray-600">FSL Editor</span>
        <span className={`text-xs px-2 py-1 rounded ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {error ? 'Error' : result ? `${result.ast.length} declaration(s)` : 'Ready'}
        </span>
      </div>
      <textarea
        value={value}
        onChange={handleChange}
        className="flex-1 min-h-[400px] p-4 font-mono text-sm bg-gray-900 text-green-400 resize-none outline-none"
        spellCheck={false}
        placeholder="// Write FSL code here..."
      />
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-sm font-mono">
          {error}
        </div>
      )}
      {result && !error && (
        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 font-mono max-h-[200px] overflow-auto">
          <pre>{JSON.stringify(result.ast, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
