const mongoose = require('mongoose');

let connected = false;
const connect = async () => {
    if (connected) return;
    await mongoose.connect(process.env.MONGODB_URI);
    connected = true;
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
        return;
    }

    try {
        await connect();
        const Message = mongoose.models.Message || mongoose.model('Message', new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true },
            subject: { type: String, default: '' },
            message: { type: String, required: true },
            status: { type: String, enum: ['unread', 'read'], default: 'unread' },
            createdAt: { type: Date, default: Date.now }
        }));

        const { name, email, subject, message } = req.body;
        if (!name || !email || !message) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: 'All fields required' }));
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: 'Invalid email' }));
            return;
        }

        const msg = new Message({ name: name.trim(), email: email.trim(), subject: (subject || '').trim(), message: message.trim() });
        await msg.save();

        const nodemailer = require('nodemailer');
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transport = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
            await transport.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: `New Portfolio Message from ${name.trim()}${subject ? ' - ' + subject.trim() : ''}`,
                html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;"><h2 style="color:#0ea5e9;">📩 New Contact Message</h2><table style="width:100%;margin-top:20px;"><tr><td style="padding:8px 0;font-weight:bold;color:#64748b;">Name:</td><td>${name.trim()}</td></tr><tr><td style="padding:8px 0;font-weight:bold;color:#64748b;">Email:</td><td><a href="mailto:${email.trim()}">${email.trim()}</a></td></tr>${subject ? `<tr><td style="padding:8px 0;font-weight:bold;color:#64748b;">Subject:</td><td>${subject.trim()}</td></tr>` : ''}<tr><td style="padding:8px 0;font-weight:bold;color:#64748b;">Message:</td><td>${message.trim()}</td></tr><tr><td style="padding:8px 0;font-weight:bold;color:#64748b;">Date:</td><td>${new Date().toLocaleString()}</td></tr></table></div>`
            });
        }

        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, message: 'Message sent successfully' }));
    } catch (e) {
        console.error(e);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, message: 'Error sending message' }));
    }
};
