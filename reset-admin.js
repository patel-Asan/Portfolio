const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function resetAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Delete existing admin user if exists
        await User.deleteOne({ username: 'admin' });
        console.log('Removed existing admin user');

        // Create new admin user with the specified password
        const adminPassword = '1234567'; // Updated password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        const adminUser = new User({
            username: 'admin',
            password: hashedPassword
        });

        await adminUser.save();
        console.log('\n=== Admin Account Created Successfully ===');
        console.log('Username: admin');
        console.log('Password: 1234567');
        console.log('\nPlease use these credentials to log in to the admin panel');
        console.log('URL: http://localhost:3000/admin');

        // Close the connection
        await mongoose.connection.close();
        console.log('\nSetup completed successfully');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetAdmin(); 