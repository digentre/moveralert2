const cron = require('node-cron');
const moment = require('moment-timezone');
const EmailmoversApi = require('./emailmoversApi');
const FilterService = require('./filterService');
const EmailService = require('./emailService');

class Scheduler {
  constructor() {
    this.emailmoversApi = new EmailmoversApi();
    this.filterService = new FilterService();
    this.emailService = new EmailService();

    this.lastRun = null;
    this.nextRun = null;
    this.isRunning = false;

    // Default schedule: 08:00 UK time daily
    this.cronSchedule = process.env.CRON_SCHEDULE || '0 8 * * *';

    this.init();
  }

  init() {
    console.log(`Scheduler initialized with schedule: ${this.cronSchedule}`);
    this.updateNextRunTime();

    // Schedule the daily alert job
    cron.schedule(this.cronSchedule, async () => {
      await this.runDailyAlert();
    }, {
      scheduled: true,
      timezone: "Europe/London"
    });

    console.log(`Next daily alert scheduled for: ${this.nextRun}`);
  }

  async runDailyAlert() {
    if (this.isRunning) {
      console.log('Daily alert already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastRun = moment().tz('Europe/London').toISOString();

    console.log(`Starting daily alert at ${this.lastRun}`);

    try {
      // Get companies that moved in the last 24 hours
      const filters = {
        daysWindow: 1,
        useMockData: process.env.NODE_ENV === 'development'
      };

      let rawCompanies;

      if (filters.useMockData) {
        console.log('Using mock data for daily alert');
        const mockData = this.emailmoversApi.getMockRecentMovers();
        rawCompanies = mockData.data;
      } else {
        console.log('Fetching real data from Emailmovers API');
        const apiResponse = await this.emailmoversApi.getRecentMovers(filters);
        rawCompanies = apiResponse.data || [];
      }

      console.log(`Found ${rawCompanies.length} raw companies`);

      // Apply filtering and scoring
      const filteredCompanies = await this.filterService.filterAndScoreCompanies(rawCompanies, filters);

      console.log(`Filtered to ${filteredCompanies.length} qualified companies`);

      // Enrich with company details
      const enrichedCompanies = await Promise.all(
        filteredCompanies.map(async (company) => {
          try {
            let details;
            if (filters.useMockData) {
              details = this.emailmoversApi.getMockCompanyDetails(company.company_id);
            } else {
              details = await this.emailmoversApi.getCompanyDetails(company.company_id);
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

      console.log(`Enriched ${enrichedCompanies.length} companies`);

      // Send daily alert email
      const emailResult = await this.emailService.sendDailyAlert(enrichedCompanies, {
        maxLeads: 50,
        includeTop10: true,
        attachCSV: true
      });

      console.log('Daily alert email result:', emailResult);

      this.updateNextRunTime();

      return {
        success: true,
        companiesFound: rawCompanies.length,
        companiesFiltered: filteredCompanies.length,
        companiesEnriched: enrichedCompanies.length,
        emailResult: emailResult,
        runTime: this.lastRun,
        nextRun: this.nextRun
      };

    } catch (error) {
      console.error('Error running daily alert:', error);

      // Send error notification to admin (in production)
      return {
        success: false,
        error: error.message,
        runTime: this.lastRun,
        nextRun: this.nextRun
      };

    } finally {
      this.isRunning = false;
    }
  }

  async runManualAlert(options = {}) {
    console.log('Running manual alert...');

    try {
      const filters = {
        daysWindow: options.daysWindow || 1,
        useMockData: options.useMockData !== false // Default to true unless explicitly false
      };

      let rawCompanies;

      if (filters.useMockData) {
        const mockData = this.emailmoversApi.getMockRecentMovers();
        rawCompanies = mockData.data;
      } else {
        const apiResponse = await this.emailmoversApi.getRecentMovers(filters);
        rawCompanies = apiResponse.data || [];
      }

      const filteredCompanies = await this.filterService.filterAndScoreCompanies(rawCompanies, filters);

      // Enrich companies
      const enrichedCompanies = await Promise.all(
        filteredCompanies.map(async (company) => {
          try {
            let details;
            if (filters.useMockData) {
              details = this.emailmoversApi.getMockCompanyDetails(company.company_id);
            } else {
              details = await this.emailmoversApi.getCompanyDetails(company.company_id);
            }

            company.contacts = details.contacts || company.contacts;
            company.website = details.website || company.website;
            company.additional_phones = details.additional_phones || company.additional_phones;

            return company;
          } catch (error) {
            console.error(`Failed to enrich company ${company.company_id}:`, error.message);
            return company;
          }
        })
      );

      const emailResult = await this.emailService.sendDailyAlert(enrichedCompanies, {
        maxLeads: options.maxLeads || 50,
        includeTop10: true,
        attachCSV: true
      });

      return {
        success: true,
        message: 'Manual alert sent successfully',
        companiesFound: rawCompanies.length,
        companiesFiltered: filteredCompanies.length,
        companiesEnriched: enrichedCompanies.length,
        emailResult: emailResult
      };

    } catch (error) {
      console.error('Error running manual alert:', error);
      throw new Error(`Manual alert failed: ${error.message}`);
    }
  }

  updateNextRunTime() {
    // Calculate next run time based on cron schedule
    const cronFields = this.cronSchedule.split(' ');
    const hour = parseInt(cronFields[1]);
    const minute = parseInt(cronFields[0]);

    const now = moment().tz('Europe/London');
    let next = moment().tz('Europe/London').set({ hour, minute, second: 0, millisecond: 0 });

    // If the time has passed today, schedule for tomorrow
    if (next.isSameOrBefore(now)) {
      next.add(1, 'day');
    }

    this.nextRun = next.toISOString();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      cronSchedule: this.cronSchedule,
      timezone: 'Europe/London'
    };
  }

  // Update cron schedule (requires restart in production)
  updateSchedule(newSchedule) {
    this.cronSchedule = newSchedule;
    this.updateNextRunTime();
    console.log(`Cron schedule updated to: ${newSchedule}`);
    console.log(`Next run: ${this.nextRun}`);
  }
}

// Create and export singleton instance
const scheduler = new Scheduler();

module.exports = scheduler;