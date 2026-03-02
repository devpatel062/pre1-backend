import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

const fullName = process.argv[2] || 'Super Admin';
const email = process.argv[3];
const password = process.argv[4];

if (!email || !password) {
  console.error('Usage: node src/seed/createAdmin.js "Full Name" admin@example.com securePassword');
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(env.mongoUri);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.fullName = fullName;
    existing.password = await bcrypt.hash(password, 10);
    existing.role = 'superuser';
    await existing.save();
    console.log('Updated existing user to superuser:', email);
  } else {
    await User.create({
      fullName,
      email,
      password: await bcrypt.hash(password, 10),
      role: 'superuser'
    });
    console.log('Created superuser:', email);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
