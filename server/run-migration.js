// Run migrations script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(filename) {
    const filePath = path.join(__dirname, 'migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Running migration: ${filename}`);
    try {
        await pool.query(sql);
        console.log(`✅ Migration ${filename} completed`);
    } catch (error) {
        console.error(`❌ Migration ${filename} failed:`, error.message);
        throw error;
    }
}

async function main() {
    try {
        // Run only the users migration
        await runMigration('002_users.sql');
        console.log('All migrations completed!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

main();
