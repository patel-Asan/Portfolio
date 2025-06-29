const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const path = require('path');
const User = require('./models/User');
const Message = require('./models/Message');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
});

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findOne({ _id: decoded.id });
        
        if (!user) {
            throw new Error();
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate.' });
    }
};

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Contact form endpoint
app.post('/api/messages', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validate input
        if (!name || !email || !message) {
            console.log('Message validation failed:', { name, email, message });
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Invalid email format:', email);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        // Create and save message
        const newMessage = new Message({ 
            name: name.trim(), 
            email: email.trim(), 
            message: message.trim() 
        });

        await newMessage.save();
        console.log('Message saved successfully:', { name, email });
        
        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully' 
        });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error sending message. Please try again.' 
        });
    }
});

// Admin authentication
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('Login attempt for username:', username);
        
        if (!username || !password) {
            console.log('Login failed: Missing username or password');
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        
        if (!user) {
            console.log('Login failed: User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('User found, comparing passwords...');
        const isMatch = await user.comparePassword(password);
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('Login failed: Password does not match');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        console.log('Login successful for user:', username);
        res.json({ 
            success: true,
            token,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// Admin routes
app.get('/api/admin/messages', auth, async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
});

// Update message status
app.patch('/api/admin/messages/:id', auth, async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating message' });
    }
});

// Delete message
app.delete('/api/admin/messages/:id', auth, async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting message' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 