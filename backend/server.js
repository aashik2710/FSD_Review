const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const seedDatabase = require('./utils/seedData');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const userRoutes = require('./routes/userRoutes');
const siteRoutes = require('./routes/siteRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const tyreRoutes = require('./routes/tyreRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const alertRoutes = require('./routes/alertRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const historyRoutes = require('./routes/historyRoutes');
const { syncOperatingHours } = require('./controllers/equipmentController');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'Mining Equipment & Tyre Management API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/tyres', tyreRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/history', historyRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is freshly initiated or re-seeding
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Auto-seeding multi-tenant mining platform data...');
      await seedDatabase();
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n========================================================`);
      console.log(` Multi-Tenant Mining Fleet & Tyre Management Server on port ${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api`);
      console.log(` Status: http://localhost:${PORT}/api/health`);
      console.log(`========================================================\n`);

      // Increment operating hours for Active equipment using system time every 30s
      setInterval(() => {
        syncOperatingHours().catch((err) =>
          console.error('[Background Operating Hours Sync Error]:', err.message)
        );
      }, 30000);
    });
  } catch (error) {
    console.error(`[Server] Failed to initialize: ${error.message}`);
    process.exit(1);
  }
};

startServer();
