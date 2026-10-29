// Creates a demo admin and customer account (existing users are left untouched).
// Usage: npm run seed
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const users = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@shop.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    firstName: 'Demo',
    lastName: 'Customer',
    email: 'demo@shop.com',
    password: 'demo123',
    phone: '555-0100',
    address: {
      street: '123 Market Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94103',
      country: 'US'
    }
  }
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_users');
  console.log('Connected to MongoDB');

  for (const data of users) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      console.log(`Skipped ${data.email} (already exists)`);
      continue;
    }
    // save() runs the password-hashing hook
    await new User(data).save();
    console.log(`Created ${data.email} / ${data.password}`);
  }
};

seed()
  .catch(error => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
