import mongoose from 'mongoose';
import { config } from '../config.js';
import User from '../models/User.js';

const createAdmin = async () => {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: node src/utils/createAdmin.js <email> <password> [name]');
        process.exit(1);
    }

    const [email, password, name = 'Admin User'] = args;

    try {
        // Connect to database
        await mongoose.connect(config.mongodbUri);
        console.log('Connected to database');

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            existingUser.role = 'admin';
            await existingUser.save();
            console.log(`User ${email} promoted to admin successfully.`);
        } else {
            const user = new User({
                email,
                password,
                name,
                role: 'admin',
                isActive: true
            });
            await user.save();
            console.log(`Admin user ${email} created successfully.`);
        }

    } catch (error) {
        console.error('Error creating admin user:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createAdmin();
