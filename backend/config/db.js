const dns = require('dns');
const mongoose = require('mongoose');

// Ensure reliable DNS servers for SRV record resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  // Fallback to system default if restricted
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    // Do not terminate process in dev so server can still serve static frontend if DB URI is not yet configured
  }
};

module.exports = connectDB;

