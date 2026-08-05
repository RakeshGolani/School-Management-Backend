require('dotenv').config();
const mysql = require('mysql2/promise');
const { fork } = require('child_process');
const path = require('path');

async function freshDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'school_management';

  try {
    console.log(`Connecting to MySQL to drop and recreate database '${database}'...`);
    const connection = await mysql.createConnection({
      host,
      user,
      password
    });
    
    // 1. Drop database
    await connection.query(`DROP DATABASE IF EXISTS \`${database}\`;`);
    console.log(`Dropped database '${database}' successfully.`);
    
    // 2. Create database
    await connection.query(`CREATE DATABASE \`${database}\`;`);
    console.log(`Created database '${database}' successfully.`);
    await connection.end();

    // 3. Run seed script using fork (handles spaces in path correctly)
    console.log('Running seeder script to sync models and seed mock data...');
    
    const seedScriptPath = path.join(__dirname, 'seed.js');
    const child = fork(seedScriptPath);

    child.on('close', (code) => {
      if (code === 0) {
        console.log('Database fresh setup and seed completed successfully!');
        process.exit(0);
      } else {
        console.error(`Seeder script exited with code ${code}`);
        process.exit(code);
      }
    });

  } catch (error) {
    console.error('Error during database fresh operation:', error);
    process.exit(1);
  }
}

freshDatabase();
