/**
 * Transaction Code Diyaloğu (SAP Benzeri)
 * =========================================
 * F2 tuşu ile açılır. SAP'taki transaction code girişi gibi
 * hızlı navigasyon sağlar.
 *
 * Desteklenen kodlar:
 * - VA01: Satış Siparişi Oluştur
 * - XD01: Müşteri Oluştur
 * - MM01: Malzeme Oluştur
 * - FI01: Banka Ana Kaydı Oluştur
 */

import React, { useState, useRef, useEffect } from 'react';
import { transactionCodes, findTransactionCode } from '../../../main/index';

interface TransactionDialogProps {
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export function TransactionDialog({ onClose, onNavigate }: TransactionDialogProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Otomatik odaklan
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tc = findTransactionCode(code);
    if (tc) {
      onNavigate(tc.route);
    } else {
      setError(`"${code}" bulunamadı`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-96 p-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h3 className="font-semibold mb-3">Transaction Code (F2)</h3>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
            placeholder="Kod girin (örn: VA01)"
            className="w-full border rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

          <button type="submit" className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            Git →
          </button>
        </form>

        {/* Hızlı Erişim Listesi */}
        <div className="mt-4 border-t pt-3">
          <p className="text-xs text-gray-500 mb-2">Sık Kullanılanlar:</p>
          <div className="space-y-1">
            {transactionCodes.slice(0, 5).map((tc) => (
              <button
                key={tc.code}
                onClick={() => onNavigate(tc.route)}
                className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded flex justify-between"
              >
                <span className="font-mono font-semibold">{tc.code}</span>
                <span className="text-gray-500">{tc.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
