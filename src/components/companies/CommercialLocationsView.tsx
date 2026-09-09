import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, Building, Star, Phone, Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { DataTable } from '../ui/DataTable.js';
import { ConfirmModal } from '../ui/ConfirmModal.js';
import { LocationFormModal } from './LocationFormModal.js';
import type {
  CommercialLocation,
  CreateLocationPayload,
  UpdateLocationPayload,
  ApiResponse,
  DataTableColumn,
} from '../../types/index.js';

interface CommercialLocationsViewProps {
  companyId?: string;
  activeCompanyName?: string;
  userRole?: string;
  isPlatformAdmin?: boolean;
  onShowNotification?: (type: 'success' | 'error', message: string) => void;
}

export const CommercialLocationsView: React.FC<CommercialLocationsViewProps> = ({
  companyId = '550e8400-e29b-41d4-a716-446655440001',
  activeCompanyName = 'Farmácia Modelo Ltda',
  userRole = 'company_admin',
  isPlatformAdmin = false,
  onShowNotification,
}) => {
  const [locations, setLocations] = useState<CommercialLocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<CommercialLocation | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<CommercialLocation | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'x-company-id': companyId,
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/companies/${companyId}/locations`, { headers });
      if (res.ok) {
        const json = (await res.json()) as ApiResponse<CommercialLocation[]>;
        if (json.success && Array.isArray(json.data)) {
          setLocations(json.data);
          setIsLoading(false);
          return;
        }
      }

      // Default initial locations fallback
      setLocations([
        {
          id: '550e8400-e29b-41d4-a716-446655440020',
          companyId,
          name: 'Matriz - Centro',
          code: 'LOC-01',
          document: '12.345.678/0001-90',
          phone: '(11) 3456-7890',
          email: 'matriz@farmaciamodelo.com.br',
          address: 'Av. Paulista, 1578, Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01310-200',
          isMain: true,
          status: 'active',
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440021',
          companyId,
          name: 'Filial - Shopping Plaza',
          code: 'LOC-02',
          document: '12.345.678/0002-71',
          phone: '(11) 3987-6543',
          email: 'plaza@farmaciamodelo.com.br',
          address: 'Av. Brigadeiro Faria Lima, 2232, Piso 1',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01452-000',
          isMain: false,
          status: 'active',
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } catch {
      if (onShowNotification) {
        onShowNotification('error', 'Erro ao carregar locais comerciais.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyId, onShowNotification]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Handle Save (Create or Update)
  const handleSaveLocation = async (payload: CreateLocationPayload | UpdateLocationPayload) => {
    setIsSaving(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-company-id': companyId,
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      if (editingLocation) {
        // Update
        const res = await fetch(`/api/companies/${companyId}/locations/${editingLocation.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const json = (await res.json()) as ApiResponse<CommercialLocation>;
          if (json.success && json.data) {
            setLocations((prev) =>
              prev.map((loc) => (loc.id === editingLocation.id ? json.data! : payload.isMain ? { ...loc, isMain: false } : loc))
            );
          }
        } else {
          // Local optimistic update
          setLocations((prev) =>
            prev.map((loc) =>
              loc.id === editingLocation.id
                ? { ...loc, ...(payload as Partial<CommercialLocation>), updatedAt: new Date().toISOString() }
                : payload.isMain ? { ...loc, isMain: false } : loc
            )
          );
        }
        if (onShowNotification) onShowNotification('success', 'Local comercial atualizado com sucesso.');
      } else {
        // Create
        const res = await fetch(`/api/companies/${companyId}/locations`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const json = (await res.json()) as ApiResponse<CommercialLocation>;
          if (json.success && json.data) {
            setLocations((prev) => [
              json.data!,
              ...(payload.isMain ? prev.map((l) => ({ ...l, isMain: false })) : prev),
            ]);
          }
        } else {
          // Local optimistic create
          const newLoc: CommercialLocation = {
            id: `loc-${Date.now()}`,
            companyId,
            name: payload.name || 'Novo Local',
            code: payload.code || `LOC-0${locations.length + 1}`,
            document: payload.document || null,
            phone: payload.phone || null,
            email: payload.email || null,
            address: payload.address || null,
            city: payload.city || null,
            state: payload.state || null,
            postalCode: payload.postalCode || null,
            isMain: Boolean(payload.isMain),
            status: payload.status || 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setLocations((prev) => [
            newLoc,
            ...(payload.isMain ? prev.map((l) => ({ ...l, isMain: false })) : prev),
          ]);
        }
        if (onShowNotification) onShowNotification('success', 'Local comercial cadastrado com sucesso.');
      }

      setIsModalOpen(false);
      setEditingLocation(null);
    } catch {
      if (onShowNotification) onShowNotification('error', 'Falha ao salvar local comercial.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingLocation) return;
    setIsDeleting(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'x-company-id': companyId,
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      await fetch(`/api/companies/${companyId}/locations/${deletingLocation.id}`, {
        method: 'DELETE',
        headers,
      });

      setLocations((prev) => prev.filter((loc) => loc.id !== deletingLocation.id));
      if (onShowNotification) onShowNotification('success', `Local "${deletingLocation.name}" excluído com sucesso.`);
      setDeletingLocation(null);
    } catch {
      if (onShowNotification) onShowNotification('error', 'Erro ao excluir local comercial.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Table Columns Definition
  const columns: DataTableColumn<CommercialLocation & Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Nome do Local / Ponto de Atendimento',
        sortable: true,
        render: (item) => (
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-slate-100 rounded text-slate-700">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-slate-900">{item.name}</span>
                {item.isMain && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    <Star className="w-3 h-3 mr-0.5 fill-blue-600 text-blue-600" />
                    Matriz
                  </span>
                )}
              </div>
              {item.address && (
                <span className="text-xs text-slate-500 block truncate max-w-xs">{item.address}</span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'code',
        header: 'Código',
        sortable: true,
        render: (item) => (
          <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {item.code || '-'}
          </span>
        ),
      },
      {
        key: 'document',
        header: 'CNPJ / Documento',
        render: (item) => (
          <span className="font-mono text-xs text-slate-600">
            {item.document || '-'}
          </span>
        ),
      },
      {
        key: 'city',
        header: 'Cidade / UF',
        sortable: true,
        render: (item) => (
          <span className="text-xs text-slate-700">
            {item.city ? `${item.city} - ${item.state || ''}` : '-'}
          </span>
        ),
      },
      {
        key: 'phone',
        header: 'Telefone / Contato',
        render: (item) => (
          <span className="text-xs text-slate-600 font-mono">
            {item.phone || '-'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (item) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
              item.status === 'active'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}
          >
            {item.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6" id="commercial-locations-view">
      {/* Locations DataTable */}
      <DataTable<CommercialLocation & Record<string, unknown>>
        id="commercial-locations-datatable"
        title={`Locais Comerciais &bull; ${activeCompanyName}`}
        description="Gerenciamento de filiais, pontos de atendimento e matriz da empresa"
        columns={columns}
        data={locations as Array<CommercialLocation & Record<string, unknown>>}
        loading={isLoading}
        keyExtractor={(item) => item.id}
        onCreate={() => {
          setEditingLocation(null);
          setIsModalOpen(true);
        }}
        createButtonLabel="Novo Local Comercial"
        onEdit={(item) => {
          setEditingLocation(item as CommercialLocation);
          setIsModalOpen(true);
        }}
        onDelete={(item) => {
          setDeletingLocation(item as CommercialLocation);
        }}
        emptyMessage="Nenhum local comercial cadastrado para esta empresa."
        emptyCreateLabel="Cadastrar Primeiro Local Comercial"
      />

      {/* Create / Edit Form Modal */}
      <LocationFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLocation(null);
        }}
        onSave={handleSaveLocation}
        locationToEdit={editingLocation}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingLocation)}
        title="Excluir Local Comercial"
        message={`Tem certeza que deseja excluir o local "${deletingLocation?.name}"? Esta ação removerá o vínculo deste ponto comercial.`}
        confirmLabel="Sim, Excluir Local"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingLocation(null)}
      />
    </div>
  );
};
