const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function fixAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Delete existing admin user
        await User.deleteOne({ username: 'admin' });
        console.log('Removed existing admin user');

        // Create new admin user with plain password
        const adminUser = new User({
            username: 'admin',
            password: '1234567' // This will be hashed by the pre-save hook
        });

        await adminUser.save();
        console.log('\n=== Admin Account Created Successfully ===');
        console.log('Username: admin');
        console.log('Password: 1234567');

        // Verify the password works
        const savedUser = await User.findOne({ username: 'admin' });
        const isMatch = await savedUser.comparePassword('1234567');
        console.log('\nPassword verification test:', isMatch ? 'SUCCESS' : 'FAILED');

        // Close the connection
        await mongoose.connection.close();
        console.log('\nSetup completed successfully');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixAdmin(); 