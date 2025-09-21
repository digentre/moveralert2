import React, { useState } from 'react';
import { SearchFilters } from '../types';

interface SearchPanelProps {
  onSearch: (filters: SearchFilters) => void;
  loading: boolean;
  initialFilters: SearchFilters;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onSearch, loading, initialFilters }) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      daysWindow: 1,
      limit: 50,
      useMockData: true
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Search Filters</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Time Window */}
        <div>
          <label htmlFor="daysWindow" className="block text-sm font-medium text-gray-700 mb-1">
            Time Window
          </label>
          <select
            id="daysWindow"
            value={filters.daysWindow || 1}
            onChange={(e) => setFilters(prev => ({ ...prev, daysWindow: parseInt(e.target.value) }))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value={1}>Last 24 hours</option>
            <option value={3}>Last 3 days</option>
            <option value={7}>Last 7 days</option>
          </select>
        </div>

        {/* Region */}
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            Region
          </label>
          <select
            id="region"
            value={filters.region || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value || undefined }))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="">All UK</option>
            <option value="England">England</option>
            <option value="Scotland">Scotland</option>
            <option value="Wales">Wales</option>
            <option value="Northern Ireland">Northern Ireland</option>
          </select>
        </div>

        {/* County */}
        <div>
          <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-1">
            County (optional)
          </label>
          <input
            type="text"
            id="county"
            value={filters.county || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, county: e.target.value || undefined }))}
            placeholder="e.g., Yorkshire"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* Limit */}
        <div>
          <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
            Max Results
          </label>
          <select
            id="limit"
            value={filters.limit || 50}
            onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>

        {/* Development Options */}
        <div className="border-t pt-4">
          <div className="flex items-center">
            <input
              id="useMockData"
              type="checkbox"
              checked={filters.useMockData || false}
              onChange={(e) => setFilters(prev => ({ ...prev, useMockData: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="useMockData" className="ml-2 block text-sm text-gray-700">
              Use mock data (development)
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Filter Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Included Types</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Manufacturing (highest priority)</li>
          <li>• Industrial units & garage services</li>
          <li>• Hotels & guest houses</li>
          <li>• Construction (with energy meter)</li>
        </ul>

        <h3 className="text-sm font-medium text-gray-900 mt-3 mb-2">Excluded</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• High street shops</li>
          <li>• Chain establishments (5+ locations)</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchPanel;