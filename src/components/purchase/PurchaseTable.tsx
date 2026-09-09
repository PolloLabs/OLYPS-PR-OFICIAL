import React, { useState } from 'react';
import {
  FileText,
  Eye,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Package,
  Calendar,
  DollarSign,
  X,
  CreditCard,
} from 'lucide-react';
import type { PurchaseRecord, PurchaseItem } from '../../types/purchase.types.js';

interface PurchaseTableProps {
  purchases: PurchaseRecord[];
  isLoading: boolean;
  onDelete: (purchaseId: string) => Promise<void>;
  onNavigateToReturn?: (purchase: PurchaseRecord) => void;
  onOpenCreate?: () => void;
}

export const PurchaseTable: React.FC<PurchaseTableProps> = ({
  purchases,
  isLoading,
  onDelete,
  onNavigateToReturn,
  onOpenCreate,
}) => {
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseRecord | null>(null);

  // Helper de formatação monetária BRL
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  // Helper de formatação de data
  const formatDate = (dateInput: Date | string) => {
    if (!dateInput) return '-';
    try {
      const d = new Date(dateInput);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return String(dateInput);
    }
  };

  // Status de Pagamento (Pago, Parcial, Pendente)
  const getPaymentSummary = (purchase: PurchaseRecord) => {
    const totalPaid = (purchase.payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const totalNet = Number(purchase.totalNetValue) || 0;

    if (totalPaid >= totalNet && totalNet > 0) {
      return {
        status: 'paid',
        label: 'Pago',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        paidAmount: totalPaid,
        dueAmount: 0,
      };
    }
    if (totalPaid > 0) {
      return {
        status: 'partial',
        label: 'Parcial',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        paidAmount: totalPaid,
        dueAmount: Math.max(0, totalNet - totalPaid),
      };
    }
    return {
      status: 'pending',
      label: 'Pendente',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      paidAmount: 0,
      dueAmount: totalNet,
    };
  };

  // Badge do status da compra
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Recebido
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'ordered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Package className="w-3 h-3" />
            Encomendado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3" />
            {status || 'Registrado'}
          </span>
        );
    }
  };

  const handleConfirmDelete = async () => {
    if (!purchaseToDelete) return;
    try {
      setDeletingId(purchaseToDelete.id);
      await onDelete(purchaseToDelete.id);
      setPurchaseToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-emerald-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Carregando compras...</p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">Nenhuma compra encontrada</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          Nenhum registro corresponde aos filtros selecionados ou nenhuma compra foi cadastrada ainda.
        </p>
        {onOpenCreate && (
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
          >
            Adicionar Nova Compra
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Número da Compra</th>
              <th className="py-3.5 px-4">Data</th>
              <th className="py-3.5 px-4">Fornecedor</th>
              <th className="py-3.5 px-4">Referência / NF</th>
              <th className="py-3.5 px-4">Status Compra</th>
              <th className="py-3.5 px-4">Pagamento</th>
              <th className="py-3.5 px-4 text-right">Total Líquido</th>
              <th className="py-3.5 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {purchases.map((purchase) => {
              const payment = getPaymentSummary(purchase);
              return (
                <tr key={purchase.id} className="hover:bg-slate-50/75 transition-colors">
                  {/* Número da Compra */}
                  <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        {purchase.purchaseNumber || 'COMP-N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Data */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(purchase.purchaseDate)}
                    </div>
                  </td>

                  {/* Fornecedor */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-medium text-slate-900 truncate">
                      {purchase.supplierName || 'Fornecedor Cadastrado'}
                    </div>
                    {purchase.locationName && (
                      <div className="text-[11px] text-slate-400 truncate">
                        Loc: {purchase.locationName}
                      </div>
                    )}
                  </td>

                  {/* Referência */}
                  <td className="py-3.5 px-4 text-slate-600 font-mono whitespace-nowrap">
                    {purchase.referenceNumber || '-'}
                  </td>

                  {/* Status da Compra */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(purchase.status)}
                  </td>

                  {/* Status do Pagamento */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${payment.color}`}
                    >
                      <CreditCard className="w-3 h-3" />
                      {payment.label}
                    </span>
                  </td>

                  {/* Total Líquido */}
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(purchase.totalNetValue)}
                  </td>

                  {/* Ações */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      {/* Visualizar */}
                      <button
                        type="button"
                        onClick={() => setSelectedPurchase(purchase)}
                        title="Ver detalhes da compra"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Devolver / Retorno */}
                      {onNavigateToReturn && (
                        <button
                          type="button"
                          onClick={() => onNavigateToReturn(purchase)}
                          title="Devolver mercadorias desta compra"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}

                      {/* Excluir */}
                      <button
                        type="button"
                        onClick={() => setPurchaseToDelete(purchase)}
                        title="Excluir compra"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes da Compra */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Detalhes da Compra {selectedPurchase.purchaseNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registrada em {formatDate(selectedPurchase.purchaseDate)} &bull; Ref: {selectedPurchase.referenceNumber || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Informações Gerais */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Fornecedor</span>
                  <span className="font-semibold text-slate-900">{selectedPurchase.supplierName || 'Não especificado'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status da Compra</span>
                  <div className="mt-0.5">{getStatusBadge(selectedPurchase.status)}</div>
                </div>
                <div>
                  <span className="text-slate-500 block">Condição de Pagamento</span>
                  <span className="font-semibold text-slate-900">
                    {selectedPurchase.paymentTerm || 'Padrão'} ({selectedPurchase.paymentTermDays || 0} dias)
                  </span>
                </div>
              </div>

              {/* Tabela de Itens */}
              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Itens Comprados ({selectedPurchase.items?.length || 0})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Produto</th>
                        <th className="py-2.5 px-3 text-center">Qtd</th>
                        <th className="py-2.5 px-3 text-right">Custo Unit.</th>
                        <th className="py-2.5 px-3 text-right">Desc. %</th>
                        <th className="py-2.5 px-3 text-right">Total Item</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedPurchase.items || []).map((item: PurchaseItem, idx: number) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-800">{item.productName}</div>
                            {item.sku && <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitCostBeforeDiscount)}</td>
                          <td className="py-2.5 px-3 text-right">{item.discountPercentage || 0}%</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                            {formatCurrency(item.totalLine)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totais e Descontos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <span className="font-semibold text-slate-800 block">Observações / Anotações</span>
                  <p className="text-slate-600 text-xs italic">
                    {selectedPurchase.additionalNotes || 'Nenhuma observação informada.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Itens:</span>
                    <span className="font-semibold">{selectedPurchase.totalItems} unidades</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Desconto Aplicado:</span>
                    <span className="text-emerald-700 font-semibold">
                      - {formatCurrency(selectedPurchase.discountTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Impostos / Taxas:</span>
                    <span className="font-semibold">{formatCurrency(selectedPurchase.taxTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                    <span>Total Líquido da Compra:</span>
                    <span className="text-emerald-700">{formatCurrency(selectedPurchase.totalNetValue)}</span>
                  </div>
                </div>
              </div>

              {/* Pagamentos Registrados */}
              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Pagamentos Registrados ({selectedPurchase.payments?.length || 0})
                </h4>
                {(!selectedPurchase.payments || selectedPurchase.payments.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">Nenhum pagamento registrado nesta compra.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Data</th>
                          <th className="py-2 px-3">Método</th>
                          <th className="py-2 px-3">Observação</th>
                          <th className="py-2 px-3 text-right">Valor Pago</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPurchase.payments.map((p, idx) => (
                          <tr key={p.id || idx}>
                            <td className="py-2 px-3 text-slate-600">{formatDate(p.paidAt)}</td>
                            <td className="py-2 px-3 font-medium uppercase text-slate-800">{p.paymentMethod}</td>
                            <td className="py-2 px-3 text-slate-500">{p.paymentNote || '-'}</td>
                            <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                              {formatCurrency(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {purchaseToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-slate-900 text-base">Excluir Compra</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja excluir o registro de compra{' '}
                <span className="font-semibold text-slate-800 font-mono">
                  {purchaseToDelete.purchaseNumber}
                </span>
                ? Esta ação removerá o histórico e não poderá ser desfeita.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPurchaseToDelete(null)}
                disabled={Boolean(deletingId)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                {deletingId ? 'Excluindo...' : 'Sim, Excluir Compra'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
