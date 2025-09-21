const express = require('express');
const router = express.Router();
const scheduler = require('../services/scheduler');
const EmailService = require('../services/emailService');

const emailService = new EmailService();

// GET /api/alerts/status - Get scheduler status
router.get('/status', (req, res) => {
  try {
    const status = scheduler.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get alert status',
      message: error.message
    });
  }
});

// POST /api/alerts/send-manual - Trigger manual alert
router.post('/send-manual', async (req, res) => {
  try {
    const options = {
      daysWindow: req.body.daysWindow || 1,
      maxLeads: req.body.maxLeads || 50,
      useMockData: req.body.useMockData !== false
    };

    const result = await scheduler.runManualAlert(options);

    res.json({
      success: true,
      message: 'Manual alert sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Error sending manual alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send manual alert',
      message: error.message
    });
  }
});

// POST /api/alerts/test-email - Send test email
router.post('/test-email', async (req, res) => {
  try {
    const testCompanies = [
      {
        company_id: 'test_001',
        company_name: 'Test Manufacturing Co',
        category: 'Manufacturing',
        toEmailFormat: () => ({
          company_name: 'Test Manufacturing Co',
          move_in_date: '2024-01-15',
          premises_type: 'Manufacturing Facility',
          sector_sic: 'Metal fabrication',
          headcount_band: '50-249',
          contact_person: 'John Test',
          contact_role: 'Operations Director',
          phone: '+44 121 123 4567',
          email: 'j.test@testmanufacturing.co.uk',
          full_address: '123 Test Industrial Estate, Birmingham, B1 1AA',
          website: 'https://testmanufacturing.co.uk',
          meter_present: 'Y',
          chain_flag: 'N',
          data_source: 'Emailmovers',
          category: 'Manufacturing'
        })
      }
    ];

    const result = await emailService.sendDailyAlert(testCompanies, {
      maxLeads: 10,
      includeTop10: true,
      attachCSV: true
    });

    res.json({
      success: true,
      message: 'Test email sent',
      data: result
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      message: error.message
    });
  }
});

// POST /api/alerts/unsubscribe - Handle unsubscribe requests
router.post('/unsubscribe', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    emailService.addToOptOutList(email);

    res.json({
      success: true,
      message: 'Successfully unsubscribed',
      email: email
    });

  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process unsubscribe',
      message: error.message
    });
  }
});

// GET /api/alerts/recipients - Get active recipients
router.get('/recipients', (req, res) => {
  try {
    const recipients = emailService.getActiveRecipients();

    res.json({
      success: true,
      data: recipients
    });

  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipients',
      message: error.message
    });
  }
});

module.exports = router;