const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Find admin user
        const admin = await User.findOne({ username: 'admin' });
        
        if (admin) {
            console.log('\n=== Admin User Found ===');
            console.log('Username:', admin.username);
            console.log('Created at:', admin.createdAt);
        } else {
            console.log('\nNo admin user found in the database');
        }

        // Close the connection
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAdmin(); 