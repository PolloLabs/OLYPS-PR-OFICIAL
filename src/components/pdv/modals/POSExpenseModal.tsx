import React, { useState } from 'react';
import { X, MinusCircle } from 'lucide-react';

interface POSExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, category: string, note: string) => void;
}

const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Suprimentos',
  'Limpeza',
  'Transporte',
  'Manutenção',
  'Embalagens',
  'Adiantamento',
  'Outros',
];

export const POSExpenseModal: React.FC<POSExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Alimentação');
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    onSubmit(val, category, note);
    setAmount('');
    setNote('');
  };

  return (
    <div
      id="modal-pos-expense-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="modal-pos-expense"
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 flex-shrink-0">
            <MinusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Adicionar Despesa Rápida
            </h3>
            <p className="text-[11px] text-slate-500">
              Registra uma saída imediata da gaveta do POS
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Valor da Despesa (R$)*
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                id="input-expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full h-9 pl-9 pr-3 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Categoria*
            </label>
            <select
              id="select-expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Observações / Motivo
            </label>
            <input
              id="input-expense-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Compra de café, almoço, papel bobina..."
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-pos-expense"
              type="submit"
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Confirmar Despesa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
