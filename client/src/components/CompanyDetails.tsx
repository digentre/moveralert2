import React from 'react';
import { Company } from '../types';

interface CompanyDetailsProps {
  company: Company;
  onClose: () => void;
  onSuppress: (companyId: string, days: number, reason?: string) => void;
}

const CompanyDetails: React.FC<CompanyDetailsProps> = ({ company, onClose, onSuppress }) => {
  const handleSuppress = (reason: string, days: number) => {
    onSuppress(company.company_id, days, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col py-6 bg-white shadow-xl overflow-y-scroll">
              <div className="px-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Company Details</h2>
                  <div className="ml-3 h-7 flex items-center">
                    <button
                      onClick={onClose}
                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <span className="sr-only">Close panel</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 relative flex-1 px-4 sm:px-6">
                <div className="space-y-6">
                  {/* Company Info */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">{company.company_name}</h3>

                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Move-in Date:</span>
                        <p className="text-sm text-gray-900">{company.move_in_date}</p>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500">Premises Type:</span>
                        <p className="text-sm text-gray-900">{company.premises_type}</p>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500">Business Sector:</span>
                        <p className="text-sm text-gray-900">{company.sic_description}</p>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500">SIC Codes:</span>
                        <p className="text-sm text-gray-900">{company.sic_codes.join(', ')}</p>
                      </div>

                      {company.headcount && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Employees:</span>
                          <p className="text-sm text-gray-900">{company.headcount}</p>
                        </div>
                      )}

                      <div>
                        <span className="text-sm font-medium text-gray-500">Category:</span>
                        <p className="text-sm text-gray-900">{company.category}</p>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500">Score:</span>
                        <p className="text-sm text-gray-900">{company.score}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Address</h4>
                    <div className="text-sm text-gray-700">
                      <p>{company.address.line1}</p>
                      {company.address.line2 && <p>{company.address.line2}</p>}
                      <p>{company.address.city}</p>
                      <p>{company.address.postcode}</p>
                      <p>{company.address.country}</p>
                    </div>
                  </div>

                  {/* Contacts */}
                  {company.contacts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Contacts</h4>
                      <div className="space-y-3">
                        {company.contacts.map((contact, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-900">
                              {contact.first_name} {contact.last_name}
                            </p>
                            {contact.role && (
                              <p className="text-sm text-gray-600">{contact.role}</p>
                            )}
                            {contact.email && (
                              <p className="text-sm text-gray-600">
                                <a href={`mailto:${contact.email}`} className="text-primary-600 hover:text-primary-500">
                                  {contact.email}
                                </a>
                              </p>
                            )}
                            {contact.phone && (
                              <p className="text-sm text-gray-600">
                                <a href={`tel:${contact.phone}`} className="text-primary-600 hover:text-primary-500">
                                  {contact.phone}
                                </a>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Phones */}
                  {company.additional_phones.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Phones</h4>
                      <div className="space-y-1">
                        {company.additional_phones.map((phone, index) => (
                          <p key={index} className="text-sm text-gray-600">
                            <a href={`tel:${phone}`} className="text-primary-600 hover:text-primary-500">
                              {phone}
                            </a>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {company.website && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Website</h4>
                      <p className="text-sm">
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-500"
                        >
                          {company.website}
                        </a>
                      </p>
                    </div>
                  )}

                  {/* Flags */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Flags</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600">Energy Meter Present:</span>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          company.meter_present ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {company.meter_present ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600">Chain:</span>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          company.chain_flag ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {company.chain_flag ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Data Source */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Data Source</h4>
                    <p className="text-sm text-gray-600">{company.data_source}</p>
                  </div>

                  {/* Actions */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Actions</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleSuppress('contacted', 90)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Mark as Contacted (90 days)
                      </button>
                      <button
                        onClick={() => handleSuppress('not_interested', 30)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Hide for 30 days
                      </button>
                      <button
                        onClick={() => handleSuppress('do_not_contact', 3650)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                      >
                        Do Not Contact (10 years)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CompanyDetails;