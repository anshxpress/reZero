import mongoose from 'mongoose';
import { config } from '../config.js';
import User from '../models/User.js';

const resetPassword = async () => {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: node src/utils/resetPassword.js <email> <new_password>');
        process.exit(1);
    }

    const [email, newPassword] = args;

    try {
        await mongoose.connect(config.mongodbUri);
        console.log('Connected to database');

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User ${email} not found.`);
            process.exit(1);
        }

        user.password = newPassword;
        await user.save();
        console.log(`Password for ${email} has been reset successfully.`);

    } catch (error) {
        console.error('Error resetting password:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

resetPassword();
