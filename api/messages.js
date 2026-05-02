const mongoose = require('mongoose');
const cors = require('cors');

let connected = false;
const connect = async () => {
    if (connected) return;
    await mongoose.connect(process.env.MONGODB_URI);
    connected = true;
};

const corsHandler = (req, res) => new Promise((resolve) => {
    cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] })(req, res, () => resolve());
});

module.exports = async (req, res) => {
    await corsHandler(req, res);

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

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
        if (!name || !email || !message) return res.status(400).json({ success: false, message: 'All fields required' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Invalid email' });

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

        res.status(201).json({ success: true, message: 'Message sent successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
};
