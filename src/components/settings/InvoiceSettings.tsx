import React, { useState, useEffect } from 'react';
import { setSoundEnabled } from '../../utils/sounds.js';

export interface InvoiceSettingsProps {
  companyId: string;
  onShowNotification?: (notification: {
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
  }) => void;
}

export const InvoiceSettings: React.FC<InvoiceSettingsProps> = ({ companyId, onShowNotification }) => {
  const [formData, setFormData] = useState({
    pixKey: 'financeiro@techstore.com.br',
    pixKeyType: 'email', // email, cpf, cnpj, telefone, aleatoria
    merchantName: 'TechStore Brasil Matriz',
    merchantCity: 'SAO PAULO',
    bankName: 'Banco Itaú',
    bankCode: '341',
    agency: '0452',
    account: '98765-4',
    accountType: 'corrente',
    soundEnabled: true,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Carregar configurações existentes
    fetch(`/api/companies/${companyId}/invoice-settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const config = data.data || data;
          setFormData((prev) => ({ ...prev, ...config }));
          if (config.soundEnabled !== undefined) {
            setSoundEnabled(Boolean(config.soundEnabled));
          }
        }
      })
      .catch((err) => console.error('Erro ao carregar configurações:', err));
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch(`/api/companies/${companyId}/invoice-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      // Atualiza também persistência de áudio no cliente
      setSoundEnabled(formData.soundEnabled);

      setSuccess(true);
      onShowNotification?.({
        type: 'success',
        message: 'Configurações salvas',
        description: 'Dados de fatura e PIX foram salvos com sucesso.',
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      onShowNotification?.({
        type: 'error',
        message: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações de fatura.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configurações de Fatura</h1>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          Configurações salvas com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Configurações PIX */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-600">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Configurações PIX</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave PIX:*
              </label>
              <input
                type="text"
                value={formData.pixKey}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                placeholder="email@exemplo.com ou CPF/CNPJ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Chave:*
              </label>
              <select
                value={formData.pixKeyType}
                onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="email">E-mail</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Chave Aleatória</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Beneficiário:*
              </label>
              <input
                type="text"
                value={formData.merchantName}
                onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                placeholder="Nome da empresa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade:*
              </label>
              <input
                type="text"
                value={formData.merchantCity}
                onChange={(e) => setFormData({ ...formData, merchantCity: e.target.value })}
                placeholder="SAO PAULO"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
        </div>

        {/* Dados Bancários */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-600">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Dados Bancários</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Banco:</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código do Banco:</label>
              <input
                type="text"
                value={formData.bankCode}
                onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agência:</label>
              <input
                type="text"
                value={formData.agency}
                onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conta:</label>
              <input
                type="text"
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Conta:</label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupança</option>
              </select>
            </div>
          </div>
        </div>

        {/* Configurações Gerais */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-600">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Configurações Gerais</h2>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.soundEnabled}
                onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-700">
              Som ativado no PDV
            </span>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceSettings;
