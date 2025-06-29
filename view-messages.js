const mongoose = require('mongoose');
const Message = require('./models/Message');
require('dotenv').config();

async function viewMessages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Find all messages
        const messages = await Message.find().sort({ createdAt: -1 });
        
        console.log('\n=== Portfolio Messages ===');
        if (messages.length === 0) {
            console.log('No messages found in the database.');
        } else {
            messages.forEach((message, index) => {
                console.log(`\nMessage #${index + 1}:`);
                console.log('Name:', message.name);
                console.log('Email:', message.email);
                console.log('Message:', message.message);
                console.log('Status:', message.status);
                console.log('Date:', message.createdAt);
                console.log('------------------------');
            });
        }

        // Close the connection
        await mongoose.connection.close();
        console.log('\nView completed successfully');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

viewMessages(); 