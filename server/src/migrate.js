import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createDatabase() {
    // Connect without database to create it if not exists
    const { Pool } = await import('pg');
    const tempPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: 'postgres',
    });

    try {
        const dbName = process.env.DB_NAME || 'grabados_express';
        const result = await tempPool.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName]
        );

        if (result.rows.length === 0) {
            console.log(`📦 Creating database "${dbName}"...`);
            await tempPool.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database "${dbName}" created successfully`);
        } else {
            console.log(`📦 Database "${dbName}" already exists`);
        }
    } catch (error) {
        console.error('Error checking/creating database:', error.message);
    } finally {
        await tempPool.end();
    }
}

async function runMigrations() {
    console.log('🚀 Starting migrations...\n');

    try {
        // First ensure database exists
        await createDatabase();

        // Read migration files
        const migrationsDir = path.join(__dirname, '..', 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log(`📁 Found ${files.length} migration file(s)\n`);

        for (const file of files) {
            console.log(`⏳ Running: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');

            try {
                await pool.query(sql);
                console.log(`✅ Completed: ${file}\n`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`⚠️  Skipped (already exists): ${file}\n`);
                } else {
                    throw error;
                }
            }
        }

        console.log('🎉 All migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
