export interface Company {
  company_id: string;
  company_name: string;
  move_in_date: string;
  premises_type: string;
  sic_codes: string[];
  sic_description: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  headcount: number;
  meter_present: boolean;
  chain_flag: boolean;
  group_ownership?: {
    location_count: number;
    brand_name: string;
  };
  contacts: Contact[];
  website?: string;
  additional_phones: string[];
  data_source: string;
  score: number;
  category: string;
}

export interface Contact {
  first_name: string;
  last_name: string;
  role?: string;
  email?: string;
  phone?: string;
}

export interface SearchFilters {
  fromDate?: string;
  toDate?: string;
  daysWindow?: number;
  region?: string;
  county?: string;
  limit?: number;
  useMockData?: boolean;
}

export interface SearchResponse {
  success: boolean;
  data: {
    companies: Company[];
    groups: Record<string, Company[]>;
    total: number;
    filters: SearchFilters;
    timestamp: string;
  };
}

export interface EmailFormatCompany {
  company_name: string;
  move_in_date: string;
  premises_type: string;
  sector_sic: string;
  headcount_band: string;
  contact_person: string;
  contact_role: string;
  phone: string;
  email: string;
  full_address: string;
  website: string;
  meter_present: string;
  chain_flag: string;
  data_source: string;
  category: string;
}

export interface PricingTier {
  name: string;
  dailyLeadLimit: number;
  frequency: 'daily' | 'hourly';
  price?: string;
}

export interface SuppressionRecord {
  company_id: string;
  company_name: string;
  suppressedAt: string;
  expiresAt: string;
  reason: string;
}