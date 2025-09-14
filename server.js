const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "data:"],
            frameSrc: ["'none'"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many submissions from this IP, please try again later.'
});

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Email configuration
const createTransporter = () => {
    // If using Gmail
    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD // Use app-specific password
            }
        });
    }

    // If using SMTP
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Format customer data for email
const formatCustomerData = (data) => {
    const licenseDisplay = data.license_type === 'per-user'
        ? 'Per-User License ($200/month per developer) - SALES FOLLOW-UP REQUIRED'
        : 'API Token (Pay-as-you-go)';

    const accessMethodDisplay = {
        'first-party': 'First-Party API (Direct)',
        'bedrock': 'AWS Bedrock',
        'vertex': 'Google Cloud Vertex AI'
    }[data.access_method] || data.access_method || 'Not specified';

    let html = `
        <h2>New Claude Code Enterprise Setup Wizard Submission</h2>
        <p><strong>Timestamp:</strong> ${new Date(data.completed_at).toLocaleString()}</p>

        <h3>Customer Information</h3>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr style="background: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Company Name</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${data.company_name || 'Not provided'}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Contact Name</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${data.your_name || 'Not provided'}</td>
            </tr>
            <tr style="background: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${data.email || 'Not provided'}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Role</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${data.role || 'Not provided'}</td>
            </tr>
            <tr style="background: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Team Size</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${data.team_size || 'Not provided'}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Timeline</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${data.timeline || 'Not provided'}</td>
            </tr>
            <tr style="background: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>License Type</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd; ${data.license_type === 'per-user' ? 'color: red; font-weight: bold;' : ''}">${licenseDisplay}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Access Method</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${accessMethodDisplay}</td>
            </tr>
            <tr style="background: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Organization UUID</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${data.org_uuid || (data.access_method === 'first-party' ? 'Not provided' : 'N/A (Third-party access)')}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Current AI Tools</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${data.current_tools || 'None specified'}</td>
            </tr>
        </table>

        ${data.license_type === 'per-user' ? `
        <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 5px;">
            <h3 style="color: #856404; margin-top: 0;">⚠️ Sales Follow-up Required</h3>
            <p style="color: #856404;">This customer selected the per-user license option and requires sales team follow-up to arrange licensing transition.</p>
        </div>
        ` : ''}

        <p style="margin-top: 20px; color: #666; font-size: 12px;">
            This email was automatically generated by the Claude Code Enterprise Setup Wizard.
        </p>
    `;

    let text = `
New Claude Code Enterprise Setup Wizard Submission
===================================================
Timestamp: ${new Date(data.completed_at).toLocaleString()}

CUSTOMER INFORMATION
--------------------
Company Name: ${data.company_name || 'Not provided'}
Contact Name: ${data.your_name || 'Not provided'}
Email: ${data.email || 'Not provided'}
Role: ${data.role || 'Not provided'}
Team Size: ${data.team_size || 'Not provided'}
Timeline: ${data.timeline || 'Not provided'}
License Type: ${licenseDisplay}
Access Method: ${accessMethodDisplay}
Organization UUID: ${data.org_uuid || (data.access_method === 'first-party' ? 'Not provided' : 'N/A (Third-party access)')}
Current AI Tools: ${data.current_tools || 'None specified'}

${data.license_type === 'per-user' ? `
ATTENTION: Sales Follow-up Required
This customer selected the per-user license option and requires sales team follow-up.
` : ''}

This email was automatically generated by the Claude Code Enterprise Setup Wizard.
    `;

    return { html, text };
};

// API endpoint to submit wizard data
app.post('/api/submit-wizard', limiter, async (req, res) => {
    try {
        const customerData = req.body;

        // Validate required fields
        if (!customerData.email || !customerData.company_name) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Email and company name are required'
            });
        }

        // Create email transporter
        const transporter = createTransporter();

        // Format email content
        const { html, text } = formatCustomerData(customerData);

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Claude Code Setup Wizard" <noreply@anthropic.com>',
            to: process.env.EMAIL_TO || 'claude-code-enterprise@anthropic.com',
            cc: customerData.license_type === 'per-user' ? process.env.SALES_EMAIL : undefined,
            subject: `[Claude Code Setup] ${customerData.company_name} - ${customerData.license_type === 'per-user' ? 'SALES REQUIRED' : 'API Setup'}`,
            text: text,
            html: html,
            replyTo: customerData.email
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Send confirmation email to customer
        if (process.env.SEND_CONFIRMATION === 'true') {
            const confirmationMail = {
                from: process.env.EMAIL_FROM || '"Claude Code Team" <noreply@anthropic.com>',
                to: customerData.email,
                subject: 'Claude Code Setup - Next Steps',
                html: `
                    <h2>Thank you for setting up Claude Code!</h2>
                    <p>Hello ${customerData.your_name},</p>
                    <p>We've received your setup information for ${customerData.company_name}.</p>

                    ${customerData.license_type === 'per-user' ? `
                    <p><strong>What happens next:</strong></p>
                    <ul>
                        <li>Our sales team will contact you soon to arrange your per-user licensing</li>
                        <li>In the meantime, you can start using Claude Code with API tokens</li>
                        <li>Complete your SSO setup if you haven't already</li>
                    </ul>
                    ` : `
                    <p><strong>You're ready to get started!</strong></p>
                    <ul>
                        <li>Use your API tokens to begin using Claude Code immediately</li>
                        <li>Complete your SSO setup if you haven't already</li>
                        <li>Set up workspace spending limits as needed</li>
                    </ul>
                    `}

                    <p><strong>Helpful Resources:</strong></p>
                    <ul>
                        <li><a href="https://docs.anthropic.com/en/docs/claude-code/getting-started">Getting Started Guide</a></li>
                        <li><a href="https://console.anthropic.com">Console Dashboard</a></li>
                        <li><a href="https://support.anthropic.com/en">Support Center</a></li>
                    </ul>

                    <p>If you have any questions, please don't hesitate to reach out to our support team.</p>

                    <p>Best regards,<br>The Claude Code Team</p>
                `,
                text: `
Thank you for setting up Claude Code!

Hello ${customerData.your_name},

We've received your setup information for ${customerData.company_name}.

${customerData.license_type === 'per-user' ?
`What happens next:
- Our sales team will contact you soon to arrange your per-user licensing
- In the meantime, you can start using Claude Code with API tokens
- Complete your SSO setup if you haven't already` :
`You're ready to get started!
- Use your API tokens to begin using Claude Code immediately
- Complete your SSO setup if you haven't already
- Set up workspace spending limits as needed`}

Helpful Resources:
- Getting Started Guide: https://docs.anthropic.com/en/docs/claude-code/getting-started
- Console Dashboard: https://console.anthropic.com
- Support Center: https://support.anthropic.com/en

If you have any questions, please don't hesitate to reach out to our support team.

Best regards,
The Claude Code Team
                `
            };

            await transporter.sendMail(confirmationMail);
        }

        // Log submission (for monitoring)
        console.log(`[${new Date().toISOString()}] Wizard submission from ${customerData.company_name} (${customerData.email})`);

        res.json({
            success: true,
            message: 'Setup information submitted successfully'
        });

    } catch (error) {
        console.error('Error processing wizard submission:', error);
        res.status(500).json({
            error: 'Failed to process submission',
            message: 'An error occurred while processing your request. Please try again or contact support.'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'claude-code-setup-wizard'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Claude Code Setup Wizard server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Check configuration
    if (!process.env.EMAIL_TO) {
        console.warn('WARNING: EMAIL_TO not configured. Emails will not be sent.');
    }
    if (!process.env.SMTP_HOST && process.env.EMAIL_SERVICE !== 'gmail') {
        console.warn('WARNING: Email transport not properly configured.');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    app.close(() => {
        console.log('HTTP server closed');
    });
});