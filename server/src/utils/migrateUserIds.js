import User from '../models/User.js';
import logger from './logger.js';

/**
 * Migration utility to generate userId for all existing users
 * Run this once to populate userId for all users in the database
 */
export async function migrateUserIds() {
    try {
        logger.info('Starting userId migration...');

        // Find all users without userId
        const usersWithoutId = await User.find({ $or: [{ userId: { $exists: false } }, { userId: null }] });

        logger.info(`Found ${usersWithoutId.length} users without userId`);

        let successCount = 0;
        let errorCount = 0;

        for (const user of usersWithoutId) {
            try {
                // Save will trigger pre-save hook to generate userId
                await user.save();
                successCount++;
                logger.info(`Generated userId for user: ${user.email} -> ${user.userId}`);
            } catch (error) {
                errorCount++;
                logger.error(`Failed to generate userId for user ${user.email}:`, error.message);
            }
        }

        logger.info(`Migration complete. Success: ${successCount}, Errors: ${errorCount}`);
        return { success: successCount, errors: errorCount };
    } catch (error) {
        logger.error('Migration failed:', error.message);
        throw error;
    }
}

// CLI usage: node -e "import('./utils/migrateUserIds.js').then(m => m.migrateUserIds())"
