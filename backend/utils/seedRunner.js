const connectDB = require('../config/db');
const seedDatabase = require('./seedData');

const run = async () => {
  await connectDB();
  await seedDatabase();
  process.exit(0);
};

run();
