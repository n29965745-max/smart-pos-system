const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Strip /api prefix before routing
app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
        req.url = req.url.slice(4); // strip "/api"
    } else if (req.url === '/api') {
        req.url = '/';
    }
    next();
});

// ── Static files from /public/
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use((req, res, next) => {
    if (path.extname(req.path)) {
        const fullPath = path.join(PUBLIC_DIR, req.path);
        if (fs.existsSync(fullPath)) {
            const ext = path.extname(fullPath).toLowerCase();
            const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml' };
            res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
            return res.sendFile(fullPath);
        }
    }
    next();
});

// ── Root redirect
app.get('/', (req, res) => {
    res.redirect('/quantyx_homepage.html');
});

// ── Email transporter — lazy init on first email send
let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    transporter = nodemailer.createTransport({
        host:     process.env.SMTP_HOST,
        port:     parseInt(process.env.SMTP_PORT || '587'),
        secure:   process.env.SMTP_PORT === '465',   // true for 465, false for 587/25
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    return transporter;
}

/** Send a notification email to the company inbox */
async function sendContactEmail({ name, email, subject, message }) {
    const COMPANY_EMAIL = process.env.COMPANY_EMAIL || 'info@quantyx.com';
    if (!process.env.SMTP_HOST) {
        console.warn('SMTP not configured — email skipped');
        return;
    }
    const mail = getTransporter();
    await mail.sendMail({
        from:    `"${name}" <${email}>`,
        to:      COMPANY_EMAIL,
        subject: subject ? `[Contact] ${subject}` : '[Contact] New Website Enquiry',
        html: `
            <h2>📬 New Contact Form Submission</h2>
            <table cellpadding="6" cellspacing="0" style="font-family:Arial,sans-serif;font-size:15px;">
                <tr><td><strong>Name</strong></td><td>${name}</td></tr>
                <tr><td><strong>Email</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td><strong>Subject</strong></td><td>${subject}</td></tr>
                <tr><td><strong>Message</strong></td><td>${message.replace(/\n/g,'<br>')}</td></tr>
                <tr><td><strong>Received</strong></td><td>${new Date().toLocaleString()}</td></tr>
            </table>
            <hr style="margin-top:20px;">
            <p style="color:#888;font-size:13px;">This email was sent automatically from your website contact form.</p>
        `,
    });
}

// ── Database
const DB_PATH = process.env.VERCEL ? '/tmp/contacts.db' : path.join(__dirname, 'contacts.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('DB error:', err);
    else {
        console.log('Connected to SQLite');
        db.run(`CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL,
            message TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'new'
        )`, () => console.log('Contacts table ready'));
    }
});

// ── API: Submit contact form
app.post('/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message)
        return res.status(400).json({ success: false, message: 'All fields are required' });
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email))
        return res.status(400).json({ success: false, message: 'Invalid email address' });

    // Save to DB
    db.run(
        `INSERT INTO contacts (name,email,subject,message) VALUES (?,?,?,?)`,
        [name, email, subject, message],
        function(dbErr) {
            if (dbErr) return res.status(500).json({ success: false, message: 'DB error' });

            // Send email notification (non-blocking — DB result is sent first)
            sendContactEmail({ name, email, subject, message }).catch(err =>
                console.error('Email error:', err)
            );

            res.json({ success: true, message: "Thank you! We'll reply within 24 hours.", id: this.lastID });
        }
    );
});

// ── API: Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', db: DB_PATH, smtp: process.env.SMTP_HOST || 'not set' });
});

// ── API: List contacts
app.get('/contacts', (req, res) => {
    db.all(`SELECT * FROM contacts ORDER BY created_at DESC`, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        res.json({ success: true, data: rows });
    });
});

module.exports = app;
