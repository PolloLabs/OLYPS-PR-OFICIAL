import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Calendar,
  Percent,
  DollarSign,
  Hash,
  Layers,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import type {
  Coupon,
  CouponUsageRecord,
  SubscriptionPlan,
  ApiResponse,
} from '../../../types/index.js';

interface CouponDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
  availablePlans: SubscriptionPlan[];
  onEdit: (coupon: Coupon) => void;
}

function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(isoDate?: string | null): string {
  if (!isoDate) return 'Sem limite';
  try {
    return new Date(isoDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export const CouponDetailsModal: React.FC<CouponDetailsModalProps> = ({
  isOpen,
  onClose,
  coupon,
  availablePlans,
  onEdit,
}) => {
  const [usages, setUsages] = useState<CouponUsageRecord[]>([]);
  const [isLoadingUsages, setIsLoadingUsages] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'info' | 'usages'>('info');

  useEffect(() => {
    if (coupon && isOpen) {
      fetchUsages(coupon.id);
    } else {
      setUsages([]);
    }
  }, [coupon, isOpen]);

  const fetchUsages = async (couponId: string) => {
    setIsLoadingUsages(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/platform/coupons/${couponId}/usages`, { headers });
      if (res.ok) {
        const json: ApiResponse<CouponUsageRecord[]> = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setUsages(json.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingUsages(false);
    }
  };

  if (!isOpen || !coupon) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const usagePercent = coupon.maxUses
    ? Math.min(100, Math.round((coupon.usesCount / coupon.maxUses) * 100))
    : null;

  const applicablePlanNames =
    coupon.applicablePlanIds && coupon.applicablePlanIds.length > 0
      ? availablePlans
          .filter((p) => coupon.applicablePlanIds?.includes(p.id))
          .map((p) => p.name)
      : ['Todos os Planos da Plataforma'];

  const totalDiscountGeneratedCents = usages.reduce((acc, u) => acc + (u.discountCents || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        id="modal-coupon-details"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-mono font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded-lg tracking-wider">
                  {coupon.code}
                </span>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    coupon.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {coupon.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {coupon.name || 'Cupom Promocional OLYPS'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copiar código"
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs flex items-center gap-1 border border-slate-200"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Regras e Condições
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('usages')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'usages'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Histórico de Usos
            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-200 text-slate-700">
              {coupon.usesCount}
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {activeTab === 'info' ? (
            <>
              {/* Discount Highlight Card */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                    Benefício Concedido
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5 flex items-center gap-2">
                    {coupon.discountType === 'percentage' ? (
                      <>
                        <span>{coupon.discountValue}% OFF</span>
                        <span className="text-xs font-medium text-slate-500">sobre o valor do plano</span>
                      </>
                    ) : (
                      <>
                        <span>{formatCentsToBRL(coupon.discountValue >= 100 ? coupon.discountValue : coupon.discountValue * 100)} OFF</span>
                        <span className="text-xs font-medium text-slate-500">desconto fixo na fatura</span>
                      </>
                    )}
                  </div>
                  {coupon.description && (
                    <p className="text-xs text-slate-600 mt-1 max-w-md">{coupon.description}</p>
                  )}
                </div>
                <div className="p-3 bg-white shadow-sm border border-blue-100 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Tipo</span>
                  <span className="text-xs font-bold text-blue-700">
                    {coupon.discountType === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                  </span>
                </div>
              </div>

              {/* Usage Progress */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-slate-400" />
                    Utilizações Registradas
                  </span>
                  <span className="font-bold text-slate-900">
                    {coupon.usesCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : 'utilizações (Sem limite)'}
                  </span>
                </div>
                {coupon.maxUses && (
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (usagePercent || 0) >= 90
                          ? 'bg-rose-500'
                          : (usagePercent || 0) >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usagePercent || 0}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Validity Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Início da Vigência</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{formatDate(coupon.validFrom)}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Expiração do Cupom</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{formatDate(coupon.validUntil)}</span>
                  </div>
                </div>
              </div>

              {/* Applicable Plans */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Planos Comercializados Elegíveis
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {applicablePlanNames.map((planName, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 text-slate-800 rounded-lg shadow-2xs"
                    >
                      {planName}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Usages History Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Histórico de empresas que aplicaram este cupom em assinaturas:
                </p>
                {totalDiscountGeneratedCents > 0 && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Total Concedido: {formatCentsToBRL(totalDiscountGeneratedCents)}
                  </span>
                )}
              </div>

              {isLoadingUsages ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                  <span>Carregando histórico de usos...</span>
                </div>
              ) : usages.length === 0 ? (
                <div className="py-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">Nenhuma utilização registrada ainda.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Este cupom ainda não foi aplicado em contratações de planos.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Empresa</th>
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3 text-right">Valor Original</th>
                        <th className="py-2.5 px-3 text-right">Desconto</th>
                        <th className="py-2.5 px-3 text-right">Valor Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usages.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.companyName || 'Empresa Cliente'}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {new Date(u.appliedAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                            {formatCentsToBRL(u.originalPriceCents)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-600 font-bold font-mono">
                            - {formatCentsToBRL(u.discountCents)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-900 font-bold font-mono">
                            {formatCentsToBRL(u.finalPriceCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={() => onEdit(coupon)}
            className="px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100/70 border border-blue-200 rounded-xl transition-colors"
          >
            Editar Regras do Cupom
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
