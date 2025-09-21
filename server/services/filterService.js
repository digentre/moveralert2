const moment = require('moment-timezone');
const Company = require('../models/Company');

class FilterService {
  constructor() {
    this.suppressedCompanies = new Map(); // In-memory storage for demo
  }

  async filterAndScoreCompanies(rawCompanies, filters = {}) {
    const companies = rawCompanies.map(data => Company.fromApiResponse(data));

    // Apply filters
    let filteredCompanies = companies
      .filter(company => this.passesQualityGates(company))
      .filter(company => this.passesTimeWindow(company, filters))
      .filter(company => this.passesBusinessTypeFilter(company))
      .filter(company => !this.isExcluded(company))
      .filter(company => this.passesGeographyFilter(company, filters))
      .filter(company => !this.isSuppressed(company));

    // Remove duplicates
    filteredCompanies = this.deduplicateCompanies(filteredCompanies);

    // Calculate scores and categorize
    filteredCompanies.forEach(company => company.calculateScore());

    // Sort by score (highest first), then by move-in date (most recent), then by headcount
    filteredCompanies.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;

      const dateA = new Date(a.move_in_date);
      const dateB = new Date(b.move_in_date);
      if (dateA.getTime() !== dateB.getTime()) return dateB - dateA;

      return (b.headcount || 0) - (a.headcount || 0);
    });

    return filteredCompanies;
  }

  passesQualityGates(company) {
    return company.isValid();
  }

  passesTimeWindow(company, filters) {
    const moveDate = moment(company.move_in_date).tz('Europe/London');
    const now = moment().tz('Europe/London');

    const daysWindow = filters.daysWindow || 1; // Default to last 24 hours
    const cutoffDate = now.subtract(daysWindow, 'days');

    return moveDate.isAfter(cutoffDate);
  }

  passesBusinessTypeFilter(company) {
    // Include: Hotels, guest houses, industrial units, garage services, manufacturing
    // Include: Construction ONLY if meter_present=true

    return (
      company.isManufacturing() ||
      company.isIndustrial() ||
      company.isGarageService() ||
      company.isHotelOrGuestHouse() ||
      company.isConstructionWithMeter()
    );
  }

  isExcluded(company) {
    return company.shouldExclude();
  }

  passesGeographyFilter(company, filters) {
    if (!filters.region && !filters.county) return true;

    const address = company.address;
    if (!address) return false;

    // Simple region matching - in real app would need proper postcode/region mapping
    if (filters.region) {
      const regionKeywords = {
        'England': ['england', 'london', 'birmingham', 'manchester', 'leeds', 'liverpool'],
        'Scotland': ['scotland', 'glasgow', 'edinburgh'],
        'Wales': ['wales', 'cardiff', 'swansea'],
        'Northern Ireland': ['belfast', 'derry', 'northern ireland']
      };

      const keywords = regionKeywords[filters.region] || [];
      const addressText = `${address.city} ${address.line1} ${address.line2}`.toLowerCase();

      if (!keywords.some(keyword => addressText.includes(keyword))) {
        return false;
      }
    }

    if (filters.county) {
      const addressText = `${address.city} ${address.line1} ${address.line2}`.toLowerCase();
      return addressText.includes(filters.county.toLowerCase());
    }

    return true;
  }

  deduplicateCompanies(companies) {
    const seen = new Set();
    return companies.filter(company => {
      const key = company.getDedupeKey();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  isSuppressed(company) {
    const key = company.getDedupeKey();
    const suppression = this.suppressedCompanies.get(key);

    if (!suppression) return false;

    // Check if suppression has expired
    const now = moment().tz('Europe/London');
    if (now.isAfter(suppression.expiresAt)) {
      this.suppressedCompanies.delete(key);
      return false;
    }

    return true;
  }

  suppressCompany(company, days = 30) {
    const key = company.getDedupeKey();
    const expiresAt = moment().tz('Europe/London').add(days, 'days');

    this.suppressedCompanies.set(key, {
      company_id: company.company_id,
      company_name: company.company_name,
      suppressedAt: moment().tz('Europe/London').toISOString(),
      expiresAt: expiresAt.toISOString(),
      reason: 'manual_suppression'
    });
  }

  markAsContacted(company) {
    this.suppressCompany(company, 90); // Suppress contacted companies for 90 days
  }

  markAsDoNotContact(company) {
    this.suppressCompany(company, 365 * 10); // Suppress for 10 years
  }

  getSuppressionList() {
    return Array.from(this.suppressedCompanies.values());
  }

  removeSuppressionByKey(key) {
    return this.suppressedCompanies.delete(key);
  }

  // Group companies by category for email display
  groupCompaniesByCategory(companies) {
    const groups = {
      'Manufacturing': [],
      'Industrial': [],
      'Garage Service': [],
      'Hotel/Guest House': [],
      'Construction (with meter)': [],
      'Other': []
    };

    companies.forEach(company => {
      const category = company.category || 'Other';
      if (groups[category]) {
        groups[category].push(company);
      } else {
        groups['Other'].push(company);
      }
    });

    return groups;
  }
}

module.exports = FilterService;