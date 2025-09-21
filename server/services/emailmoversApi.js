const axios = require('axios');
const moment = require('moment-timezone');

class EmailmoversApi {
  constructor() {
    this.baseUrl = process.env.EMAILMOVERS_BASE_URL || 'https://api.emailmovers.com/v1';
    this.apiKey = process.env.EMAILMOVERS_API_KEY;

    if (!this.apiKey) {
      console.warn('EMAILMOVERS_API_KEY not found in environment variables');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Request/response logging with PII redaction
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  async getRecentMovers(filters = {}) {
    try {
      const params = {
        country: 'UK',
        from_date: filters.fromDate || moment().tz('Europe/London').subtract(1, 'days').format('YYYY-MM-DD'),
        to_date: filters.toDate || moment().tz('Europe/London').format('YYYY-MM-DD'),
        ...filters
      };

      const response = await this.retryWithBackoff(
        () => this.client.get('/recent-movers', { params })
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching recent movers:', error.message);
      throw new Error(`Failed to fetch recent movers: ${error.message}`);
    }
  }

  async getCompanyDetails(companyId) {
    try {
      const response = await this.retryWithBackoff(
        () => this.client.get(`/company/${companyId}`)
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching company ${companyId}:`, error.message);
      throw new Error(`Failed to fetch company details: ${error.message}`);
    }
  }

  async getChainsList() {
    try {
      const response = await this.retryWithBackoff(
        () => this.client.get('/chains/list')
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching chains list:', error.message);
      throw new Error(`Failed to fetch chains list: ${error.message}`);
    }
  }

  async retryWithBackoff(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;

        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Retry ${i + 1}/${retries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Mock data for development/sandbox mode
  getMockRecentMovers() {
    return {
      data: [
        {
          company_id: 'mock_001',
          company_name: 'Advanced Manufacturing Ltd',
          move_in_date: moment().tz('Europe/London').subtract(1, 'days').format('YYYY-MM-DD'),
          premises_type: 'Industrial Unit',
          sic_codes: ['25110', '25290'],
          sic_description: 'Manufacture of metal structures',
          address: {
            line1: '123 Industrial Estate',
            line2: 'Manufacturing District',
            city: 'Birmingham',
            postcode: 'B1 1AA',
            country: 'UK'
          },
          headcount: 45,
          meter_present: true,
          chain_flag: false,
          group_ownership: null
        },
        {
          company_id: 'mock_002',
          company_name: 'Precision Parts Manufacturing',
          move_in_date: moment().tz('Europe/London').subtract(2, 'days').format('YYYY-MM-DD'),
          premises_type: 'Manufacturing Facility',
          sic_codes: ['28110'],
          sic_description: 'Manufacture of engines and turbines',
          address: {
            line1: '456 Factory Road',
            city: 'Manchester',
            postcode: 'M1 2BB',
            country: 'UK'
          },
          headcount: 78,
          meter_present: true,
          chain_flag: false,
          group_ownership: null
        }
      ],
      total: 2,
      page: 1,
      limit: 50
    };
  }

  getMockCompanyDetails(companyId) {
    return {
      company_id: companyId,
      contacts: [
        {
          first_name: 'John',
          last_name: 'Smith',
          role: 'Operations Director',
          email: 'j.smith@company.com',
          phone: '+44 121 123 4567'
        }
      ],
      website: 'https://www.company.com',
      additional_phones: ['+44 121 123 4500'],
      data_source: 'Emailmovers'
    };
  }

  getMockChainsList() {
    return {
      chains: [
        'McDonald\'s',
        'Tesco',
        'Sainsbury\'s',
        'ASDA',
        'Costa Coffee',
        'Starbucks',
        'Boots',
        'Superdrug'
      ]
    };
  }
}

module.exports = EmailmoversApi;