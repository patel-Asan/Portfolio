const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let connected = false;
const connect = async () => {
    if (connected) return;
    await mongoose.connect(process.env.MONGODB_URI);
    connected = true;
};

const messageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: '' },
    message: { type: String, required: true },
    status: { type: String, enum: ['unread', 'read'], default: 'unread' },
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

const auth = (req) => {
    const header = req.headers.authorization || req.headers.Authorization;
    if (!header) throw new Error('No token');
    return jwt.verify(header.replace('Bearer ', ''), process.env.JWT_SECRET || 'your-secret-key');
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();

    try {
        auth(req);
        await connect();

        if (req.method === 'GET' && !req.url.includes('/messages/')) {
            const messages = await Message.find().sort({ createdAt: -1 });
            return res.json({ success: true, messages });
        }

        const id = req.url.split('/').pop().split('?')[0];
        if (!id) return res.status(400).json({ success: false, message: 'ID required' });

        if (req.method === 'PATCH') {
            const msg = await Message.findByIdAndUpdate(id, { status: req.body.status }, { new: true });
            return res.json({ success: true, message: msg });
        }

        if (req.method === 'DELETE') {
            await Message.findByIdAndDelete(id);
            return res.json({ success: true, message: 'Message deleted' });
        }

        res.status(405).json({ success: false, error: 'Method Not Allowed' });
    } catch (e) {
        res.status(e.message.includes('jwt') || e.message === 'No token' ? 401 : 500).json({ success: false, error: e.message });
    }
};
