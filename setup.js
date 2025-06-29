const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function setup() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            console.log('Admin user already exists. Resetting password...');
            const adminPassword = 'admin123'; // You can change this password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();
            console.log('Admin password reset successfully');
        } else {
            // Create new admin user
            const adminPassword = 'admin123'; // You can change this password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            
            const adminUser = new User({
                username: 'admin',
                password: hashedPassword
            });

            await adminUser.save();
            console.log('Admin user created successfully');
        }

        console.log('\nAdmin Login Credentials:');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('\nPlease save these credentials. You will need them to log in.');

        // Close the connection
        await mongoose.connection.close();
        console.log('\nSetup completed successfully');
    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
}

setup(); 