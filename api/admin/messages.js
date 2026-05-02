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
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        auth(req);
        await connect();

        if (req.method === 'GET') {
            const messages = await Message.find().sort({ createdAt: -1 });
            res.status(200).json({ success: true, messages });
            return;
        }

        const id = req.url.split('/').pop().split('?')[0];
        if (!id) {
            res.status(400).json({ success: false, message: 'ID required' });
            return;
        }

        if (req.method === 'PATCH') {
            const msg = await Message.findByIdAndUpdate(id, { status: req.body.status }, { new: true });
            res.status(200).json({ success: true, message: msg });
            return;
        }

        if (req.method === 'DELETE') {
            await Message.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: 'Message deleted' });
            return;
        }

        res.status(405).json({ success: false, error: 'Method Not Allowed' });
    } catch (e) {
        res.status(e.message.includes('jwt') || e.message === 'No token' ? 401 : 500).json({ success: false, error: e.message });
    }
};
