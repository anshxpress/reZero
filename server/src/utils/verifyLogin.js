import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import User from '../models/User.js';

const verifyLogin = async () => {
    const args = process.argv.slice(2);
    const [email, password] = args;

    if (!email || !password) {
        console.log('Usage: node verifyLogin.js <email> <password>');
        process.exit(1);
    }

    try {
        console.log('Connecting to DB:', config.mongodbUri.replace(/:([^:@]{1,})@/, ':****@'));
        await mongoose.connect(config.mongodbUri);
        console.log('Connected.');

        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User NOT FOUND in this database.');
            process.exit(1);
        }

        console.log(`✅ User FOUND: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.userId}`);

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            console.log('✅ Password MATCHES. The credentials are correct in this DB.');
            console.log('   If Render Login fails, Render is using a DIFFERENT database.');
        } else {
            console.log('❌ Password DOES NOT MATCH stored hash.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

verifyLogin();
