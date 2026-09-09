import type { UUID } from '../../types/index.js';
import type { RepairBrand, BrandFormData } from '../../types/repair.types.js';
import { ProductService } from './productService.js';

// Local storage for repair-created brands & metadata (such as category)
const repairBrandsStore = new Map<string, RepairBrand>();

export class RepairBrandService {
  /**
   * Buscar todas as marcas sincronizadas (Produtos + Reparar)
   */
  public static async getBrands(companyId: string): Promise<RepairBrand[]> {
    const defaultBrands: RepairBrand[] = [
      {
        id: '1',
        name: 'Samsung',
        description: 'Marca Samsung',
        category: 'Eletrônicos',
        status: 'active',
        syncedFromProducts: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Apple',
        description: 'Marca Apple',
        category: 'Eletrônicos',
        status: 'active',
        syncedFromProducts: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Motorola',
        description: 'Marca Motorola',
        category: 'Eletrônicos',
        status: 'active',
        syncedFromProducts: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        name: 'Xiaomi',
        description: 'Marca Xiaomi',
        category: 'Eletrônicos',
        status: 'active',
        syncedFromProducts: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '5',
        name: 'LG',
        description: 'Marca LG',
        category: 'Eletrônicos',
        status: 'active',
        syncedFromProducts: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '6',
        name: 'Lenovo',
        description: 'Marca Lenovo',
        category: 'Eletrônicos',
        status: 'active',
        syncedFromProducts: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    try {
      const productBrands = await ProductService.listBrands(companyId as UUID);
      const productBrandsMap = new Map<string, RepairBrand>();

      if (productBrands && productBrands.length > 0) {
        for (const pb of productBrands) {
          const stored = repairBrandsStore.get(pb.id);
          productBrandsMap.set(pb.id, {
            id: pb.id,
            name: pb.name,
            description: pb.description || stored?.description || '',
            category: stored?.category || 'Eletrônicos',
            status: pb.active ? 'active' : 'inactive',
            syncedFromProducts: true,
            createdAt: pb.createdAt ? new Date(pb.createdAt) : new Date(),
            updatedAt: pb.updatedAt ? new Date(pb.updatedAt) : new Date(),
          });
        }
      } else {
        for (const db of defaultBrands) {
          productBrandsMap.set(db.id, db);
        }
      }

      // Adicionar marcas criadas exclusivamente em Reparar
      const repairOnlyBrands: RepairBrand[] = [];
      for (const [id, rBrand] of repairBrandsStore.entries()) {
        if (!productBrandsMap.has(id)) {
          repairOnlyBrands.push(rBrand);
        }
      }

      return [...Array.from(productBrandsMap.values()), ...repairOnlyBrands];
    } catch (err) {
      console.warn('[RepairBrandService] Falha ao carregar do ProductService, usando fallback:', err);
      const repairOnlyBrands = Array.from(repairBrandsStore.values());
      return [...defaultBrands, ...repairOnlyBrands];
    }
  }

  /**
   * Criar marca em Reparar e sincronizar com Produtos
   */
  public static async createBrand(companyId: string, data: BrandFormData): Promise<RepairBrand> {
    if (!data.name || !data.name.trim()) {
      throw new Error('Nome da marca é obrigatório');
    }

    const trimmedName = data.name.trim();

    // 1. Criar ou sincronizar com o Módulo de Produtos
    let createdProductBrandId = '';
    try {
      const pBrand = await ProductService.createBrand(companyId as UUID, {
        name: trimmedName,
        description: data.description || null,
        active: data.status === 'active',
      });
      createdProductBrandId = pBrand.id;
    } catch (err) {
      console.warn('[RepairBrandService] Erro ao sincronizar com ProductService:', err);
    }

    const brandId = createdProductBrandId || crypto.randomUUID();

    const newBrand: RepairBrand = {
      id: brandId,
      name: trimmedName,
      description: data.description || '',
      category: data.category || 'Eletrônicos',
      status: data.status || 'active',
      syncedFromProducts: false, // Criada originalmente pelo módulo Reparar
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    repairBrandsStore.set(brandId, newBrand);
    return newBrand;
  }

  /**
   * Atualizar marca
   */
  public static async updateBrand(
    companyId: string,
    brandId: string,
    data: Partial<BrandFormData>
  ): Promise<RepairBrand> {
    let existing = repairBrandsStore.get(brandId);

    // Se não estiver no store local, procurar no catálogo de produtos
    if (!existing) {
      const productBrands = await ProductService.listBrands(companyId as UUID);
      const found = productBrands.find((b) => b.id === brandId);
      if (found) {
        existing = {
          id: found.id,
          name: found.name,
          description: found.description || '',
          category: 'Eletrônicos',
          status: found.active ? 'active' : 'inactive',
          syncedFromProducts: true,
          createdAt: new Date(found.createdAt),
          updatedAt: new Date(found.updatedAt),
        };
      }
    }

    if (!existing) {
      throw new Error('Marca não encontrada');
    }

    const updated: RepairBrand = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      category: data.category !== undefined ? data.category : existing.category,
      status: data.status !== undefined ? data.status : existing.status,
      updatedAt: new Date(),
    };

    // Sincronizar atualização no ProductService se aplicável
    try {
      await ProductService.updateBrand(companyId as UUID, brandId as UUID, {
        name: updated.name,
        description: updated.description || null,
        active: updated.status === 'active',
      });
    } catch {
      // Se não existir no ProductService, prossegue com store local
    }

    repairBrandsStore.set(brandId, updated);
    return updated;
  }

  /**
   * Excluir marca (apenas se não for sincronizada de Produtos)
   */
  public static async deleteBrand(companyId: string, brandId: string): Promise<boolean> {
    const existing = repairBrandsStore.get(brandId);

    // Se for uma marca vinda de Produtos
    if (!existing) {
      const productBrands = await ProductService.listBrands(companyId as UUID);
      const found = productBrands.find((b) => b.id === brandId);
      if (found) {
        throw new Error('Não é possível excluir marcas sincronizadas de Produtos. Exclua no módulo de Produtos.');
      }
      throw new Error('Marca não encontrada');
    }

    if (existing.syncedFromProducts) {
      throw new Error('Não é possível excluir marcas sincronizadas de Produtos. Exclua no módulo de Produtos.');
    }

    repairBrandsStore.delete(brandId);

    // Se tiver espelho em Produtos, tentar remover também
    try {
      await ProductService.deleteBrand(companyId as UUID, brandId as UUID);
    } catch {
      // Ignora erro se já não existir
    }

    return true;
  }
}
