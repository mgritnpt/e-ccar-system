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
