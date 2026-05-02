const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
};

const messageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['unread', 'read'], default: 'unread' },
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

const auth = async (event) => {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) throw new Error('No token');
    const token = authHeader.replace('Bearer ', '');
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
};

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

    try {
        await auth(event);
        await connectDB();

        if (event.httpMethod === 'GET') {
            const messages = await Message.find().sort({ createdAt: -1 });
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, messages }) };
        }

        const id = event.path.split('/').pop();

        if (event.httpMethod === 'PATCH') {
            const { status } = JSON.parse(event.body);
            const message = await Message.findByIdAndUpdate(id, { status }, { new: true });
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, message }) };
        }

        if (event.httpMethod === 'DELETE') {
            await Message.findByIdAndDelete(id);
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Message deleted successfully' }) };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
    } catch (error) {
        return { statusCode: error.message === 'No token' || error.message.includes('jwt') ? 401 : 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
    }
};
