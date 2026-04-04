/**
 * useCompiler Hook
 * ================
 * FSL derleyicisini React bileşenlerinde kullanmak için hook.
 * Tarayıcıda (client-side) FSL kodu derler - sunucuya istek göndermez.
 *
 * Kullanım:
 *   const { compile, result, error } = useCompiler();
 *   compile('entity Customer { fields { name: String } }');
 *   // result → CompileResult { ast, source }
 *   // error → null veya hata mesajı
 *
 * Neden client-side?
 * - Anlık geri bildirim (her tuşa basışta derleme)
 * - Sunucu yükünü azaltma
 * - Offline çalışabilme
 */

import { useState, useCallback } from 'react';
import { FSLCompiler } from '@flyx/fsl-compiler';
import type { CompileResult } from '@flyx/fsl-compiler';

// Compiler tekil instance - her render'da yeniden oluşturulmaz
const compiler = new FSLCompiler();

export function useCompiler() {
  const [result, setResult] = useState<CompileResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compile = useCallback((source: string) => {
    try {
      const compiled = compiler.compile(source);
      setResult(compiled);
      setError(null);
      return compiled;
    } catch (e: any) {
      setError(e.message);
      setResult(null);
      return null;
    }
  }, []);

  return { compile, result, error };
}
