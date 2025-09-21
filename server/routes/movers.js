const express = require('express');
const router = express.Router();
const EmailmoversApi = require('../services/emailmoversApi');
const FilterService = require('../services/filterService');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const Joi = require('joi');
const path = require('path');
const fs = require('fs');

const emailmoversApi = new EmailmoversApi();
const filterService = new FilterService();

// Validation schema for search parameters
const searchSchema = Joi.object({
  fromDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  daysWindow: Joi.number().integer().min(1).max(30).optional(),
  region: Joi.string().valid('England', 'Scotland', 'Wales', 'Northern Ireland').optional(),
  county: Joi.string().max(50).optional(),
  limit: Joi.number().integer().min(1).max(500).default(50),
  useMockData: Joi.boolean().default(process.env.NODE_ENV === 'development')
});

// GET /api/movers/search - Search for recent movers
router.get('/search', async (req, res) => {
  try {
    const { error, value: filters } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let rawCompanies;

    if (filters.useMockData) {
      console.log('Using mock data for development');
      const mockData = emailmoversApi.getMockRecentMovers();
      rawCompanies = mockData.data;
    } else {
      const apiResponse = await emailmoversApi.getRecentMovers(filters);
      rawCompanies = apiResponse.data || [];
    }

    // Apply filtering and scoring
    const filteredCompanies = await filterService.filterAndScoreCompanies(rawCompanies, filters);

    // Limit results
    const limitedCompanies = filteredCompanies.slice(0, filters.limit);

    // Enrich with company details
    const enrichedCompanies = await Promise.all(
      limitedCompanies.map(async (company) => {
        try {
          let details;
          if (filters.useMockData) {
            details = emailmoversApi.getMockCompanyDetails(company.company_id);
          } else {
            details = await emailmoversApi.getCompanyDetails(company.company_id);
          }

          // Merge details
          company.contacts = details.contacts || company.contacts;
          company.website = details.website || company.website;
          company.additional_phones = details.additional_phones || company.additional_phones;

          return company;
        } catch (error) {
          console.error(`Failed to enrich company ${company.company_id}:`, error.message);
          return company; // Return without enrichment
        }
      })
    );

    // Group by category for response
    const groupedCompanies = filterService.groupCompaniesByCategory(enrichedCompanies);

    res.json({
      success: true,
      data: {
        companies: enrichedCompanies,
        groups: groupedCompanies,
        total: enrichedCompanies.length,
        filters: filters,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in /search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search companies',
      message: error.message
    });
  }
});

// GET /api/movers/:id - Get company details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const useMockData = req.query.useMockData === 'true' || process.env.NODE_ENV === 'development';

    let companyDetails;

    if (useMockData) {
      companyDetails = emailmoversApi.getMockCompanyDetails(id);
    } else {
      companyDetails = await emailmoversApi.getCompanyDetails(id);
    }

    res.json({
      success: true,
      data: companyDetails
    });

  } catch (error) {
    console.error(`Error fetching company ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company details',
      message: error.message
    });
  }
});

// POST /api/movers/suppress - Suppress a company
router.post('/suppress', async (req, res) => {
  try {
    const { company_id, days = 30, reason } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    // Find company first (mock for now)
    const company = { company_id, getDedupeKey: () => company_id };

    if (reason === 'contacted') {
      filterService.markAsContacted(company);
    } else if (reason === 'do_not_contact') {
      filterService.markAsDoNotContact(company);
    } else {
      filterService.suppressCompany(company, days);
    }

    res.json({
      success: true,
      message: `Company ${company_id} suppressed for ${days} days`
    });

  } catch (error) {
    console.error('Error suppressing company:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suppress company',
      message: error.message
    });
  }
});

// GET /api/movers/suppressed - Get suppression list
router.get('/suppressed', async (req, res) => {
  try {
    const suppressions = filterService.getSuppressionList();

    res.json({
      success: true,
      data: suppressions
    });

  } catch (error) {
    console.error('Error fetching suppression list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suppression list',
      message: error.message
    });
  }
});

// DELETE /api/movers/suppressed/:key - Remove suppression
router.delete('/suppressed/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const removed = filterService.removeSuppressionByKey(key);

    if (removed) {
      res.json({
        success: true,
        message: 'Suppression removed'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Suppression not found'
      });
    }

  } catch (error) {
    console.error('Error removing suppression:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove suppression',
      message: error.message
    });
  }
});

// POST /api/movers/export - Export companies to CSV
router.post('/export', async (req, res) => {
  try {
    const { companies } = req.body;

    if (!companies || !Array.isArray(companies)) {
      return res.status(400).json({
        success: false,
        error: 'Companies array is required'
      });
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `movers-export-${timestamp}.csv`;
    const filepath = path.join(tempDir, filename);

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'company_name', title: 'Company Name' },
        { id: 'move_in_date', title: 'Move-in Date' },
        { id: 'premises_type', title: 'Premises Type' },
        { id: 'sector_sic', title: 'Sector/SIC' },
        { id: 'headcount_band', title: 'Headcount Band' },
        { id: 'contact_person', title: 'Contact Person' },
        { id: 'contact_role', title: 'Contact Role' },
        { id: 'phone', title: 'Phone' },
        { id: 'email', title: 'Email' },
        { id: 'full_address', title: 'Full Address' },
        { id: 'website', title: 'Website' },
        { id: 'meter_present', title: 'Meter Present' },
        { id: 'chain_flag', title: 'Chain Flag' },
        { id: 'category', title: 'Category' },
        { id: 'data_source', title: 'Data Source' }
      ]
    });

    const csvData = companies.map(company => {
      // Check if company has toEmailFormat method
      if (company.toEmailFormat && typeof company.toEmailFormat === 'function') {
        return company.toEmailFormat();
      } else {
        // Fallback: create email format manually
        const primaryContact = company.contacts?.[0] || {};
        return {
          company_name: company.company_name || '',
          move_in_date: company.move_in_date || '',
          premises_type: company.premises_type || '',
          sector_sic: company.sic_description || company.sic_codes?.join(', ') || '',
          headcount_band: company.headcount ? (
            company.headcount < 10 ? '1-9' :
            company.headcount < 50 ? '10-49' :
            company.headcount < 250 ? '50-249' : '250+'
          ) : 'Unknown',
          contact_person: `${primaryContact.first_name || ''} ${primaryContact.last_name || ''}`.trim(),
          contact_role: primaryContact.role || '',
          phone: primaryContact.phone || company.additional_phones?.[0] || '',
          email: primaryContact.email || '',
          full_address: company.address ? [
            company.address.line1,
            company.address.line2,
            company.address.city,
            company.address.postcode
          ].filter(Boolean).join(', ') : '',
          website: company.website || '',
          meter_present: company.meter_present ? 'Y' : 'N',
          chain_flag: company.chain_flag ? 'Y' : 'N',
          category: company.category || 'Other',
          data_source: company.data_source || 'Emailmovers'
        };
      }
    });

    await csvWriter.writeRecords(csvData);

    // Send file as download
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error sending CSV file:', err);
        res.status(500).json({
          success: false,
          error: 'Failed to send CSV file'
        });
      }

      // Clean up temp file
      try {
        fs.unlinkSync(filepath);
      } catch (cleanupErr) {
        console.error('Error cleaning up temp file:', cleanupErr);
      }
    });

  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export CSV',
      message: error.message
    });
  }
});

module.exports = router;