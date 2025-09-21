const express = require('express');
const router = express.Router();

// Placeholder routes for admin - will be implemented
router.get('/pricing', (req, res) => {
  res.json({
    success: true,
    data: {
      currentTier: 'Tier A',
      tiers: [
        { name: 'Tier A', dailyLeadLimit: 50, frequency: 'daily' },
        { name: 'Tier B', dailyLeadLimit: 150, frequency: 'daily' },
        { name: 'Tier C', dailyLeadLimit: 500, frequency: 'hourly' }
      ]
    }
  });
});

module.exports = router;