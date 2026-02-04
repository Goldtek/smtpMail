require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

async function loadTemplate(templateName, data) {
    try {
        // Look for templates in the root 'templates' directory
        const templatePath = path.join(process.cwd(), 'templates', `${templateName}.html`);
        let template = await fs.readFile(templatePath, 'utf-8');
        
        // Replace placeholders with actual data
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, data[key]);
        });
        
        return template;
    } catch (error) {
        console.error('Error loading email template:', error);
        throw error;
    }
}

async function sendEmail(to, subject, message) {
    try {
        // Create a transporter object using Zoho SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.ZOHO_SMTP_HOST,
            port: process.env.ZOHO_SMTP_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.ZOHO_EMAIL,
                pass: process.env.ZOHO_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Load and prepare the email template
        const emailHtml = await loadTemplate('emailTemplate', {
            MESSAGE: message
        });

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: `"Glory Plus International" <${process.env.ZOHO_EMAIL}>`,
            to: to,
            subject: subject,
            text: message, // Plain text version
            html: emailHtml // HTML version from template
        });

        console.log('Message sent successfully to:', to);
        console.log('Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { sendEmail };
