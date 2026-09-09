import { useState, useEffect } from 'react';
import type { ProductBrand, JobSheetFormState, NewJobSheetData } from '../../types/repair.types.js';

export function useNewJobSheet(companyId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<ProductBrand[]>([]);

  // Estado do formulário
  const [formData, setFormData] = useState<JobSheetFormState>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerDocument: '',
    deviceType: 'Smartphone',
    brandId: '',
    brandName: '',
    model: '',
    serialNumber: '',
    color: '',
    devicePassword: '',
    accessories: '',
    reportedDefect: '',
    technicalDiagnosis: '',
    responsibleTechnician: '',
    priority: 'normal',
    finalValue: 0,
    statusId: '',
    notes: '',
  });

  // Carregar marcas de produtos integradas
  useEffect(() => {
    let isMounted = true;
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/companies/${companyId}/repairs/brands`, {
          headers: {
            'Content-Type': 'application/json',
            'x-company-id': companyId,
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            if (isMounted) setBrands(json.data);
            return;
          }
        }

        // Fallback: marcas padrão se a API retornar vazio ou falhar
        const mockBrands: ProductBrand[] = [
          { id: '1', name: 'Samsung', status: 'active', active: true, createdAt: new Date(), updatedAt: new Date() },
          { id: '2', name: 'Apple', status: 'active', active: true, createdAt: new Date(), updatedAt: new Date() },
          { id: '3', name: 'Motorola', status: 'active', active: true, createdAt: new Date(), updatedAt: new Date() },
          { id: '4', name: 'Xiaomi', status: 'active', active: true, createdAt: new Date(), updatedAt: new Date() },
          { id: '5', name: 'LG', status: 'active', active: true, createdAt: new Date(), updatedAt: new Date() },
          { id: '6', name: 'Lenovo', status: 'active', active: true, createdAt: new Date(), updatedAt: new Date() },
        ];
        if (isMounted) setBrands(mockBrands);
      } catch (err) {
        if (isMounted) {
          setError('Erro ao carregar marcas: ' + (err as Error).message);
          // Mesmo com erro de rede, garante fallback operacional
          const mockBrands: ProductBrand[] = [
            { id: '1', name: 'Samsung', status: 'active', active: true, createdAt: new Date(), updatedAt: new Date() },
            { id: '2', name: 'Apple', status: 'active', active: true, createdAt: new Date(), updatedAt: new Date() },
            { id: '3', name: 'Motorola', status: 'active', active: true, createdAt: new Date(), updatedAt: new Date() },
            { id: '4', name: 'Xiaomi', status: 'active', active: true, createdAt: new Date(), updatedAt: new Date() },
            { id: '5', name: 'LG', status: 'active', active: true, createdAt: new Date(), updatedAt: new Date() },
            { id: '6', name: 'Lenovo', status: 'active', active: true, createdAt: new Date(), updatedAt: new Date() },
          ];
          setBrands(mockBrands);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (companyId) {
      fetchBrands();
    }

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  // Handlers do formulário
  const handleInputChange = (field: keyof JobSheetFormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBrandSelect = (brandId: string, brandName: string) => {
    setFormData((prev) => ({
      ...prev,
      brandId,
      brandName: brandName || prev.brandName,
    }));
  };

  // Submit da OS
  const submitJobSheet = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Validações obrigatórias
      if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
        throw new Error('Nome e telefone do cliente são obrigatórios');
      }

      if (!formData.brandId && !formData.brandName.trim()) {
        throw new Error('Marca é obrigatória');
      }

      if (!formData.model.trim()) {
        throw new Error('Modelo é obrigatório');
      }

      if (!formData.reportedDefect.trim()) {
        throw new Error('Defeito relatado é obrigatório');
      }

      // Preparar payload
      const payload: NewJobSheetData = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail?.trim(),
        customerDocument: formData.customerDocument?.trim(),
        deviceType: formData.deviceType,
        brandId: formData.brandId,
        brandName: formData.brandName.trim(),
        model: formData.model.trim(),
        serialNumber: formData.serialNumber?.trim(),
        color: formData.color?.trim(),
        devicePassword: formData.devicePassword?.trim(),
        accessories: formData.accessories?.trim(),
        reportedDefect: formData.reportedDefect.trim(),
        technicalDiagnosis: formData.technicalDiagnosis?.trim(),
        responsibleTechnician: formData.responsibleTechnician?.trim(),
        priority: formData.priority,
        finalValue: Number(formData.finalValue) || 0,
        statusId: formData.statusId || 'pending',
        notes: formData.notes?.trim(),
        companyId,
      };

      const response = await fetch(`/api/companies/${companyId}/repairs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-company-id': companyId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Erro ao cadastrar ordem de serviço');
      }

      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reset formulário
  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerDocument: '',
      deviceType: 'Smartphone',
      brandId: '',
      brandName: '',
      model: '',
      serialNumber: '',
      color: '',
      devicePassword: '',
      accessories: '',
      reportedDefect: '',
      technicalDiagnosis: '',
      responsibleTechnician: '',
      priority: 'normal',
      finalValue: 0,
      statusId: '',
      notes: '',
    });
    setError(null);
  };

  return {
    loading,
    error,
    brands,
    formData,
    handleInputChange,
    handleBrandSelect,
    submitJobSheet,
    resetForm,
    setFormData,
  };
}
