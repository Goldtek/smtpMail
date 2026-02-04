require('dotenv').config();
const http = require('http');
const { URL } = require('url');
const { sendEmail } = require('./email-service'); // Import the sendEmail function

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
        return;
    }

    // Parse the URL
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Only handle /send-email endpoint
    if (url.pathname !== '/send-email') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Not found' }));
        return;
    }

    // Collect request body
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            // Ensure Content-Type is application/json
            if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
                res.writeHead(415, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Content-Type must be application/json' }));
                return;
            }

            const { to, subject, message } = JSON.parse(body);

            if (!to || !message) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Missing required fields: to and message are required'
                }));
                return;
            }

            // Send the email
            const result = await sendEmail(to, subject || 'Message from GloryPlus International', message);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (error) {
            console.error('Error processing request:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
