const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['unread', 'read'], default: 'unread' },
    createdAt: { type: Date, default: Date.now }
});

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
};

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
    }

    try {
        await connectDB();

        const { name, email, message } = JSON.parse(event.body);

        if (!name || !email || !message) {
            return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'All fields are required' }) };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid email format' }) };
        }

        const newMessage = new Message({
            name: name.trim(),
            email: email.trim(),
            message: message.trim()
        });

        await newMessage.save();

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ success: true, message: 'Message sent successfully' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: 'Error sending message. Please try again.' })
        };
    }
};
