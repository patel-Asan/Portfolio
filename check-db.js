const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\nCollections in database:');
        collections.forEach(collection => {
            console.log(`- ${collection.name}`);
        });

        // Check messages collection
        const messages = await mongoose.connection.db.collection('messages').find().toArray();
        console.log('\nMessages in database:');
        if (messages.length === 0) {
            console.log('No messages found');
        } else {
            messages.forEach((message, index) => {
                console.log(`\nMessage #${index + 1}:`);
                console.log('ID:', message._id);
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
        console.log('\nDatabase check completed successfully');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDatabase(); 