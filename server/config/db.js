const mongoose = require("mongoose");
const Listing = require("../models/Listing");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Mongoose's default autoIndex only CREATES indexes that are missing —
    // it never drops ones that used to be in the schema. An already-deployed
    // database would otherwise keep the old TTL index on Listing.expiryDate
    // and keep silently hard-deleting listings even after this fix ships.
    try {
      await Listing.syncIndexes();
    } catch (indexErr) {
      console.error(`⚠️  Failed to sync Listing indexes: ${indexErr.message}`);
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;