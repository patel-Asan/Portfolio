const mongoose = require('mongoose');
const Message = require('./models/Message');
require('dotenv').config();

async function manageMessages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Get command line arguments
        const command = process.argv[2];
        const messageId = process.argv[3];

        switch (command) {
            case 'list':
                // List all messages
                const messages = await Message.find().sort({ createdAt: -1 });
                console.log('\n=== Portfolio Messages ===');
                if (messages.length === 0) {
                    console.log('No messages found in the database.');
                } else {
                    messages.forEach((message, index) => {
                        console.log(`\nMessage #${index + 1}:`);
                        console.log('ID:', message._id);
                        console.log('Name:', message.name || 'N/A');
                        console.log('Email:', message.email || 'N/A');
                        console.log('Message:', message.message || 'N/A');
                        console.log('Status:', message.status || 'unread');
                        console.log('Date:', message.createdAt);
                        console.log('------------------------');
                    });
                }
                break;

            case 'read':
                // Mark message as read
                if (!messageId) {
                    console.log('Please provide a message ID');
                    break;
                }
                const messageToRead = await Message.findByIdAndUpdate(
                    messageId,
                    { status: 'read' },
                    { new: true }
                );
                if (messageToRead) {
                    console.log('Message marked as read successfully');
                } else {
                    console.log('Message not found');
                }
                break;

            case 'delete':
                // Delete a message
                if (!messageId) {
                    console.log('Please provide a message ID');
                    break;
                }
                const deletedMessage = await Message.findByIdAndDelete(messageId);
                if (deletedMessage) {
                    console.log('Message deleted successfully');
                } else {
                    console.log('Message not found');
                }
                break;

            case 'clear':
                // Delete all messages
                const result = await Message.deleteMany({});
                console.log(`Deleted ${result.deletedCount} messages`);
                break;

            default:
                console.log('\nAvailable commands:');
                console.log('  list                    - List all messages');
                console.log('  read <messageId>        - Mark a message as read');
                console.log('  delete <messageId>      - Delete a specific message');
                console.log('  clear                   - Delete all messages');
        }

        // Close the connection
        await mongoose.connection.close();
        console.log('\nOperation completed successfully');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

manageMessages(); 