# Recent Movers Manufacturing Alert

A web application that automatically finds and emails daily alerts about UK companies that have recently moved into commercial premises, with a strong focus on manufacturing. Built with React frontend and Node.js backend, powered by the Emailmovers API.

## Features

### Core Functionality
- **Daily Email Alerts**: Automated emails at 08:00 UK time with fresh manufacturing leads
- **Advanced Filtering**: Manufacturing-first filtering with support for industrial, garage services, hotels, and construction with energy meters
- **Smart Scoring**: Prioritizes manufacturing companies, then by company size and move-in date
- **Quality Gates**: Ensures leads have valid company name, contact person, email/phone, and address
- **Deduplication**: Prevents duplicate leads for 30 days using company ID and postcode
- **Chain Exclusion**: Automatically excludes high street shops and chain establishments

### Web Dashboard
- **Search & Filter Panel**: Time window, region, county, and result limit controls
- **Company List**: Grouped by category with badges and bulk actions
- **Company Details**: Full enrichment drawer with contact information
- **Suppression Controls**: Mark as contacted, hide, or do-not-contact
- **Export Options**: CSV export and copy-to-clipboard functionality

### Email System
- **Rich HTML Emails**: Professional templates with inline company previews
- **CSV Attachments**: Complete lead data for easy import into CRM systems
- **Unsubscribe Management**: GDPR-compliant opt-out handling
- **Fallback Notifications**: "No new movers" emails when no qualifying leads found

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Emailmovers API key (for production)
- SendGrid API key (for email sending)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd moveralert2
   npm run install-all
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your API keys:
   ```env
   EMAILMOVERS_API_KEY=your_emailmovers_api_key_here
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   FROM_EMAIL=alerts@yourdomain.com
   ```

3. **Development Mode:**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend server on http://localhost:5000
   - React frontend on http://localhost:3000
   - Daily CRON scheduler (08:00 UK time)

### Production Deployment

1. **Build React app:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## API Endpoints

### Companies
- `GET /api/movers/search` - Search recent movers with filters
- `GET /api/movers/:id` - Get company details
- `POST /api/movers/suppress` - Suppress a company
- `GET /api/movers/suppressed` - Get suppression list

### Alerts
- `GET /api/alerts/status` - Get scheduler status
- `POST /api/alerts/send-manual` - Trigger manual alert
- `POST /api/alerts/test-email` - Send test email
- `POST /api/alerts/unsubscribe` - Handle unsubscribes

### Admin
- `GET /api/admin/pricing` - Get pricing tiers

## Configuration

### Email Settings
The app uses SendGrid for transactional emails. Configure in `.env`:
```env
SENDGRID_API_KEY=your_key_here
FROM_EMAIL=alerts@yourdomain.com
```

### CRON Schedule
Daily alerts run at 08:00 UK time by default. Customize in `.env`:
```env
CRON_SCHEDULE="0 8 * * *"  # Daily at 08:00
```

### API Integration
For development, the app uses mock data by default. For production with real Emailmovers data:
```env
EMAILMOVERS_API_KEY=your_key_here
EMAILMOVERS_BASE_URL=https://api.emailmovers.com/v1
```

## Business Logic

### Filtering Criteria

**Included Business Types:**
- Manufacturing services (highest priority)
- Industrial units and garage services
- Hotels and guest houses
- Construction (only if energy meter present)

**Exclusions:**
- High street shops and retail
- Chain establishments (5+ locations)
- Companies without valid contact information

### Scoring Algorithm
Companies are scored and ordered by:
1. Business type (Manufacturing → Industrial/Garage → Hotels → Construction+Meter)
2. Recent move-in date (more recent = higher score)
3. Company size (larger headcount = higher score)

### Quality Gates
All leads must have:
- Company name
- At least one contact person (first/last name)
- Direct email OR switchboard phone
- Validated address with postcode

## Data Sources

All business data comes from the **Emailmovers API**:
- `/recent-movers` - Companies that recently moved
- `/company/{id}` - Detailed company information
- `/chains/list` - Known chain brands for exclusion

**Data includes:**
- Company name, SIC codes, headcount
- Move-in date and premises type
- Contact details (name, role, email, phone)
- Address and postcode
- Energy meter presence flag
- Group/brand ownership information

## Compliance

### GDPR & Privacy
- Only uses business contact data from Emailmovers
- Stores minimal PII with encryption at rest
- Provides global opt-out functionality
- Includes unsubscribe links in all emails

### Attribution
All emails and exports include:
> "Powered by Emailmovers"

## Testing

The app includes comprehensive mock data for development and testing:

```bash
# Test the full pipeline with mock data
curl -X POST http://localhost:5000/api/alerts/send-manual \
  -H "Content-Type: application/json" \
  -d '{"useMockData": true}'

# Test email sending
curl -X POST http://localhost:5000/api/alerts/test-email
```

## Architecture

```
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── models/           # Data models
│   └── utils/            # Utilities
├── client/               # React frontend
│   ├── src/components/   # UI components
│   ├── src/services/     # API client
│   └── src/types/        # TypeScript types
└── package.json          # Dependencies & scripts
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please check the existing issues or create a new one.