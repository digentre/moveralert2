import React, { useState, useEffect } from 'react';
import SearchPanel from './SearchPanel';
import CompanyList from './CompanyList';
import CompanyDetails from './CompanyDetails';
import Header from './Header';
import { Company, SearchFilters } from '../types';
import { apiService } from '../services/api';

const Dashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    daysWindow: 1,
    limit: 50,
    useMockData: true // Enable mock data for development
  });

  const handleSearch = async (searchFilters: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.searchCompanies(searchFilters);

      if (response.success) {
        setCompanies(response.data.companies);
        setFilters(searchFilters);
      } else {
        setError('Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setShowDetails(true);
  };

  const handleSuppress = async (companyId: string, days: number, reason?: string) => {
    try {
      await apiService.suppressCompany(companyId, days, reason);

      // Remove from current list
      setCompanies(prev => prev.filter(c => c.company_id !== companyId));

      // Close details if the suppressed company was selected
      if (selectedCompany?.company_id === companyId) {
        setShowDetails(false);
        setSelectedCompany(null);
      }
    } catch (err) {
      console.error('Failed to suppress company:', err);
      setError(err instanceof Error ? err.message : 'Failed to suppress company');
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvBlob = await apiService.exportToCSV(companies);
      const url = URL.createObjectURL(csvBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movers-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
    }
  };

  const copyToClipboard = async (companies: Company[]) => {
    try {
      const text = companies.map(company => {
        const emailFormat = (company as any).toEmailFormat ? (company as any).toEmailFormat() : company;
        return Object.values(emailFormat).join('\t');
      }).join('\n');

      await navigator.clipboard.writeText(text);
      alert('Companies copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy to clipboard');
    }
  };

  // Load initial data
  useEffect(() => {
    handleSearch(filters);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        totalCompanies={companies.length}
        onExportCSV={handleExportCSV}
        onRefresh={() => handleSearch(filters)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <SearchPanel
              onSearch={handleSearch}
              loading={loading}
              initialFilters={filters}
            />
          </div>

          {/* Company List */}
          <div className="lg:col-span-3">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <CompanyList
              companies={companies}
              loading={loading}
              onSelectCompany={handleCompanySelect}
              onSuppress={handleSuppress}
              onCopyToClipboard={copyToClipboard}
            />
          </div>
        </div>
      </div>

      {/* Company Details Drawer */}
      {showDetails && selectedCompany && (
        <CompanyDetails
          company={selectedCompany}
          onClose={() => setShowDetails(false)}
          onSuppress={handleSuppress}
        />
      )}
    </div>
  );
};

export default Dashboard;