const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function verifyAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Find admin user
        const admin = await User.findOne({ username: 'admin' });
        
        if (!admin) {
            console.log('No admin user found. Creating new admin user...');
            
            // Create new admin user
            const adminPassword = '1234567';
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            
            const newAdmin = new User({
                username: 'admin',
                password: hashedPassword
            });

            await newAdmin.save();
            console.log('\n=== New Admin User Created ===');
            console.log('Username: admin');
            console.log('Password: 1234567');
        } else {
            console.log('\n=== Existing Admin User Found ===');
            console.log('Username:', admin.username);
            console.log('Created at:', admin.createdAt);
            
            // Verify password
            const testPassword = '1234567';
            const isMatch = await admin.comparePassword(testPassword);
            console.log('\nPassword verification:');
            console.log('Test password:', testPassword);
            console.log('Password matches:', isMatch);
            
            if (!isMatch) {
                console.log('\nPassword verification failed. Resetting password...');
                admin.password = await bcrypt.hash('1234567', 10);
                await admin.save();
                console.log('Password has been reset to: 1234567');
            }
        }

        // Close the connection
        await mongoose.connection.close();
        console.log('\nVerification completed successfully');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

verifyAdmin(); 