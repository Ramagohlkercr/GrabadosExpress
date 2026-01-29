// Database connection for Vercel Serverless
import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPool() {
    if (!pool) {
        const isNeon = process.env.DATABASE_URL?.includes('neon.tech');
        
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: isNeon ? { rejectUnauthorized: false } : false,
            max: 5, // Lower for serverless
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 10000,
        });
    }
    return pool;
}

export async function query(text, params) {
    const pool = getPool();
    const res = await pool.query(text, params);
    return res;
}
