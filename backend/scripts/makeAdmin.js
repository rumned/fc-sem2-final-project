/**
 * Bootstrap / promote an admin user.
 *
 * The app intentionally has no public way to register as an admin (registration
 * always creates a normal "user"), and only an existing admin can promote others
 * through the Admin Console. This script breaks that chicken-and-egg problem by
 * editing the database directly. Run it once to create your first admin; after
 * that you can promote everyone else from the Admin Console UI.
 *
 * Usage (run from the backend/ folder):
 *
 *   Promote an existing user to admin:
 *     node scripts/makeAdmin.js promote you@example.com
 *
 *   Create a brand-new admin account:
 *     node scripts/makeAdmin.js create you@example.com "Your Name" yourPassword
 *
 *   Demote an admin back to a normal user:
 *     node scripts/makeAdmin.js demote them@example.com
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const [, , action, email, name, password] = process.argv;

const usage = () => {
  console.log(`
Usage:
  node scripts/makeAdmin.js promote <email>
  node scripts/makeAdmin.js create  <email> <name> <password>
  node scripts/makeAdmin.js demote  <email>
`);
};

const run = async () => {
  if (!action || !email) {
    usage();
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set. Make sure backend/.env exists.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const lowerEmail = email.toLowerCase();

  try {
    if (action === "promote" || action === "demote") {
      const role = action === "promote" ? "admin" : "user";
      const user = await User.findOne({ email: lowerEmail });
      if (!user) {
        console.error(`No user found with email ${lowerEmail}.`);
        console.error("Register that account in the app first, or use the 'create' action.");
        process.exit(1);
      }
      user.role = role;
      await user.save(); // password isn't modified, so the pre-save hash hook is skipped
      console.log(`${user.name} <${user.email}> is now a ${role}.`);
    } else if (action === "create") {
      if (!name || !password) {
        console.error("create requires: <email> <name> <password>");
        usage();
        process.exit(1);
      }
      const existing = await User.findOne({ email: lowerEmail });
      if (existing) {
        console.error(`A user with email ${lowerEmail} already exists. Use 'promote' instead.`);
        process.exit(1);
      }
      // password is hashed by the User model's pre-save hook
      const user = await User.create({ name, email: lowerEmail, password, role: "admin" });
      console.log(`Created admin ${user.name} <${user.email}>. You can now log in with it.`);
    } else {
      usage();
      process.exit(1);
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

run();
