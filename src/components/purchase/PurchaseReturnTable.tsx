import React, { useState } from 'react';
import {
  RotateCcw,
  Eye,
  Trash2,
  Calendar,
  Building2,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  FileText,
} from 'lucide-react';
import type { PurchaseReturnRecord, PurchaseReturnItem } from '../../types/purchase.types.js';

interface PurchaseReturnTableProps {
  returns: PurchaseReturnRecord[];
  isLoading: boolean;
  onDelete: (returnId: string) => Promise<void>;
  onOpenCreateModal?: () => void;
}

export const PurchaseReturnTable: React.FC<PurchaseReturnTableProps> = ({
  returns,
  isLoading,
  onDelete,
  onOpenCreateModal,
}) => {
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturnRecord | null>(null);
  const [returnToDelete, setReturnToDelete] = useState<PurchaseReturnRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  const formatDate = (dateInput: Date | string) => {
    if (!dateInput) return '-';
    try {
      const d = new Date(dateInput);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return String(dateInput);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Concluído
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3 h-3" />
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const handleConfirmDelete = async () => {
    if (!returnToDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(returnToDelete.id);
      setReturnToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-amber-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Carregando devoluções de compras...</p>
      </div>
    );
  }

  if (returns.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <RotateCcw className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">Nenhum retorno de compra registrado</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          Nenhuma devolução corresponde aos filtros aplicados ou não há devoluções cadastradas nesta empresa.
        </p>
        {onOpenCreateModal && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
          >
            Registrar Nova Devolução
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
              <th className="py-3.5 px-4">Número Retorno</th>
              <th className="py-3.5 px-4">Data</th>
              <th className="py-3.5 px-4">Compra de Origem</th>
              <th className="py-3.5 px-4">Fornecedor</th>
              <th className="py-3.5 px-4 text-center">Itens</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Valor Estornado</th>
              <th className="py-3.5 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {returns.map((ret) => {
              const totalItems = (ret.items || []).reduce((acc, i) => acc + (Number(i.quantityReturned) || 0), 0);
              return (
                <tr key={ret.id} className="hover:bg-slate-50/75 transition-colors">
                  {/* Número Retorno */}
                  <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    <span className="font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                      {ret.returnNumber}
                    </span>
                  </td>

                  {/* Data */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(ret.returnDate)}
                    </div>
                  </td>

                  {/* Compra de Origem */}
                  <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {ret.purchaseNumber || 'Compra Avulsa'}
                  </td>

                  {/* Fornecedor */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-medium text-slate-900 truncate">
                      {ret.supplierName || 'Fornecedor'}
                    </div>
                  </td>

                  {/* Itens */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap font-medium text-slate-800">
                    {totalItems} unid.
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(ret.status)}
                  </td>

                  {/* Valor Estornado */}
                  <td className="py-3.5 px-4 text-right font-semibold text-amber-800 whitespace-nowrap">
                    {formatCurrency(ret.totalRefundAmount)}
                  </td>

                  {/* Ações */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedReturn(ret)}
                        title="Ver detalhes da devolução"
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setReturnToDelete(ret)}
                        title="Excluir retorno"
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

      {/* Modal de Detalhes da Devolução */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Devolução {selectedReturn.returnNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Compra vinculada: {selectedReturn.purchaseNumber || 'N/A'} &bull; Realizada em {formatDate(selectedReturn.returnDate)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Fornecedor</span>
                  <span className="font-semibold text-slate-900">{selectedReturn.supplierName || 'Não especificado'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedReturn.status)}</div>
                </div>
              </div>

              {/* Tabela de Itens Devolvidos */}
              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  Mercadorias Devolvidas
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Produto</th>
                        <th className="py-2.5 px-3 text-center">Qtd</th>
                        <th className="py-2.5 px-3">Motivo</th>
                        <th className="py-2.5 px-3 text-right">Estorno</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedReturn.items || []).map((item: PurchaseReturnItem, idx: number) => (
                        <tr key={item.id || idx}>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {item.productName}
                            {item.sku && <span className="text-[10px] text-slate-400 block font-mono">SKU: {item.sku}</span>}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold">{item.quantityReturned}</td>
                          <td className="py-2.5 px-3 text-slate-500 italic">{item.reason || 'Sem motivo registrado'}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-amber-800">
                            {formatCurrency(item.totalRefund)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Observações e Total */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="text-slate-600">
                  <span className="font-semibold block mb-1">Observações da Devolução:</span>
                  <p className="italic">{selectedReturn.notes || 'Sem observações adicionais.'}</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 font-bold text-sm">
                  <span className="text-slate-800">Valor Total do Estorno:</span>
                  <span className="text-amber-700">{formatCurrency(selectedReturn.totalRefundAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {returnToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-slate-900 text-base">Excluir Registro de Devolução</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja excluir o retorno{' '}
                <span className="font-semibold text-slate-800 font-mono">
                  {returnToDelete.returnNumber}
                </span>
                ?
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReturnToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
