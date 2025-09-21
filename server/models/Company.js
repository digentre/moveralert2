class Company {
  constructor(data) {
    this.company_id = data.company_id;
    this.company_name = data.company_name;
    this.move_in_date = data.move_in_date;
    this.premises_type = data.premises_type;
    this.sic_codes = data.sic_codes || [];
    this.sic_description = data.sic_description;
    this.address = data.address;
    this.headcount = data.headcount;
    this.meter_present = Boolean(data.meter_present);
    this.chain_flag = Boolean(data.chain_flag);
    this.group_ownership = data.group_ownership;
    this.contacts = data.contacts || [];
    this.website = data.website;
    this.additional_phones = data.additional_phones || [];
    this.data_source = 'Emailmovers';
    this.score = 0;
    this.category = null;
  }

  static fromApiResponse(apiData) {
    return new Company(apiData);
  }

  // Quality gates - must have required fields
  isValid() {
    return !!(
      this.company_name &&
      this.contacts.length > 0 &&
      this.contacts.some(c => c.first_name && c.last_name) &&
      (this.contacts.some(c => c.email) || this.additional_phones.length > 0) &&
      this.address &&
      this.address.postcode
    );
  }

  // Generate unique key for deduplication
  getDedupeKey() {
    return `${this.company_id}_${this.address?.postcode?.replace(/\s/g, '')}`;
  }

  // Calculate score based on business priority
  calculateScore() {
    let score = 0;

    // Manufacturing gets highest priority
    if (this.isManufacturing()) {
      score += 1000;
      this.category = 'Manufacturing';
    }
    // Industrial units & garage services
    else if (this.isIndustrial() || this.isGarageService()) {
      score += 800;
      this.category = this.isIndustrial() ? 'Industrial' : 'Garage Service';
    }
    // Hotels & guest houses
    else if (this.isHotelOrGuestHouse()) {
      score += 600;
      this.category = 'Hotel/Guest House';
    }
    // Construction with meter present
    else if (this.isConstructionWithMeter()) {
      score += 400;
      this.category = 'Construction (with meter)';
    }

    // Boost by company size
    if (this.headcount) {
      score += Math.min(this.headcount, 200); // Cap at 200 for scoring
    }

    // Boost by move-in date (more recent = higher score)
    const daysOld = this.getDaysOld();
    score += Math.max(0, 10 - daysOld); // Recent movers get bonus

    this.score = score;
    return score;
  }

  isManufacturing() {
    const manufacturingSics = [
      '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', // Food, beverages, textiles
      '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32' // Chemicals, metals, machinery
    ];

    return this.sic_codes.some(sic =>
      manufacturingSics.some(manSic => sic.startsWith(manSic))
    ) || this.sic_description?.toLowerCase().includes('manufactur');
  }

  isIndustrial() {
    const industrialKeywords = ['industrial unit', 'factory', 'warehouse', 'distribution'];
    return industrialKeywords.some(keyword =>
      this.premises_type?.toLowerCase().includes(keyword)
    );
  }

  isGarageService() {
    const garageSics = ['4520', '4540', '4730']; // Motor vehicle maintenance, parts
    return this.sic_codes.some(sic => garageSics.includes(sic)) ||
           this.premises_type?.toLowerCase().includes('garage');
  }

  isHotelOrGuestHouse() {
    const hospitalitySics = ['5510', '5520', '5530']; // Hotels, holiday accommodation
    const hospitalityKeywords = ['hotel', 'guest house', 'accommodation'];

    return this.sic_codes.some(sic => hospitalitySics.includes(sic)) ||
           hospitalityKeywords.some(keyword =>
             this.premises_type?.toLowerCase().includes(keyword)
           );
  }

  isConstructionWithMeter() {
    const constructionSics = ['41', '42', '43']; // Construction
    const hasConstruction = this.sic_codes.some(sic =>
      constructionSics.some(conSic => sic.startsWith(conSic))
    );

    return hasConstruction && this.meter_present;
  }

  // Check if company should be excluded
  shouldExclude() {
    return this.isHighStreetShop() || this.isChain();
  }

  isHighStreetShop() {
    const retailSics = ['47']; // Retail trade
    const shopKeywords = ['shop', 'retail', 'store'];

    return this.sic_codes.some(sic => retailSics.some(ret => sic.startsWith(ret))) ||
           shopKeywords.some(keyword =>
             this.premises_type?.toLowerCase().includes(keyword)
           );
  }

  isChain() {
    return this.chain_flag ||
           (this.group_ownership && this.group_ownership.location_count >= 5);
  }

  getDaysOld() {
    if (!this.move_in_date) return 999;

    const moveDate = new Date(this.move_in_date);
    const today = new Date();
    const diffTime = today - moveDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Format for email/export
  toEmailFormat() {
    const primaryContact = this.contacts[0] || {};

    return {
      company_name: this.company_name,
      move_in_date: this.move_in_date,
      premises_type: this.premises_type,
      sector_sic: this.sic_description || this.sic_codes.join(', '),
      headcount_band: this.getHeadcountBand(),
      contact_person: `${primaryContact.first_name || ''} ${primaryContact.last_name || ''}`.trim(),
      contact_role: primaryContact.role || '',
      phone: primaryContact.phone || this.additional_phones[0] || '',
      email: primaryContact.email || '',
      full_address: this.getFullAddress(),
      website: this.website || '',
      meter_present: this.meter_present ? 'Y' : 'N',
      chain_flag: this.chain_flag ? 'Y' : 'N',
      data_source: this.data_source,
      category: this.category || 'Other'
    };
  }

  getHeadcountBand() {
    if (!this.headcount) return 'Unknown';
    if (this.headcount < 10) return '1-9';
    if (this.headcount < 50) return '10-49';
    if (this.headcount < 250) return '50-249';
    return '250+';
  }

  getFullAddress() {
    if (!this.address) return '';

    const parts = [
      this.address.line1,
      this.address.line2,
      this.address.city,
      this.address.postcode
    ].filter(Boolean);

    return parts.join(', ');
  }
}

module.exports = Company;