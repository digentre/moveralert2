import React, { useState } from 'react';
import { Company } from '../types';

interface CompanyCardProps {
  company: Company;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onClick: () => void;
  onSuppress: (companyId: string, days: number, reason?: string) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  selected,
  onSelect,
  onClick,
  onSuppress
}) => {
  const [showActions, setShowActions] = useState(false);

  const primaryContact = company.contacts[0];
  const daysOld = Math.ceil((new Date().getTime() - new Date(company.move_in_date).getTime()) / (1000 * 60 * 60 * 24));
 
  const handleSuppress = (e: React.MouseEvent, reason: string, days: number) => {
    e.stopPropagation();
    onSuppress(company.company_id, days, reason);
    setShowActions(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLInputElement).type !== 'checkbox') {
      onClick();
    }
  };

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors relative"
      onClick={handleCardClick}
    >
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(e.target.checked);
          }}
          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                {company.company_name}
              </h3>

              <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                <span>Moved {daysOld} day{daysOld !== 1 ? 's' : ''} ago</span>
                <span>{company.premises_type}</span>
                {company.headcount && (
                  <span>{company.headcount} employees</span>
                )}
              </div>

              <div className="mt-2 text-sm text-gray-600">
                {company.address?.line1}, {company.address?.city} {company.address?.postcode}
              </div>

              {primaryContact && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>{primaryContact.first_name} {primaryContact.last_name}</strong>
                  {primaryContact.role && ` - ${primaryContact.role}`}
                  {primaryContact.email && (
                    <span className="block">{primaryContact.email}</span>
                  )}
                  {primaryContact.phone && (
                    <span className="block">{primaryContact.phone}</span>
                  )}
                </div>
              )}

              <div className="mt-2 flex items-center space-x-2">
                {company.meter_present && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Energy Meter
                  </span>
                )}
                {company.chain_flag && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Chain
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  Score: {company.score}
                </span>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1 rounded hover:bg-gray-200"
              >
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {showActions && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={(e) => handleSuppress(e, 'contacted', 90)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Mark as Contacted
                    </button>
                    <button
                      onClick={(e) => handleSuppress(e, 'not_interested', 30)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Hide for 30 days
                    </button>
                    <button
                      onClick={(e) => handleSuppress(e, 'do_not_contact', 3650)}
                      className="block px-4 py-2 text-sm text-red-700 hover:bg-gray-100 w-full text-left"
                    >
                      Do Not Contact
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close actions menu */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

export default CompanyCard;