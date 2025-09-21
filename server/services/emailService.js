const sgMail = require('@sendgrid/mail');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const moment = require('moment-timezone');
const path = require('path');
const fs = require('fs');

class EmailService {
  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.FROM_EMAIL || 'alerts@moveralert.com';

    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
    } else {
      console.warn('SENDGRID_API_KEY not found in environment variables - email disabled');
    }

    // In-memory storage for demo - in production use database
    this.optOutList = new Set();
    this.recipients = [
      {
        email: 'user@example.com',
        name: 'Sales User',
        doNotEmail: false
      }
    ];
  }

  async sendDailyAlert(companies, options = {}) {
    try {
      const {
        maxLeads = 50,
        includeTop10 = true,
        attachCSV = true
      } = options;

      if (companies.length === 0) {
        return this.sendNoLeadsEmail();
      }

      // Limit companies
      const limitedCompanies = companies.slice(0, maxLeads);
      const top10Companies = limitedCompanies.slice(0, 10);

      // Generate CSV attachment
      let csvAttachment = null;
      if (attachCSV) {
        csvAttachment = await this.generateCSVAttachment(limitedCompanies);
      }

      // Get active recipients (not opted out)
      const activeRecipients = this.recipients.filter(r =>
        !r.doNotEmail && !this.optOutList.has(r.email)
      );

      if (activeRecipients.length === 0) {
        console.log('No active recipients for daily alert');
        return { success: true, message: 'No active recipients' };
      }

      const date = moment().tz('Europe/London').format('YYYY-MM-DD');
      const subject = `Daily Movers: ${date} — ${limitedCompanies.length} Manufacturing-Focused Opportunities`;

      const htmlContent = this.generateEmailHTML(top10Companies, limitedCompanies, date);
      const textContent = this.generateEmailText(top10Companies, limitedCompanies, date);

      // Send emails
      const emailPromises = activeRecipients.map(recipient => {
        const personalizedHTML = this.addUnsubscribeLink(htmlContent, recipient.email);
        const personalizedText = this.addUnsubscribeLink(textContent, recipient.email);

        const mailOptions = {
          to: recipient.email,
          from: {
            email: this.fromEmail,
            name: 'Recent Movers Alert'
          },
          subject: subject,
          text: personalizedText,
          html: personalizedHTML,
          customArgs: {
            type: 'daily_alert',
            date: date,
            lead_count: limitedCompanies.length.toString()
          }
        };

        if (csvAttachment) {
          mailOptions.attachments = [csvAttachment];
        }

        return this.sendMail(mailOptions);
      });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        message: `Daily alert sent to ${successful} recipients`,
        details: {
          successful,
          failed,
          leadCount: limitedCompanies.length,
          date
        }
      };

    } catch (error) {
      console.error('Error sending daily alert:', error);
      throw new Error(`Failed to send daily alert: ${error.message}`);
    }
  }

  async sendNoLeadsEmail() {
    const activeRecipients = this.recipients.filter(r =>
      !r.doNotEmail && !this.optOutList.has(r.email)
    );

    if (activeRecipients.length === 0) {
      return { success: true, message: 'No active recipients' };
    }

    const date = moment().tz('Europe/London').format('YYYY-MM-DD');
    const subject = `Daily Movers: ${date} — No New Manufacturing Opportunities Today`;

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              Daily Movers Alert - ${date}
            </h1>

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #374151;">No New Movers Today</h2>
              <p>There are no new companies matching your manufacturing-focused criteria that moved in the last 24 hours.</p>
              <p>We'll continue monitoring and will send you the next alert when new opportunities are available.</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p>Powered by Emailmovers | Recent Movers Manufacturing Alert</p>
              <p><a href="##UNSUBSCRIBE_LINK##" style="color: #6b7280;">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Daily Movers Alert - ${date}

No New Movers Today

There are no new companies matching your manufacturing-focused criteria that moved in the last 24 hours.

We'll continue monitoring and will send you the next alert when new opportunities are available.

---
Powered by Emailmovers | Recent Movers Manufacturing Alert
Unsubscribe: ##UNSUBSCRIBE_LINK##
    `;

    const emailPromises = activeRecipients.map(recipient => {
      const mailOptions = {
        to: recipient.email,
        from: {
          email: this.fromEmail,
          name: 'Recent Movers Alert'
        },
        subject: subject,
        text: this.addUnsubscribeLink(textContent, recipient.email),
        html: this.addUnsubscribeLink(htmlContent, recipient.email),
        customArgs: {
          type: 'no_leads_alert',
          date: date
        }
      };

      return this.sendMail(mailOptions);
    });

    await Promise.allSettled(emailPromises);

    return {
      success: true,
      message: 'No leads notification sent',
      details: { date }
    };
  }

  generateEmailHTML(top10Companies, allCompanies, date) {
    const categoriesHTML = this.generateCategoriesHTML(top10Companies);

    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              Daily Movers Alert - ${date}
            </h1>

            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #1e40af;">
                ${allCompanies.length} fresh manufacturing-focused opportunities found
              </p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">
                Filtered to manufacturing, industrial, garage services, hotels, and construction with energy meters
              </p>
            </div>

            <h2 style="color: #374151; margin-top: 30px;">Top 10 Opportunities</h2>
            ${categoriesHTML}

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #374151;">View All & Export</h3>
              <p>
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}"
                   style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px;
                          text-decoration: none; border-radius: 6px; font-weight: bold;">
                  View All ${allCompanies.length} Companies →
                </a>
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 15px;">
                CSV file attached with complete details for all ${allCompanies.length} companies.
              </p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p>Powered by Emailmovers | Recent Movers Manufacturing Alert</p>
              <p><a href="##UNSUBSCRIBE_LINK##" style="color: #6b7280;">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  generateEmailText(top10Companies, allCompanies, date) {
    let text = `Daily Movers Alert - ${date}\n\n`;
    text += `${allCompanies.length} fresh manufacturing-focused opportunities found\n`;
    text += `Filtered to manufacturing, industrial, garage services, hotels, and construction with energy meters\n\n`;

    text += `TOP 10 OPPORTUNITIES:\n`;
    text += `===================\n\n`;

    top10Companies.forEach((company, index) => {
      const emailFormat = company.toEmailFormat ? company.toEmailFormat() : company;
      text += `${index + 1}. ${emailFormat.company_name}\n`;
      text += `   Category: ${emailFormat.category}\n`;
      text += `   Moved: ${emailFormat.move_in_date}\n`;
      text += `   Contact: ${emailFormat.contact_person} (${emailFormat.contact_role})\n`;
      text += `   Email: ${emailFormat.email}\n`;
      text += `   Phone: ${emailFormat.phone}\n`;
      text += `   Address: ${emailFormat.full_address}\n`;
      if (emailFormat.website) text += `   Website: ${emailFormat.website}\n`;
      text += `\n`;
    });

    text += `\nView all ${allCompanies.length} companies: ${process.env.CLIENT_URL || 'http://localhost:3000'}\n`;
    text += `\n---\n`;
    text += `Powered by Emailmovers | Recent Movers Manufacturing Alert\n`;
    text += `Unsubscribe: ##UNSUBSCRIBE_LINK##\n`;

    return text;
  }

  generateCategoriesHTML(companies) {
    const categories = {};
    companies.forEach(company => {
      const category = company.category || 'Other';
      if (!categories[category]) categories[category] = [];
      categories[category].push(company);
    });

    let html = '';
    Object.entries(categories).forEach(([category, categoryCompanies]) => {
      html += `<h3 style="color: #059669; margin-top: 25px; margin-bottom: 15px;">${category} (${categoryCompanies.length})</h3>`;
      html += '<div style="margin-left: 20px;">';

      categoryCompanies.forEach(company => {
        const emailFormat = company.toEmailFormat ? company.toEmailFormat() : company;
        html += `
          <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #fafafa;">
            <h4 style="margin: 0 0 10px 0; color: #1f2937;">${emailFormat.company_name}</h4>
            <p style="margin: 5px 0; font-size: 14px;">
              <strong>Moved:</strong> ${emailFormat.move_in_date} |
              <strong>Employees:</strong> ${emailFormat.headcount_band} |
              <strong>Meter:</strong> ${emailFormat.meter_present}
            </p>
            <p style="margin: 5px 0; font-size: 14px;">
              <strong>Contact:</strong> ${emailFormat.contact_person} (${emailFormat.contact_role})
            </p>
            <p style="margin: 5px 0; font-size: 14px;">
              <strong>Email:</strong> <a href="mailto:${emailFormat.email}" style="color: #2563eb;">${emailFormat.email}</a> |
              <strong>Phone:</strong> <a href="tel:${emailFormat.phone}" style="color: #2563eb;">${emailFormat.phone}</a>
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
              ${emailFormat.full_address}
            </p>
            ${emailFormat.website ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Website:</strong> <a href="${emailFormat.website}" style="color: #2563eb;">${emailFormat.website}</a></p>` : ''}
          </div>
        `;
      });

      html += '</div>';
    });

    return html;
  }

  async generateCSVAttachment(companies) {
    try {
      const timestamp = moment().tz('Europe/London').format('YYYY-MM-DD-HHmm');
      const filename = `movers-${timestamp}.csv`;
      const filepath = path.join(__dirname, '../../temp', filename);

      // Ensure temp directory exists
      const tempDir = path.dirname(filepath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

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

      const csvData = companies.map(company =>
        company.toEmailFormat ? company.toEmailFormat() : company
      );

      await csvWriter.writeRecords(csvData);

      const content = fs.readFileSync(filepath);
      const base64Content = content.toString('base64');

      // Clean up temp file
      fs.unlinkSync(filepath);

      return {
        content: base64Content,
        filename: filename,
        type: 'text/csv',
        disposition: 'attachment'
      };

    } catch (error) {
      console.error('Error generating CSV attachment:', error);
      return null;
    }
  }

  addUnsubscribeLink(content, email) {
    const unsubscribeUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(email)}`;
    return content.replace(/##UNSUBSCRIBE_LINK##/g, unsubscribeUrl);
  }

  async sendMail(mailOptions) {
    if (!this.apiKey) {
      console.log('Email disabled - would send:', mailOptions.subject);
      return { success: true, message: 'Email disabled' };
    }

    try {
      const result = await sgMail.send(mailOptions);
      console.log(`Email sent to ${mailOptions.to}: ${mailOptions.subject}`);
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error('SendGrid error:', error);
      throw error;
    }
  }

  // Opt-out management
  addToOptOutList(email) {
    this.optOutList.add(email.toLowerCase());
    console.log(`Email ${email} added to opt-out list`);
  }

  removeFromOptOutList(email) {
    this.optOutList.delete(email.toLowerCase());
    console.log(`Email ${email} removed from opt-out list`);
  }

  isOptedOut(email) {
    return this.optOutList.has(email.toLowerCase());
  }

  // Recipient management
  addRecipient(email, name) {
    const existing = this.recipients.find(r => r.email === email);
    if (!existing) {
      this.recipients.push({
        email,
        name,
        doNotEmail: false
      });
    }
  }

  setDoNotEmail(email, doNotEmail = true) {
    const recipient = this.recipients.find(r => r.email === email);
    if (recipient) {
      recipient.doNotEmail = doNotEmail;
    }
  }

  getActiveRecipients() {
    return this.recipients.filter(r =>
      !r.doNotEmail && !this.optOutList.has(r.email)
    );
  }
}

module.exports = EmailService;