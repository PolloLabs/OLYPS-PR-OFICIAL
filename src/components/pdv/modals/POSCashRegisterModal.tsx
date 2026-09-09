import React, { useState } from 'react';
import { X, Archive, Lock, Unlock, ArrowDownRight, ArrowUpRight, DollarSign, Calculator } from 'lucide-react';
import type { POSCashRegister } from '../../../types/pos.types.js';

interface POSCashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashRegister: POSCashRegister | null;
  onUpdateRegister: (payload: Partial<POSCashRegister>) => Promise<void>;
}

export const POSCashRegisterModal: React.FC<POSCashRegisterModalProps> = ({
  isOpen,
  onClose,
  cashRegister,
  onUpdateRegister,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'movement' | 'close'>('status');
  const [physicalCount, setPhysicalCount] = useState<string>('');
  const [movementType, setMovementType] = useState<'withdrawal' | 'deposit'>('withdrawal');
  const [movementAmount, setMovementAmount] = useState<string>('');
  const [movementReason, setMovementReason] = useState<string>('');
  const [closingNote, setClosingNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const initialAmount = cashRegister?.initialAmount || 250.0;
  const cashSales = cashRegister?.cashSales || 1230.0;
  const cardSales = cashRegister?.cardSales || 890.0;
  const expenses = cashRegister?.expenses || 45.0;
  const withdrawals = cashRegister?.withdrawals || 0;
  const deposits = cashRegister?.deposits || 0;

  // Total esperado na gaveta física
  const expectedPhysicalCash =
    initialAmount + cashSales + deposits - expenses - withdrawals;

  const physicalCountVal = parseFloat(physicalCount) || 0;
  const difference = physicalCount ? physicalCountVal - expectedPhysicalCash : 0;

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(movementAmount);
    if (!amt || amt <= 0) return;

    setIsSubmitting(true);
    try {
      const isWithdrawal = movementType === 'withdrawal';
      await onUpdateRegister({
        withdrawals: isWithdrawal ? withdrawals + amt : withdrawals,
        deposits: !isWithdrawal ? deposits + amt : deposits,
        notes: `[${isWithdrawal ? 'Sangria' : 'Suprimento'}]: R$ ${amt.toFixed(2)} - ${movementReason || 'Sem motivo informado'}`,
      });
      setMovementAmount('');
      setMovementReason('');
      setActiveTab('status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleOpenClose = async () => {
    setIsSubmitting(true);
    try {
      const isCurrentlyOpen = cashRegister?.isOpen !== false;
      await onUpdateRegister({
        isOpen: !isCurrentlyOpen,
        currentAmount: expectedPhysicalCash,
        notes: isCurrentlyOpen
          ? `Fechamento de caixa. Conferência física: R$ ${physicalCountVal.toFixed(2)}. ${closingNote}`
          : 'Abertura de novo turno de caixa.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-pos-cash-register-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="modal-pos-cash-register"
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Gaveta de Dinheiro & Caixa
            </h3>
            <p className="text-[11px] text-slate-500">
              Operador: {cashRegister?.operatorName || 'Admin Master'} •{' '}
              <span
                className={`font-semibold ${
                  cashRegister?.isOpen !== false
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {cashRegister?.isOpen !== false ? 'Caixa Aberto' : 'Caixa Fechado'}
              </span>
            </p>
          </div>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-200 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'status'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Resumo & Conferência
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('movement')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'movement'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Sangria / Suprimento
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('close')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'close'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Fechar / Abrir Caixa
          </button>
        </div>

        {/* Conteúdo da Aba 1: Resumo & Conferência */}
        {activeTab === 'status' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[11px] block">
                  Fundo Inicial (Troco)
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  R$ {initialAmount.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 text-[11px] block">
                  Vendas em Dinheiro
                </span>
                <span className="font-bold text-emerald-900 text-sm">
                  + R$ {cashSales.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-rose-700 text-[11px] block">
                  Despesas do Turno
                </span>
                <span className="font-bold text-rose-900 text-sm">
                  - R$ {expenses.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                <span className="text-blue-700 text-[11px] block">
                  Cartões / Outros
                </span>
                <span className="font-bold text-blue-900 text-sm">
                  R$ {cardSales.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Saldo Esperado em Dinheiro */}
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-900 block">
                  Saldo Esperado na Gaveta
                </span>
                <span className="text-[11px] text-teal-700">
                  (Inicial + Dinheiro - Despesas - Sangrias)
                </span>
              </div>
              <span className="text-lg font-black text-teal-900 font-mono">
                R$ {expectedPhysicalCash.toFixed(2)}
              </span>
            </div>

            {/* Conferência Física */}
            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
              <label className="text-xs font-semibold text-slate-700 block">
                Conferência Física (Valor Contado na Gaveta)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(e.target.value)}
                  placeholder="0,00"
                  className="w-full h-9 pl-9 pr-3 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {physicalCount !== '' && (
                <div
                  className={`p-2 rounded text-xs flex justify-between font-bold ${
                    Math.abs(difference) < 0.01
                      ? 'bg-emerald-100 text-emerald-800'
                      : difference > 0
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  <span>
                    {Math.abs(difference) < 0.01
                      ? 'Caixa Batido (Sem diferença)'
                      : difference > 0
                      ? 'Sobra de Caixa:'
                      : 'Falta de Caixa:'}
                  </span>
                  <span>R$ {difference.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 2: Sangria / Suprimento */}
        {activeTab === 'movement' && (
          <form onSubmit={handleRegisterMovement} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('withdrawal')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  movementType === 'withdrawal'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 font-black shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <span>Sangria (Retirada)</span>
              </button>
              <button
                type="button"
                onClick={() => setMovementType('deposit')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  movementType === 'deposit'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-black shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Suprimento (Reforço)</span>
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Valor da Movimentação (R$)*
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full h-9 pl-9 pr-3 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Motivo / Justificativa*
              </label>
              <input
                type="text"
                required
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder="Ex: Pagamento a fornecedor local, troco extra..."
                className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('status')}
                className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 py-2 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer ${
                  movementType === 'withdrawal'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmitting ? 'Registrando...' : 'Confirmar Lançamento'}
              </button>
            </div>
          </form>
        )}

        {/* Conteúdo da Aba 3: Fechar / Abrir Caixa */}
        {activeTab === 'close' && (
          <div className="space-y-3.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Status atual:</span>
                <span className="font-bold text-slate-800">
                  {cashRegister?.isOpen !== false ? 'Aberto' : 'Fechado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total apurado em dinheiro:</span>
                <span className="font-bold text-slate-800">
                  R$ {expectedPhysicalCash.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Observações de Encerramento / Abertura
              </label>
              <textarea
                rows={2}
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
                placeholder="Ex: Turno da manhã encerrado sem pendências..."
                className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('status')}
                className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleToggleOpenClose}
                disabled={isSubmitting}
                className={`flex-1 py-2 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  cashRegister?.isOpen !== false
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {cashRegister?.isOpen !== false ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Fechar Caixa</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Abrir Novo Turno</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
