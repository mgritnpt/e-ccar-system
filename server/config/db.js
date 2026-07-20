const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3307'),
  user: process.env.DB_USER || 'eccaruser',
  password: process.env.DB_PASSWORD || 'eccarpassword',
  database: process.env.DB_DATABASE || 'eccardb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Function to initialize database schema
async function initDb() {
  const maxRetries = 10;
  let delay = 5000; // 5 seconds
  let connection = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Connecting to database at ${dbConfig.host}:${dbConfig.port} (Attempt ${attempt}/${maxRetries})...`);
      
      // First connect without specifying database to ensure server is up
      connection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        multipleStatements: true
      });
      
      console.log('Database server connected successfully.');
      break; // Success!
    } catch (err) {
      console.error(`Database connection failed on attempt ${attempt}:`, err.message);
      if (attempt === maxRetries) {
        console.error('Max database connection retries reached. Exiting.');
        process.exit(1);
      }
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  try {
    // 1. Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbConfig.database}\`;`);
    
    // 2. Read schema.sql
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    let schemaSql = '';
    if (fs.existsSync(schemaPath)) {
      schemaSql = fs.readFileSync(schemaPath, 'utf8');
    } else {
      // Fallback schema if schema.sql isn't found
      schemaSql = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL,
          position VARCHAR(100) NULL,
          department VARCHAR(100) NULL,
          bu VARCHAR(50) NULL,
          role VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
    }

    // Split schema into separate queries (excluding USE or CREATE DB statements if they are in the schema.sql)
    // mysql2 supports multiple statements if multipleStatements: true is passed
    console.log('Initializing database schema...');
    await connection.query(schemaSql);
    console.log('Database schema initialized successfully.');

    // 3. Seed initial default users if table is empty
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (rows[0].count === 0) {
      console.log('Seeding initial users...');
      const bcrypt = require('bcryptjs');
      // Create default accounts for testing: sales, ts, purchase, qem, qmr, dept_head
      const defaultUsers = [
        { username: 'wisa.s', name: 'Wisa Saetang', email: 'wisa@paintco.com', position: 'Techno Commercial Representative', department: 'Automotive Coating Business', bu: 'AOEM', role: 'SALES' },
        { username: 'nuttavadee.s', name: 'Nuttavadee Sukkasam', email: 'nuttavadee@paintco.com', position: 'Supervisor', department: 'QEM', bu: 'QEM', role: 'QEM' },
        { username: 'porpimon.h', name: 'Porpimon Hirungure', email: 'porpimon.h@paintco.com', position: 'QMR', department: 'QEM', bu: 'QEM', role: 'QMR' },
        { username: 'wichuda.k', name: 'Wichuda Korkasetwit', email: 'wichuda.k@paintco.com', position: 'Assistant Manager', department: 'IU Quality Control', bu: 'QC', role: 'QC' },
        { username: 'prapaporn.p', name: 'Prapaporn P.', email: 'prapaporn@paintco.com', position: 'Sales Manager', department: 'Automotive Coating Business', bu: 'AOEM', role: 'DEPT_HEAD' },
        { username: 'songchai.s', name: 'Songchai S.', email: 'songchai@paintco.com', position: 'Technical Service Manager', department: 'Technical Service', bu: 'AOEM', role: 'DEPT_HEAD' },
        { username: 'admin', name: 'System Administrator', email: 'admin@paintco.com', position: 'Admin', department: 'IT', bu: 'GEN', role: 'QMR' }
      ];

      for (const u of defaultUsers) {
        const passwordHash = await bcrypt.hash('123456', 10);
        await connection.query(
          'INSERT INTO users (username, password_hash, name, email, position, department, bu, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [u.username, passwordHash, u.name, u.email, u.position, u.department, u.bu, u.role]
        );
      }
      console.log('Seeding initial users completed. Default password is: 123456');
    }

    // 4. Seed initial master_data if table is empty
    const [masterRows] = await connection.query('SELECT COUNT(*) as count FROM master_data');
    if (masterRows[0].count === 0) {
      console.log('Seeding initial master data...');
      const defaultMasterData = [
        // BU (CCAR)
        { category: 'bu_ccar', field_name: 'bu', value_key: 'AOEM', value_label: 'AOEM', description: 'Automotive OEM', sort_order: 1 },
        { category: 'bu_ccar', field_name: 'bu', value_key: 'AMAP', value_label: 'AMAP', description: 'Auto Refinish AP', sort_order: 2 },
        { category: 'bu_ccar', field_name: 'bu', value_key: 'AMPC', value_label: 'AMPC', description: 'Auto Refinish PC', sort_order: 3 },
        { category: 'bu_ccar', field_name: 'bu', value_key: 'MO', value_label: 'MO', description: 'Motorcycle', sort_order: 4 },
        { category: 'bu_ccar', field_name: 'bu', value_key: 'GEN', value_label: 'GEN', description: 'General Coating', sort_order: 5 },
        { category: 'bu_ccar', field_name: 'bu', value_key: 'PTC', value_label: 'PTC', description: 'Protective Coating', sort_order: 6 },
        { category: 'bu_ccar', field_name: 'bu', value_key: 'CED', value_label: 'CED', description: 'Electrodeposition', sort_order: 7 },
        { category: 'bu_ccar', field_name: 'bu', value_key: 'PDP', value_label: 'PDP', description: 'Plastic Parts', sort_order: 8 },
        { category: 'bu_ccar', field_name: 'bu', value_key: 'OSSC', value_label: 'OSSC', description: 'Overseas Business', sort_order: 9 },

        // BU (NCR)
        { category: 'bu_ncr', field_name: 'bu', value_key: 'AM', value_label: 'AM', description: 'Automotive', sort_order: 1 },
        { category: 'bu_ncr', field_name: 'bu', value_key: 'MO', value_label: 'MO', description: 'Motorcycle', sort_order: 2 },
        { category: 'bu_ncr', field_name: 'bu', value_key: 'GN', value_label: 'GN', description: 'General', sort_order: 3 },

        // Roles
        { category: 'role', field_name: 'role', value_key: 'SALES', value_label: 'Sales / TS / Purchase (ผู้แจ้งเรื่อง)', description: 'Sales and Commercial Requester', sort_order: 1 },
        { category: 'role', field_name: 'role', value_key: 'QEM', value_label: 'QEM Staff (ผู้ประเมินและคัดกรอง)', description: 'QEM Evaluator', sort_order: 2 },
        { category: 'role', field_name: 'role', value_key: 'QMR', value_label: 'QMR (ผู้อนุมัติรับเรื่อง / อนุมัติแผน)', description: 'Quality Management Representative', sort_order: 3 },
        { category: 'role', field_name: 'role', value_key: 'QC', value_label: 'QC Department (ผู้ตรวจสอบ/ผู้วิเคราะห์)', description: 'Quality Control', sort_order: 4 },
        { category: 'role', field_name: 'role', value_key: 'PRODUCTION', value_label: 'Production (ฝ่ายผลิต/ผู้รับมอบหมาย)', description: 'Production Team', sort_order: 5 },
        { category: 'role', field_name: 'role', value_key: 'INVENTORY', value_label: 'Inventory (ผู้โอนย้าย stock)', description: 'Inventory Staff', sort_order: 6 },
        { category: 'role', field_name: 'role', value_key: 'DEPT_HEAD', value_label: 'Department Head (หัวหน้าแผนกอนุมัติ)', description: 'Department Head Approver', sort_order: 7 },
        { category: 'role', field_name: 'role', value_key: 'DIV_MANAGER', value_label: 'Division Manager (ผู้จัดการฝ่าย)', description: 'Division Manager', sort_order: 8 },
        { category: 'role', field_name: 'role', value_key: 'TN', value_label: 'Technic / Service (ฝ่ายเทคนิคพิจารณา)', description: 'Technical Support', sort_order: 9 },

        // CCAR Subjects
        { category: 'ccar_subject', field_name: 'subject', value_key: 'Product Quality', value_label: 'Product Quality', description: 'Product Quality Issues', sort_order: 1 },
        { category: 'ccar_subject', field_name: 'subject', value_key: 'Shade', value_label: 'Shade', description: 'Color/Shade Issues', sort_order: 2 },
        { category: 'ccar_subject', field_name: 'subject', value_key: 'Packaging', value_label: 'Packaging', description: 'Packaging/Container Issues', sort_order: 3 },
        { category: 'ccar_subject', field_name: 'subject', value_key: 'Delivery', value_label: 'Delivery', description: 'Delivery/Shipment Issues', sort_order: 4 },
        { category: 'ccar_subject', field_name: 'subject', value_key: 'Other', value_label: 'Other', description: 'Other Issues', sort_order: 5 },

        // NCR Plants
        { category: 'ncr_plant', field_name: 'plant', value_key: 'EN', value_label: 'EN', description: 'EN Plant', sort_order: 1 },
        { category: 'ncr_plant', field_name: 'plant', value_key: 'TH', value_label: 'TH', description: 'TH Plant', sort_order: 2 },
        { category: 'ncr_plant', field_name: 'plant', value_key: 'DR', value_label: 'DR', description: 'DR Plant', sort_order: 3 },
        { category: 'ncr_plant', field_name: 'plant', value_key: 'AR', value_label: 'AR', description: 'AR Plant', sort_order: 4 },
        { category: 'ncr_plant', field_name: 'plant', value_key: 'WT', value_label: 'WT', description: 'WT Plant', sort_order: 5 },
        { category: 'ncr_plant', field_name: 'plant', value_key: 'WB/RM', value_label: 'WB/RM', description: 'Waterbase & Raw Materials', sort_order: 6 },
        { category: 'ncr_plant', field_name: 'plant', value_key: 'ED', value_label: 'ED', description: 'Electrodeposition Plant', sort_order: 7 },
        { category: 'ncr_plant', field_name: 'plant', value_key: 'PP/RM', value_label: 'PP/RM', description: 'Resin & Raw Materials', sort_order: 8 },
        { category: 'ncr_plant', field_name: 'plant', value_key: 'PT/RM', value_label: 'PT/RM', description: 'Powder & Raw Materials', sort_order: 9 },

        // Issued By Dept
        { category: 'issued_by_dept', field_name: 'issued_by_dept', value_key: 'QC', value_label: 'QC', description: 'Quality Control', sort_order: 1 },
        { category: 'issued_by_dept', field_name: 'issued_by_dept', value_key: 'PD', value_label: 'PD', description: 'Production', sort_order: 2 },
        { category: 'issued_by_dept', field_name: 'issued_by_dept', value_key: 'INV', value_label: 'INV', description: 'Inventory', sort_order: 3 },
        { category: 'issued_by_dept', field_name: 'issued_by_dept', value_key: 'MRP', value_label: 'MRP', description: 'Materials & Planning', sort_order: 4 },
        { category: 'issued_by_dept', field_name: 'issued_by_dept', value_key: 'Sale', value_label: 'Sale', description: 'Sales Dept', sort_order: 5 },
        { category: 'issued_by_dept', field_name: 'issued_by_dept', value_key: 'TS', value_label: 'TS', description: 'Technical Service', sort_order: 6 },

        // Quantity Units
        { category: 'quantity_unit', field_name: 'quantity_unit', value_key: 'kg', value_label: 'kg', description: 'Kilograms', sort_order: 1 },
        { category: 'quantity_unit', field_name: 'quantity_unit', value_key: 'pcs', value_label: 'pcs', description: 'Pieces', sort_order: 2 },
        { category: 'quantity_unit', field_name: 'quantity_unit', value_key: 'drum', value_label: 'drum', description: 'Drum 200L', sort_order: 3 },
        { category: 'quantity_unit', field_name: 'quantity_unit', value_key: 'pails', value_label: 'pails', description: 'Pails', sort_order: 4 },
        { category: 'quantity_unit', field_name: 'quantity_unit', value_key: 'set', value_label: 'set', description: 'Set', sort_order: 5 },
        { category: 'quantity_unit', field_name: 'quantity_unit', value_key: 'box', value_label: 'box', description: 'Box', sort_order: 6 },
        { category: 'quantity_unit', field_name: 'quantity_unit', value_key: 'ton', value_label: 'ton', description: 'Tons', sort_order: 7 }
      ];

      for (const item of defaultMasterData) {
        await connection.query(
          'INSERT INTO master_data (category, field_name, value_key, value_label, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          [item.category, item.field_name, item.value_key, item.value_label, item.description, item.sort_order]
        );
      }
      console.log('Seeding initial master data completed.');
    }

    await connection.end();
  } catch (err) {
    console.error('Error during database initialization:', err);
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = {
  getPool,
  initDb
};
