import { SearchFilters, SearchResponse, Company, SuppressionRecord } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://moveralert2.onrender.com';

class ApiService {
  async searchCompanies(filters: SearchFilters): Promise<SearchResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/movers/search?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getCompanyDetails(companyId: string, useMockData = false): Promise<Company> {
    const params = useMockData ? '?useMockData=true' : '';
    const response = await fetch(`${API_BASE_URL}/movers/${companyId}${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  async suppressCompany(companyId: string, days: number = 30, reason?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/movers/suppress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: companyId,
        days,
        reason
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async getSuppressionList(): Promise<SuppressionRecord[]> {
    const response = await fetch(`${API_BASE_URL}/movers/suppressed`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  async removeSuppressionByKey(key: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/movers/suppressed/${key}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async exportToCSV(companies: Company[]): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/movers/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companies }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async sendManualAlert(companies: Company[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/alerts/send-manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companies }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async getHealthStatus(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();