const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function setup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const existingAdmin = await User.findOne({ username: 'Asan' });
        
        if (existingAdmin) {
            console.log('User exists. Resetting password...');
            existingAdmin.password = await bcrypt.hash('AsanTest@123', 10);
            await existingAdmin.save();
            console.log('Password updated');
        } else {
            const hashedPassword = await bcrypt.hash('AsanTest@123', 10);
            const adminUser = new User({ username: 'Asan', password: hashedPassword });
            await adminUser.save();
            console.log('User created');
        }

        console.log('\nAdmin Login Credentials:');
        console.log('Username: Asan');
        console.log('Password: AsanTest@123');

        await mongoose.connection.close();
        console.log('\nDone');
    } catch (error) {
        console.error('Failed:', error);
        process.exit(1);
    }
}

setup();
