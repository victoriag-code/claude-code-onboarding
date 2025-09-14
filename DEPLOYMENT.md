# Claude Code Enterprise Setup Wizard - Deployment Guide

## Overview
This document outlines the technical steps required to deploy the Claude Code Enterprise Setup Wizard to production. The wizard helps enterprise customers self-onboard to Claude Code, collecting their information and submitting it via email to the appropriate teams.

## System Architecture

### Components
1. **Frontend**: Single-page HTML application with embedded CSS/JavaScript
2. **Backend**: Node.js/Express server handling form submissions and email delivery
3. **Email Service**: Nodemailer integration for sending notifications

### Key Features
- Self-service wizard with multiple customer flows
- Email notifications to internal teams
- Optional customer confirmation emails
- Rate limiting for security
- Enterprise-friendly language with tooltips

## Prerequisites

### Technical Requirements
- Node.js 14.0.0 or higher
- SSL certificate for HTTPS
- Email service credentials (SMTP or Gmail)
- Domain name for hosting

### Internal Approvals Needed
1. **Security Review**
   - Application security assessment
   - Data handling compliance check
   - SSL/TLS configuration approval

2. **Email Configuration**
   - Approval for email sending domain
   - Email addresses for notifications:
     - Main catch-all email (e.g., claude-code-enterprise@anthropic.com)
     - Sales team email for per-user license notifications
   - Email service credentials

3. **Infrastructure**
   - Server/hosting approval
   - Domain/subdomain allocation
   - Load balancer configuration (if needed)

## Deployment Steps

### 1. Environment Setup

```bash
# Clone the repository
git clone [repository-url]
cd cc-c4e-self-serve-wizard

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with production values:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Settings
ALLOWED_ORIGIN=https://your-domain.com

# Email Configuration (choose one option)
# Option 1: SMTP
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# Email Recipients
EMAIL_FROM="Claude Code Setup" <noreply@anthropic.com>
EMAIL_TO=claude-code-enterprise@anthropic.com
SALES_EMAIL=sales@anthropic.com

# Features
SEND_CONFIRMATION=true
```

### 3. Security Configuration

#### SSL/TLS Setup
- Configure SSL certificates for HTTPS
- Ensure all traffic is encrypted
- Set up HTTP to HTTPS redirect

#### Security Headers
The application includes Helmet.js for security headers. Review and adjust in `server.js` if needed:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

#### Rate Limiting
Default configuration: 10 requests per IP per 15 minutes. Adjust in `server.js` if needed.

### 4. Deployment Options

#### Option A: Traditional Server Deployment

```bash
# On production server
npm install --production
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start server.js --name claude-code-wizard
pm2 save
pm2 startup
```

#### Option B: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t claude-code-wizard .
docker run -p 3000:3000 --env-file .env claude-code-wizard
```

#### Option C: Cloud Platform Deployment

**AWS EC2/ECS:**
- Create EC2 instance or ECS task
- Configure security groups (allow ports 80, 443)
- Set up Application Load Balancer
- Configure Auto Scaling (if needed)

**Google Cloud Platform:**
- Deploy to App Engine or Cloud Run
- Configure Cloud Load Balancing
- Set up Cloud Armor for DDoS protection

**Azure:**
- Deploy to App Service
- Configure Application Gateway
- Set up Azure DDoS Protection

### 5. DNS Configuration

1. Create DNS record pointing to server IP or load balancer
2. Recommended subdomain: `setup.claude.ai` or `onboarding.claude.ai`
3. Configure CAA records for SSL certificate validation

### 6. Monitoring Setup

#### Application Monitoring
- Set up health check endpoint monitoring (`/health`)
- Configure uptime monitoring (e.g., UptimeRobot, Pingdom)
- Set up error logging and alerting

#### Email Monitoring
- Monitor email delivery success rates
- Set up bounce handling
- Configure SPF, DKIM, and DMARC records

### 7. Testing

#### Pre-deployment Testing
```bash
# Run locally with production config
NODE_ENV=production npm start

# Test form submission
curl -X POST http://localhost:3000/api/submit-wizard \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","company_name":"Test Corp"}'

# Test health endpoint
curl http://localhost:3000/health
```

#### Post-deployment Testing
1. Complete full wizard flow
2. Verify email delivery
3. Test rate limiting
4. Check SSL certificate
5. Verify all external links work

## Internal Stakeholders to Contact

### Required Approvals

1. **Engineering/DevOps Team**
   - Server provisioning
   - SSL certificate setup
   - DNS configuration
   - Monitoring setup

2. **Security Team**
   - Security review approval
   - Penetration testing (if required)
   - Data handling compliance

3. **Email/IT Team**
   - Email service configuration
   - SPF/DKIM/DMARC setup
   - Email address creation

4. **Sales Team**
   - Confirm sales email address
   - Review per-user license flow
   - Set up response procedures

5. **Legal/Compliance**
   - Review data collection practices
   - Confirm GDPR/privacy compliance
   - Approve customer communication templates

6. **Product Team**
   - Final review of user experience
   - Approval of wizard content
   - Integration with existing workflows

## Maintenance

### Regular Tasks
- Monitor server logs for errors
- Check email delivery rates
- Review rate limiting effectiveness
- Update dependencies monthly
- Rotate email service credentials quarterly

### Backup Strategy
- Daily backup of server logs
- Store form submissions in database (future enhancement)
- Keep deployment configuration in version control

## Rollback Plan

If issues occur after deployment:

1. **Immediate Rollback:**
   ```bash
   # If using PM2
   pm2 reload claude-code-wizard --rollback

   # Or manually revert to previous version
   git checkout [previous-version-tag]
   npm install
   pm2 restart claude-code-wizard
   ```

2. **DNS Failover:**
   - Point DNS to maintenance page
   - Fix issues
   - Restore service

3. **Communication:**
   - Notify sales team of temporary unavailability
   - Update status page (if applicable)

## Success Metrics

Monitor these KPIs after launch:
- Number of successful wizard completions
- Email delivery success rate
- Average time to complete wizard
- Conversion rate (starts vs completions)
- Server uptime percentage
- Response time metrics

## Support Contacts

- **Technical Issues**: DevOps team
- **Email Problems**: IT/Email team
- **Content Updates**: Product team
- **Security Concerns**: Security team
- **Business Questions**: Sales team

## Next Steps

1. Schedule security review with Security team
2. Request server/hosting from DevOps team
3. Coordinate with Email/IT team for email setup
4. Plan launch communication with Sales and Product teams
5. Set up monitoring and alerting with DevOps team
6. Schedule user acceptance testing with Product team

---

**Note**: This wizard collects customer information and sends it via email. Ensure all data handling practices comply with your organization's privacy policies and applicable regulations (GDPR, CCPA, etc.).