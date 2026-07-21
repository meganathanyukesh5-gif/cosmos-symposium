const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'registrations.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Ensure database file exists
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]), 'utf8');
}

// Helper to read DB
function readDatabase() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error('Error reading DB:', err);
        return [];
    }
}

// Helper to write DB
function writeDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing DB:', err);
    }
}

// Transporter setup
async function createTransporter() {
    // If environment variables exist, use configured SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // Default auto-generated test transport (Ethereal) for zero-config automatic email dispatching
    try {
        const testAccount = await nodemailer.createTestAccount();
        console.log(`[Email Dispatcher] Auto-generated temporary email account: ${testAccount.user}`);
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    } catch (err) {
        console.error('Failed to create test email transport:', err);
        return null;
    }
}

// Send Ticket Email Function
async function sendTicketEmail(reg) {
    try {
        const transporter = await createTransporter();
        if (!transporter) return false;

        const htmlContent = `
            <div style="background-color: #0f172a; padding: 2rem; font-family: 'Helvetica Neue', Arial, sans-serif; color: #ffffff;">
                <div style="max-width: 550px; margin: 0 auto; background: #ffffff; color: #1e293b; border-radius: 12px; padding: 2rem; border: 4px double #0284c7; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                    
                    <div style="text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 2px; color: #64748b;">Government College of Engineering, Bargur</h3>
                        <h1 style="margin: 0.5rem 0 0; font-size: 1.6rem; color: #0f172a; font-family: Georgia, serif;">National Level Symposium '26</h1>
                        <p style="margin: 0.25rem 0 0; font-size: 0.9rem; font-weight: 700; color: #0284c7;">OFFICIAL ENTRY PASS & TICKET</p>
                    </div>

                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
                        <h4 style="margin-top: 0; color: #16a34a; font-size: 1rem;">✓ Payment & Registration Verified</h4>
                        <p style="margin: 0.25rem 0 0; font-size: 0.9rem; color: #475569; line-height: 1.5;">
                            Dear <strong>${reg.name}</strong>, your entry ticket for the National Level Symposium at GCE Bargur has been verified and confirmed!
                        </p>
                    </div>

                    <table style="width: 100%; font-size: 0.9rem; border-collapse: collapse; margin-bottom: 1.5rem;">
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 0.5rem 0; color: #64748b; font-weight: 600;">Attendee Name:</td>
                            <td style="padding: 0.5rem 0; font-weight: 700; text-align: right; color: #0f172a;">${reg.name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 0.5rem 0; color: #64748b; font-weight: 600;">College Name:</td>
                            <td style="padding: 0.5rem 0; font-weight: 600; text-align: right; color: #0f172a;">${reg.college}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 0.5rem 0; color: #64748b; font-weight: 600;">Roll / Reg No:</td>
                            <td style="padding: 0.5rem 0; font-weight: 600; text-align: right; color: #0f172a;">${reg.regNo}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 0.5rem 0; color: #64748b; font-weight: 600;">Mobile Number:</td>
                            <td style="padding: 0.5rem 0; font-weight: 600; text-align: right; color: #0f172a;">${reg.phone || 'N/A'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 0.5rem 0; color: #64748b; font-weight: 600;">Transaction UTR:</td>
                            <td style="padding: 0.5rem 0; font-family: monospace; font-weight: 700; text-align: right; color: #0284c7;">${reg.txnId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem 0; color: #64748b; font-weight: 600;">Dates & Venue:</td>
                            <td style="padding: 0.5rem 0; font-weight: 600; text-align: right; color: #0f172a;">Sept 10-11, Auditorium GCEB</td>
                        </tr>
                    </table>

                    <div style="border-top: 2px dashed #cbd5e1; padding-top: 1rem; text-align: center;">
                        <p style="font-size: 0.8rem; color: #64748b; margin: 0;">Please present this email ticket pass at the entry desk on arrival.</p>
                        <p style="font-size: 0.85rem; font-weight: 700; color: #0f172a; margin: 0.5rem 0 0;">Organizing Committee • GCE Bargur</p>
                    </div>

                </div>
            </div>
        `;

        const mailOptions = {
            from: '"GCE Bargur Symposium" <symposium-tickets@gcebargur.edu>',
            to: reg.email,
            subject: `National Level Symposium GCE Bargur - Official Ticket Pass Approved!`,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Dispatcher] Ticket email successfully sent to ${reg.email}. Message ID: ${info.messageId}`);
        
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[Email Dispatcher] Preview email online at: ${previewUrl}`);
        }
        return true;
    } catch (err) {
        console.error('Error dispatching ticket email:', err);
        return false;
    }
}

// API Routes

// GET /api/registrations
app.get('/api/registrations', (req, res) => {
    const list = readDatabase();
    res.json(list);
});

// POST /api/register
app.post('/api/register', (req, res) => {
    const { name, email, phone, college, regNo, txnId } = req.body;
    
    if (!name || !email || !college || !regNo || !txnId) {
        return res.status(400).json({ success: false, error: 'Missing required registration fields' });
    }

    const list = readDatabase();
    
    // Check if txnId already exists
    const existing = list.find(r => r.txnId === txnId);
    if (existing) {
        return res.json({ success: true, message: 'Already registered', data: existing });
    }

    const newRecord = {
        name,
        email,
        phone: phone || '',
        college,
        regNo,
        txnId,
        status: 'Pending',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    list.unshift(newRecord);
    writeDatabase(list);

    console.log(`[Backend Database] New registration saved: ${name} (${txnId})`);
    res.json({ success: true, message: 'Registration submitted successfully', data: newRecord });
});

// POST /api/verify
app.post('/api/verify', async (req, res) => {
    const { txnId } = req.body;
    if (!txnId) {
        return res.status(400).json({ success: false, error: 'Transaction ID required' });
    }

    const list = readDatabase();
    const idx = list.findIndex(r => r.txnId === txnId);

    if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Registration not found' });
    }

    list[idx].status = 'Approved';
    writeDatabase(list);

    console.log(`[Backend Database] Registration approved for ${list[idx].name} (${txnId})`);

    // Dispatch email automatically in background
    sendTicketEmail(list[idx]);

    res.json({ success: true, message: 'Registration approved and ticket dispatched', data: list[idx] });
});

// POST /api/clear
app.post('/api/clear', (req, res) => {
    writeDatabase([]);
    console.log('[Backend Database] All registrations cleared.');
    res.json({ success: true, message: 'Database reset' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 GCE Bargur Symposium Backend Server Live on http://localhost:${PORT}`);
    console.log(`=================================================`);
});
