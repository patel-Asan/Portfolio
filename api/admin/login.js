const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let connected = false;
const connect = async () => {
    if (connected) return;
    await mongoose.connect(process.env.MONGODB_URI);
    connected = true;
};

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
userSchema.methods.comparePassword = async function(pwd) { return bcrypt.compare(pwd, this.password); };
const User = mongoose.models.User || mongoose.model('User', userSchema);

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
        res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
        return;
    }

    try {
        await connect();
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Invalid credentials' }));
            return;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Invalid credentials' }));
            return;
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, token, message: 'Login successful' }));
    } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: e.message }));
    }
};
