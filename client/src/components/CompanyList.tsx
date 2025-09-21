import React, { useState } from 'react';
import { Company } from '../types';
import CompanyCard from './CompanyCard';

interface CompanyListProps {
  companies: Company[];
  loading: boolean;
  onSelectCompany: (company: Company) => void;
  onSuppress: (companyId: string, days: number, reason?: string) => void;
  onCopyToClipboard: (companies: Company[]) => void;
}

const CompanyList: React.FC<CompanyListProps> = ({
  companies,
  loading,
  onSelectCompany,
  onSuppress,
  onCopyToClipboard
}) => {
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(new Set(companies.map(c => c.company_id)));
    } else {
      setSelectedCompanies(new Set());
    }
  };

  const handleSelectCompany = (companyId: string, checked: boolean) => {
    const newSelected = new Set(selectedCompanies);
    if (checked) {
      newSelected.add(companyId);
    } else {
      newSelected.delete(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  const handleCopySelected = () => {
    const selected = companies.filter(c => selectedCompanies.has(c.company_id));
    onCopyToClipboard(selected);
  };

  const groupedCompanies = companies.reduce((groups, company) => {
    const category = company.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(company);
    return groups;
  }, {} as Record<string, Company[]>);

  const categoryOrder = [
    'Manufacturing',
    'Industrial',
    'Garage Service',
    'Hotel/Guest House',
    'Construction (with meter)',
    'Other'
  ];

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Manufacturing':
        return 'bg-red-100 text-red-800';
      case 'Industrial':
        return 'bg-orange-100 text-orange-800';
      case 'Garage Service':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hotel/Guest House':
        return 'bg-green-100 text-green-800';
      case 'Construction (with meter)':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No companies found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search filters or time window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with bulk actions */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedCompanies.size === companies.length && companies.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-3 text-sm font-medium text-gray-900">
              {selectedCompanies.size > 0
                ? `${selectedCompanies.size} selected`
                : `${companies.length} companies`}
            </label>
          </div>

          {selectedCompanies.size > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={handleCopySelected}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Company list by category */}
      <div className="divide-y divide-gray-200">
        {categoryOrder.map(category => {
          const categoryCompanies = groupedCompanies[category];
          if (!categoryCompanies || categoryCompanies.length === 0) return null;

          return (
            <div key={category} className="p-6">
              <div className="flex items-center mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(category)}`}>
                  {category}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  {categoryCompanies.length} companies
                </span>
              </div>

              <div className="space-y-3">
                {categoryCompanies.map((company) => (
                  <CompanyCard
                    key={company.company_id}
                    company={company}
                    selected={selectedCompanies.has(company.company_id)}
                    onSelect={(checked) => handleSelectCompany(company.company_id, checked)}
                    onClick={() => onSelectCompany(company)}
                    onSuppress={onSuppress}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompanyList;