import React from 'react';
import { X, Building, Users, MapPin, Mail, Phone, FileText, Star } from 'lucide-react';
import type { PlatformCompanyDetails, CompanyStatus } from '../../types/index.js';

interface CompanyDetailsModalProps {
  details: PlatformCompanyDetails | null;
  isLoading: boolean;
  onClose: () => void;
  onChangeStatusFromModal: (companyId: string, currentStatus: CompanyStatus) => void;
}

export const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({
  details,
  isLoading,
  onClose,
  onChangeStatusFromModal,
}) => {
  if (!details && !isLoading) return null;

  const getStatusBadge = (status?: CompanyStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Ativa
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Suspensa
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Pendente
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            Inativa
          </span>
        );
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="company-details-modal-container"
        className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              {details?.name || 'Detalhes da Empresa'}
            </h3>
          </div>
          <button
            id="close-details-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>Carregando dados da empresa...</span>
            </div>
          ) : details ? (
            <>
              {/* Core Information Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Informações Cadastrais & Fiscais
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-xs text-slate-500 block">Nome Fantasia</span>
                    <strong className="text-sm font-semibold text-slate-900">{details.name}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Razão Social</span>
                    <strong className="text-sm font-semibold text-slate-900">{details.legalName || 'Não informada'}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Documento (CNPJ/CPF)</span>
                    <span className="text-sm font-mono text-slate-800">{details.document || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Slug / Domínio</span>
                    <span className="text-sm font-mono text-slate-800">{details.slug}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Inscrição Estadual</span>
                    <span className="text-sm font-mono text-slate-800">{details.stateRegistration || 'ISENTO'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Regime Tributário</span>
                    <span className="text-xs font-semibold text-slate-800 uppercase">{details.taxRegime || 'Simples Nacional'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Status Operacional</span>
                    <div className="mt-1">{getStatusBadge(details.status)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Criada em</span>
                    <span className="text-xs text-slate-700">{formatDate(details.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Última Atualização</span>
                    <span className="text-xs text-slate-700">{formatDate(details.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Contact and Address Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Contatos e Localização Principal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-start space-x-2">
                    <Mail className="w-4 h-4 text-slate-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-500 block">E-mail</span>
                      <span className="text-xs font-medium text-slate-800">{details.email || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Phone className="w-4 h-4 text-slate-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-500 block">Telefone</span>
                      <span className="text-xs font-medium text-slate-800">{details.phone || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-start space-x-2 border-t border-slate-200/60 pt-3">
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-500 block">Endereço</span>
                      <span className="text-xs font-medium text-slate-800">
                        {details.address ? `${details.address}, ${details.city || ''} - ${details.state || ''} ${details.postalCode ? `(CEP: ${details.postalCode})` : ''}` : 'Não informado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commercial Locations Section */}
              {details.locations && details.locations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-600" />
                    Locais Comerciais ({details.locations.length})
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <th className="py-2 px-3">Nome do Local</th>
                          <th className="py-2 px-3">Código</th>
                          <th className="py-2 px-3">Cidade/UF</th>
                          <th className="py-2 px-3">Tipo</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {details.locations.map((loc) => (
                          <tr key={loc.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-900">{loc.name}</td>
                            <td className="py-2 px-3 font-mono text-slate-700">{loc.code || '-'}</td>
                            <td className="py-2 px-3 text-slate-700">{loc.city ? `${loc.city}/${loc.state || ''}` : '-'}</td>
                            <td className="py-2 px-3">
                              {loc.isMain ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                  <Star className="w-3 h-3 mr-0.5 fill-blue-600 text-blue-600" />
                                  Matriz
                                </span>
                              ) : (
                                <span className="text-slate-500">Filial</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                  loc.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {loc.status === 'active' ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Associated Members Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1" />
                    Membros Vinculados ({details.memberCount})
                  </h4>
                </div>

                {details.members.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                    Nenhum usuário vinculado a esta empresa no momento.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <th className="py-2 px-3">Usuário ID</th>
                          <th className="py-2 px-3">Papel</th>
                          <th className="py-2 px-3">Status Vínculo</th>
                          <th className="py-2 px-3">Entrada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {details.members.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono text-slate-700">{member.userId}</td>
                            <td className="py-2 px-3 font-medium text-slate-900 capitalize">{member.role}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                  member.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {member.status === 'active' ? 'Ativo' : member.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{formatDate(member.joinedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {details && (
            <button
              id="btn-modal-change-status"
              type="button"
              onClick={() => {
                onChangeStatusFromModal(details.id, details.status);
              }}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-xs"
            >
              Alterar Status da Empresa
            </button>
          )}
          <button
            id="btn-close-details-modal"
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex items-center px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
