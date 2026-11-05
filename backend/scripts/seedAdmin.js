const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  let exitCode = 0;

  try {
    // 1. Verify required environment variables
    if (!process.env.MONGO_URI) {
      console.error('[Seed Error] MONGO_URI is not defined in your .env file.');
      process.exit(1);
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.error('[Seed Error] Both ADMIN_EMAIL and ADMIN_PASSWORD must be defined in your .env file.');
      console.error('[Seed Error] Refusing to use fallback or hardcoded credentials.');
      process.exit(1);
    }

    const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = (process.env.ADMIN_NAME || 'Platform Administrator').trim();

    if (adminPassword.length < 6) {
      console.error('[Seed Error] ADMIN_PASSWORD must be at least 6 characters.');
      process.exit(1);
    }

    // 2. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Connected to MongoDB database.');

    // 3. Check if user with this email already exists
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      // 4. If email belongs to a student, stop immediately with an error
      if (existingUser.role !== 'admin') {
        console.error(
          `[Seed Error] A user account with email "${adminEmail}" already exists with role "${existingUser.role}".`
        );
        console.error('[Seed Error] Operation aborted: Student accounts will never be automatically promoted or overwritten.');
        exitCode = 1;
        return;
      }

      // 5. If admin account already exists, do not reset password
      console.log(`[Seed Info] Admin account already exists for "${adminEmail}".`);
      console.log('[Seed Info] Existing credentials preserved. Password was NOT reset.');
    } else {
      // 6. Create admin only when it does not already exist
      // Uses User.create() which triggers the pre-save hook in User model to securely hash password via bcrypt
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isBanned: false,
        college: 'SkillSwap Administration',
        department: 'Operations',
        bio: 'Official platform administrator account.',
      });
      console.log('[Seed Success] Administrator account created successfully.');
    }

    // 7. Output safe summary without displaying passwords or MongoDB connection strings
    console.log('------------------------------------------');
    console.log(`Admin Name    : ${adminName}`);
    console.log(`Admin Email   : ${adminEmail}`);
    console.log('Admin Role    : admin');
    console.log('Login Portal  : /admin-login.html');
    console.log('------------------------------------------');
  } catch (error) {
    console.error('[Seed Error] An error occurred during admin seeding:', error.message);
    exitCode = 1;
  } finally {
    // 8. Safely close database connection under all conditions
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      try {
        await mongoose.connection.close();
        console.log('[Seed] Database connection closed.');
      } catch (closeErr) {
        console.error('[Seed Warning] Failed to close database connection cleanly:', closeErr.message);
      }
    }
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  }
};

seedAdmin();
