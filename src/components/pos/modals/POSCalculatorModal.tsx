import React, { useState } from 'react';
import { X, Calculator, Delete, ArrowRight } from 'lucide-react';

interface POSCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDiscount?: (amount: number) => void;
}

export const POSCalculatorModal: React.FC<POSCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyDiscount,
}) => {
  const [expression, setExpression] = useState<string>('');
  const [result, setResult] = useState<string>('0');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    setExpression((prev) => prev + digit);
  };

  const handleClear = () => {
    setExpression('');
    setResult('0');
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    if (!expression) return;
    try {
      const sanitized = expression.replace(/[^0-9+\-*/.]/g, '');
      // eslint-disable-next-line no-eval
      const res = Function(`'use strict'; return (${sanitized})`)();
      const formatted = String(Number(Number(res).toFixed(2)));
      setResult(formatted);
      setExpression(formatted);
    } catch {
      setResult('Erro');
    }
  };

  const handleApplyAsDiscount = () => {
    const val = parseFloat(result);
    if (!isNaN(val) && val > 0 && onApplyDiscount) {
      onApplyDiscount(val);
      onClose();
    }
  };

  return (
    <div
      id="modal-pos-calculator-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="modal-pos-calculator"
        className="bg-slate-900 text-white rounded-2xl shadow-2xl max-w-xs w-full p-4 relative border border-slate-800 animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 mb-3 text-emerald-400">
          <Calculator className="w-4 h-4" />
          <h3 className="font-bold text-xs uppercase tracking-wider">
            Calculadora Rápida
          </h3>
        </div>

        {/* Visor */}
        <div className="bg-slate-950 p-3 rounded-xl mb-3 border border-slate-800 text-right font-mono min-h-[64px] flex flex-col justify-end">
          <div className="text-xs text-slate-400 tracking-wider truncate">
            {expression || '0'}
          </div>
          <div className="text-2xl font-black text-emerald-400 truncate">
            {result || '0'}
          </div>
        </div>

        {/* Teclado */}
        <div className="grid grid-cols-4 gap-2 text-sm font-bold">
          <button
            type="button"
            onClick={handleClear}
            className="h-10 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
          >
            C
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDigit('/')}
            className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors cursor-pointer text-base"
          >
            ÷
          </button>
          <button
            type="button"
            onClick={() => handleDigit('*')}
            className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors cursor-pointer text-base"
          >
            ×
          </button>

          {['7', '8', '9'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(n)}
              className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleDigit('-')}
            className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors cursor-pointer text-base"
          >
            -
          </button>

          {['4', '5', '6'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(n)}
              className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleDigit('+')}
            className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors cursor-pointer text-base"
          >
            +
          </button>

          {['1', '2', '3'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(n)}
              className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={handleCalculate}
            className="row-span-2 h-auto rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg transition-colors cursor-pointer flex items-center justify-center shadow-lg"
          >
            =
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="col-span-2 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleDigit('.')}
            className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer text-base"
          >
            .
          </button>
        </div>

        {onApplyDiscount && parseFloat(result) > 0 && (
          <div className="pt-3 mt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleApplyAsDiscount}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Aplicar R$ {result} como Desconto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
