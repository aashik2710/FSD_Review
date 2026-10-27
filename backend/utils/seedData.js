const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');
const Site = require('../models/Site');
const Equipment = require('../models/Equipment');
const Tyre = require('../models/Tyre');
const Inspection = require('../models/Inspection');
const Maintenance = require('../models/Maintenance');
const Alert = require('../models/Alert');
const Report = require('../models/Report');
const { runAlertScan } = require('../services/alertEngine');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Purging existing database collections...');
    await Promise.all([
      Company.deleteMany(),
      User.deleteMany(),
      Site.deleteMany(),
      Equipment.deleteMany(),
      Tyre.deleteMany(),
      Inspection.deleteMany(),
      Maintenance.deleteMany(),
      Alert.deleteMany(),
      Report.deleteMany()
    ]);

    // 1. Create Mining Companies (Tenants - Indian Context)
    console.log('[Seed] Provisioning Indian multi-tenant Mining Companies...');
    const [goldCompany, coalCompany, ironCompany] = await Company.create([
      {
        name: 'Bharat Gold Mines Ltd (BGML)',
        code: 'BGML',
        industryType: 'Gold Mining',
        contactEmail: 'operations@bharatgold.in',
        contactPhone: '+91 80 2558 4100',
        headquarters: 'Bengaluru, Karnataka, India',
        subscriptionTier: 'Enterprise',
        maxSites: 10,
        maxEquipment: 150
      },
      {
        name: 'Coal India Enterprises (CIL)',
        code: 'CIL',
        industryType: 'Coal Mining',
        contactEmail: 'fleet@coalindia.gov.in',
        contactPhone: '+91 33 2324 5555',
        headquarters: 'Kolkata, West Bengal, India',
        subscriptionTier: 'Enterprise',
        maxSites: 8,
        maxEquipment: 120
      },
      {
        name: 'NMDC Iron Ore Corporation',
        code: 'NMDC',
        industryType: 'Iron Ore',
        contactEmail: 'dispatch@nmdc.co.in',
        contactPhone: '+91 40 2222 1100',
        headquarters: 'Hyderabad, Telangana, India',
        subscriptionTier: 'Enterprise',
        maxSites: 12,
        maxEquipment: 200
      }
    ]);

    // 2. Create Mining Sites in India
    console.log('[Seed] Creating operational Indian mining sites...');
    const [goldSite1, goldSite2] = await Site.create([
      {
        companyId: goldCompany._id,
        name: 'Kolar Gold Fields (KGF)',
        code: 'KGF-01',
        location: 'Kolar, Karnataka, India',
        mineType: 'Open-pit',
        status: 'Active',
        managerName: 'Vikram Patil',
        contactPhone: '+91 8153 260110',
        description: 'Historic and modernized deep open-pit gold extraction facility with heavy haulage roads.'
      },
      {
        companyId: goldCompany._id,
        name: 'Hutti Gold Mines Complex',
        code: 'HGM-02',
        location: 'Raichur, Karnataka, India',
        mineType: 'Open-pit',
        status: 'Active',
        managerName: 'Kavitha Swamy',
        contactPhone: '+91 8537 275000',
        description: 'Hard-rock open cut gold and silver processing hub with continuous excavator operations.'
      }
    ]);

    const [coalSite1, coalSite2] = await Site.create([
      {
        companyId: coalCompany._id,
        name: 'Jharia Coalfield Basin',
        code: 'JCB-01',
        location: 'Dhanbad, Jharkhand, India',
        mineType: 'Open-pit',
        status: 'Active',
        managerName: 'Alok Verma',
        contactPhone: '+91 326 220 7200',
        description: 'High-grade coking coal open cast mining operations serving major steel plants.'
      },
      {
        companyId: coalCompany._id,
        name: 'Singrauli Open Cast Hub',
        code: 'SOH-02',
        location: 'Singrauli, Madhya Pradesh, India',
        mineType: 'Open-pit',
        status: 'Active',
        managerName: 'Sanjay Mishra',
        contactPhone: '+91 7805 264200',
        description: 'Heavy thermal coal haulage project feeding national super-thermal power stations.'
      }
    ]);

    const [ironSite1] = await Site.create([
      {
        companyId: ironCompany._id,
        name: 'Bailadila Iron Ore Deposit',
        code: 'BIO-01',
        location: 'Bastar / Dantewada, Chhattisgarh, India',
        mineType: 'Open-pit',
        status: 'Active',
        managerName: 'Kiran Reddy',
        contactPhone: '+91 7857 230500',
        description: 'High-grade hematite iron ore extraction and automated conveyor dispatch.'
      }
    ]);

    // 3. Create Personnel Users with Indian Names & Roles
    console.log('[Seed] Enrolling personnel and Indian role credentials...');
    const [superAdmin, goldOwner, goldManager, goldTech, coalOwner, coalManager, coalTech, ironManager] = await User.create([
      // Platform Level
      {
        name: 'Rajesh Sharma',
        email: 'admin@miningplatform.com',
        password: 'admin123',
        role: 'SUPER_ADMIN',
        companyId: null,
        siteId: null,
        phone: '+91 98765 00001'
      },
      // Bharat Gold Mines Users
      {
        name: 'Ananya Deshmukh',
        email: 'gold.owner@miningcorp.com',
        password: 'owner123',
        role: 'OWNER',
        companyId: goldCompany._id,
        siteId: goldSite1._id,
        phone: '+91 98765 11111'
      },
      {
        name: 'Vikram Patil',
        email: 'gold.manager@miningcorp.com',
        password: 'manager123',
        role: 'MAINTENANCE_MANAGER',
        companyId: goldCompany._id,
        siteId: goldSite1._id,
        phone: '+91 98765 22222'
      },
      {
        name: 'Suresh Kumar',
        email: 'gold.tech@miningcorp.com',
        password: 'tech123',
        role: 'TECHNICIAN',
        companyId: goldCompany._id,
        siteId: goldSite1._id,
        phone: '+91 98765 33333'
      },
      // Coal India Users
      {
        name: 'Manoj Banerjee',
        email: 'coal.owner@miningcorp.com',
        password: 'owner123',
        role: 'OWNER',
        companyId: coalCompany._id,
        siteId: coalSite1._id,
        phone: '+91 98765 44444'
      },
      {
        name: 'Alok Verma',
        email: 'coal.manager@miningcorp.com',
        password: 'manager123',
        role: 'MAINTENANCE_MANAGER',
        companyId: coalCompany._id,
        siteId: coalSite1._id,
        phone: '+91 98765 55555'
      },
      {
        name: 'Rohan Chatterjee',
        email: 'coal.tech@miningcorp.com',
        password: 'tech123',
        role: 'TECHNICIAN',
        companyId: coalCompany._id,
        siteId: coalSite1._id,
        phone: '+91 98765 66666'
      },
      // NMDC Iron Ore User
      {
        name: 'Kiran Reddy',
        email: 'iron.manager@miningcorp.com',
        password: 'manager123',
        role: 'MAINTENANCE_MANAGER',
        companyId: ironCompany._id,
        siteId: ironSite1._id,
        phone: '+91 98765 77777'
      }
    ]);

    // 4. Create Heavy Machinery Equipment for Bharat Gold Mines
    console.log('[Seed] Deploying heavy machinery fleet...');
    const [goldHT101, goldHT102, goldEX201, goldWL301] = await Equipment.create([
      {
        companyId: goldCompany._id,
        equipmentId: 'EQ-HT-101',
        name: 'Caterpillar 797F Ultra Haul Truck',
        type: 'Haul Truck',
        manufacturer: 'Caterpillar',
        model: '797F-V24',
        serialNumber: 'CAT-797F-990142',
        siteId: goldSite1._id,
        yearOfManufacture: 2022,
        operatingHours: 6420,
        status: 'Active',
        healthStatus: 'Good',
        healthScore: 94,
        fuelLevelPercentage: 88,
        engineTemperatureC: 86,
        oilPressureKPa: 415,
        lastInspectionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        companyId: goldCompany._id,
        equipmentId: 'EQ-HT-102',
        name: 'Komatsu 930E-5 Mining Hauler',
        type: 'Haul Truck',
        manufacturer: 'Komatsu',
        model: '930E-5-AC',
        serialNumber: 'KOM-930E-88201',
        siteId: goldSite1._id,
        yearOfManufacture: 2021,
        operatingHours: 8910,
        status: 'Under Maintenance',
        healthStatus: 'Warning',
        healthScore: 72,
        fuelLevelPercentage: 45,
        engineTemperatureC: 98,
        oilPressureKPa: 360,
        lastInspectionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        companyId: goldCompany._id,
        equipmentId: 'EQ-EX-201',
        name: 'Liebherr R9800 Hydraulic Shovel',
        type: 'Excavator',
        manufacturer: 'Liebherr',
        model: 'R 9800 Litronic',
        serialNumber: 'LIE-9800-4100',
        siteId: goldSite1._id,
        yearOfManufacture: 2023,
        operatingHours: 3200,
        status: 'Active',
        healthStatus: 'Good',
        healthScore: 98,
        fuelLevelPercentage: 92,
        engineTemperatureC: 82,
        oilPressureKPa: 440,
        lastInspectionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        companyId: goldCompany._id,
        equipmentId: 'EQ-WL-301',
        name: 'CAT 994K Wheel Loader',
        type: 'Loader',
        manufacturer: 'Caterpillar',
        model: '994K High Lift',
        serialNumber: 'CAT-994K-5512',
        siteId: goldSite2._id,
        yearOfManufacture: 2020,
        operatingHours: 11400,
        status: 'Active',
        healthStatus: 'Good',
        healthScore: 90,
        fuelLevelPercentage: 76,
        engineTemperatureC: 84,
        oilPressureKPa: 405,
        lastInspectionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ]);

    // Equipment for Coal India
    const [coalHT501, coalEX601] = await Equipment.create([
      {
        companyId: coalCompany._id,
        equipmentId: 'EQ-COAL-HT-501',
        name: 'BEML / Hitachi EH5000AC-3 Hauler',
        type: 'Haul Truck',
        manufacturer: 'BEML-Hitachi',
        model: 'EH5000AC-3',
        serialNumber: 'BEML-5000-8811',
        siteId: coalSite1._id,
        yearOfManufacture: 2023,
        operatingHours: 4120,
        status: 'Active',
        healthStatus: 'Good',
        healthScore: 96,
        fuelLevelPercentage: 84,
        engineTemperatureC: 85,
        oilPressureKPa: 420
      },
      {
        companyId: coalCompany._id,
        equipmentId: 'EQ-COAL-EX-601',
        name: 'Hitachi EX5600-7 Shovel',
        type: 'Excavator',
        manufacturer: 'Hitachi',
        model: 'EX5600-7',
        serialNumber: 'HIT-5600-2209',
        siteId: coalSite1._id,
        yearOfManufacture: 2021,
        operatingHours: 7800,
        status: 'Breakdown',
        healthStatus: 'Critical',
        healthScore: 42,
        fuelLevelPercentage: 30,
        engineTemperatureC: 104,
        oilPressureKPa: 280
      }
    ]);

    // 5. Create OTR Tyres with INR Pricing (₹)
    console.log('[Seed] Mounting OTR tyres in INR currency...');
    const [tyre1, tyre2, tyre3, tyre4, tyreSpare] = await Tyre.create([
      {
        companyId: goldCompany._id,
        tyreId: 'TYRE-MIC-001',
        brand: 'Michelin',
        model: 'XDR 3 Dual-Star',
        size: '59/80R63',
        equipmentId: goldHT101._id,
        position: 'Front Left',
        installationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        operatingHours: 3200,
        initialTreadDepth: 95,
        currentTreadDepth: 74,
        standardPressure: 102,
        currentPressure: 101,
        currentTemperature: 68,
        condition: 'Good',
        status: 'In Service',
        siteId: goldSite1._id,
        cost: 3800000 // ₹38 Lakhs
      },
      {
        companyId: goldCompany._id,
        tyreId: 'TYRE-MIC-002',
        brand: 'Michelin',
        model: 'XDR 3 Dual-Star',
        size: '59/80R63',
        equipmentId: goldHT101._id,
        position: 'Front Right',
        installationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        operatingHours: 3200,
        initialTreadDepth: 95,
        currentTreadDepth: 72,
        standardPressure: 102,
        currentPressure: 103,
        currentTemperature: 71,
        condition: 'Good',
        status: 'In Service',
        siteId: goldSite1._id,
        cost: 3800000 // ₹38 Lakhs
      },
      {
        companyId: goldCompany._id,
        tyreId: 'TYRE-BRD-003',
        brand: 'Bridgestone',
        model: 'MasterCore VRPS',
        size: '53/80R63',
        equipmentId: goldHT102._id,
        position: 'Rear Left Outer',
        installationDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
        operatingHours: 6900,
        initialTreadDepth: 88,
        currentTreadDepth: 16,
        standardPressure: 105,
        currentPressure: 88,
        currentTemperature: 94,
        condition: 'Warning',
        status: 'In Service',
        siteId: goldSite1._id,
        cost: 3500000 // ₹35 Lakhs
      },
      {
        companyId: goldCompany._id,
        tyreId: 'TYRE-BRD-004',
        brand: 'Bridgestone',
        model: 'MasterCore VRPS',
        size: '53/80R63',
        equipmentId: goldHT102._id,
        position: 'Rear Right Outer',
        installationDate: new Date(Date.now() - 340 * 24 * 60 * 60 * 1000),
        operatingHours: 7800,
        initialTreadDepth: 88,
        currentTreadDepth: 9,
        standardPressure: 105,
        currentPressure: 74,
        currentTemperature: 102,
        condition: 'Critical',
        status: 'In Service',
        siteId: goldSite1._id,
        cost: 3500000 // ₹35 Lakhs
      },
      {
        companyId: goldCompany._id,
        tyreId: 'TYRE-APO-005',
        brand: 'Apollo Tyres',
        model: 'Terra Mine HD',
        size: '59/80R63',
        equipmentId: null,
        position: 'Unassigned',
        operatingHours: 0,
        initialTreadDepth: 96,
        currentTreadDepth: 96,
        standardPressure: 102,
        currentPressure: 102,
        currentTemperature: 35,
        condition: 'Good',
        status: 'Spare / Inventory',
        siteId: goldSite1._id,
        cost: 3200000 // ₹32 Lakhs
      }
    ]);

    // Coal Tyres (BKT & CEAT OTR)
    await Tyre.create([
      {
        companyId: coalCompany._id,
        tyreId: 'TYRE-BKT-01',
        brand: 'BKT',
        model: 'Earthmax SR 45 Plus',
        size: '53/80R63',
        equipmentId: coalHT501._id,
        position: 'Front Left',
        operatingHours: 2100,
        initialTreadDepth: 92,
        currentTreadDepth: 84,
        standardPressure: 102,
        currentPressure: 101,
        currentTemperature: 64,
        condition: 'Good',
        status: 'In Service',
        siteId: coalSite1._id,
        cost: 3400000 // ₹34 Lakhs
      }
    ]);

    // 6. Create Field Inspections
    console.log('[Seed] Archiving field diagnostics scorecards...');
    await Inspection.create([
      {
        companyId: goldCompany._id,
        inspectionNumber: 'INSP-2026-001',
        inspectionType: 'Equipment',
        equipmentId: goldHT101._id,
        technicianId: goldTech._id,
        inspectionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        engineCondition: 'Good',
        brakeCondition: 'Good',
        hydraulicSystem: 'Good',
        electricalSystem: 'Good',
        oilLevel: 'Normal',
        coolingSystem: 'Normal',
        equipmentOverallCondition: 'Good',
        notes: '250-hr routine PM check in Kolar Pit Bay 1. All fluid levels within OEM specifications. Zero leaks.',
        actionRecommended: 'Next 500-hour service at 6,700 operating hours.'
      },
      {
        companyId: goldCompany._id,
        inspectionNumber: 'INSP-2026-002',
        inspectionType: 'Tyre',
        equipmentId: goldHT102._id,
        tyreId: tyre4._id,
        technicianId: goldTech._id,
        inspectionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        treadDepth: 9,
        pressure: 74,
        temperature: 102,
        visibleDamage: 'Sidewall Cuts',
        wearCondition: 'Shoulder Wear',
        tyreOverallCondition: 'Critical',
        notes: 'Tread depth is below mandatory 12mm DGMS safety limit. Outer rock cut noticed on shoulder.',
        actionRecommended: 'Immediate tyre replacement required before next shift.'
      }
    ]);

    // 7. Create Maintenance Work Orders in INR (₹)
    console.log('[Seed] Generating maintenance work orders in INR...');
    await Maintenance.create([
      {
        companyId: goldCompany._id,
        maintenanceId: 'WO-2026-101',
        equipmentId: goldHT102._id,
        tyreId: tyre4._id,
        maintenanceType: 'Tyre Replacement',
        description: 'Emergency replacement of Rear Right Outer tyre (TYRE-BRD-004) due to critical wear below DGMS guidelines.',
        priority: 'Critical',
        scheduledDate: new Date(),
        assignedTechnicianId: goldTech._id,
        status: 'In Progress',
        startDate: new Date(),
        cost: 3650000, // ₹36.5 Lakhs
        partsReplaced: [
          {
            partName: 'OTR Radial Tyre 53/80R63',
            partNumber: 'MIC-5380-XDR3',
            quantity: 1,
            cost: 3500000
          },
          {
            partName: 'High-Pressure O-Ring & Bead Seal Kit',
            partNumber: 'VAL-KIT-797',
            quantity: 1,
            cost: 150000
          }
        ],
        notes: 'Haul truck pulled into Kolar Pit Workshop Bay 3. Ready for bead-breaker demount.'
      },
      {
        companyId: goldCompany._id,
        maintenanceId: 'WO-2026-102',
        equipmentId: goldHT101._id,
        maintenanceType: 'Preventive',
        description: 'Scheduled 500-hour engine oil & filter service and hydraulic greasing.',
        priority: 'Medium',
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        assignedTechnicianId: goldTech._id,
        status: 'Scheduled',
        cost: 280000, // ₹2.8 Lakhs
        notes: 'Service kits staged in warehouse Bay 2.'
      }
    ]);

    // 8. Create Initial Analytics Report
    console.log('[Seed] Generating initial analytics snapshots in INR...');
    await Report.create({
      companyId: goldCompany._id,
      title: 'Q1 Kolar Mining Fleet & Tyre Reliability Audit',
      reportType: 'Fleet Health & Availability',
      period: 'Last 30 Days',
      generatedBy: goldManager._id,
      summary: {
        totalEquipment: 4,
        fleetAvailabilityPercent: 75,
        activeTyresCount: 4,
        avgTreadWearPercent: 32,
        totalMaintenanceSpendUSD: 3930000, // ₹39.3 Lakhs
        meanTimeToRepairHours: 3.5,
        meanTimeBetweenFailuresHours: 460,
        openCriticalAlerts: 1
      },
      dataSnapshot: {
        status: 'Operations nominal across Karnataka gold sites with 1 haul truck undergoing tyre replacement'
      }
    });

    // 9. Run automated alert scan
    console.log('[Seed] Running telemetry alert engine...');
    await runAlertScan();

    console.log('\n========================================================');
    console.log(' ✅ Indian Multi-Tenant Database Seeded Successfully (₹ INR)!');
    console.log(' ------------------------------------------------------');
    console.log(' 🏢 Super Admin:    admin@miningplatform.com / admin123 (Rajesh Sharma)');
    console.log(' 🪙 Gold Owner:     gold.owner@miningcorp.com / owner123 (Ananya Deshmukh - BGML)');
    console.log(' 🪙 Gold Manager:   gold.manager@miningcorp.com / manager123 (Vikram Patil - BGML)');
    console.log(' 🪙 Gold Tech:      gold.tech@miningcorp.com / tech123 (Suresh Kumar - BGML)');
    console.log(' ⛏️ Coal Owner:     coal.owner@miningcorp.com / owner123 (Manoj Banerjee - CIL)');
    console.log(' ⛏️ Coal Manager:   coal.manager@miningcorp.com / manager123 (Alok Verma - CIL)');
    console.log(' ⛏️ Iron Manager:   iron.manager@miningcorp.com / manager123 (Kiran Reddy - NMDC)');
    console.log('========================================================\n');
  } catch (error) {
    console.error('[Seed Error]:', error);
  }
};

module.exports = seedDatabase;
