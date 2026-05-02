const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
};

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
userSchema.methods.comparePassword = async function(pwd) {
    return bcrypt.compare(pwd, this.password);
};
const User = mongoose.models.User || mongoose.model('User', userSchema);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };

    try {
        await connectDB();
        const { username, password } = JSON.parse(event.body);

        const user = await User.findOne({ username });
        if (!user) return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Invalid credentials' }) };

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Invalid credentials' }) };

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, token, message: 'Login successful' }) };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
    }
};
