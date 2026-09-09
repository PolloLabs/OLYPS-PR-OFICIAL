import React, { useState } from 'react';
import { useSellList } from '../../hooks/sell/useSellList.js';
import { SellFilters } from './SellFilters.js';
import { SellTable } from './SellTable.js';
import { SellDetailModal } from './SellDetailModal.js';
import type { SellRecord } from '../../types/sell.types.js';

interface SellListProps {
  companyId: string;
  onNavigateToAdd?: () => void;
  onShowNotification?: (n: {
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
  }) => void;
}

export const SellList: React.FC<SellListProps> = ({
  companyId,
  onNavigateToAdd,
  onShowNotification,
}) => {
  const {
    filteredSells,
    paginatedSells,
    isLoading,
    filters,
    updateFilters,
    resetFilters,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalEntries,
    totals,
    deleteSell,
  } = useSellList(companyId, onShowNotification);

  const [selectedSell, setSelectedSell] = useState<SellRecord | null>(null);

  return (
    <div id="sell-list-container" className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 1. SEÇÃO DE FILTROS */}
      <SellFilters
        filters={filters}
        onFilterChange={updateFilters}
        onReset={resetFilters}
      />

      {/* 2. SEÇÃO DA TABELA */}
      <SellTable
        sells={paginatedSells}
        totalEntries={totalEntries}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totals={totals}
        searchTerm={filters.searchTerm}
        onSearchChange={(val) => updateFilters({ searchTerm: val })}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onAddClick={() => {
          if (onNavigateToAdd) {
            onNavigateToAdd();
          } else {
            window.location.hash = '#/sells/create';
          }
        }}
        onViewSell={(sell) => setSelectedSell(sell)}
        onDeleteSell={deleteSell}
      />

      {/* Modal de Detalhes da Venda */}
      {selectedSell && (
        <SellDetailModal
          sell={selectedSell}
          onClose={() => setSelectedSell(null)}
        />
      )}
    </div>
  );
};
