import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Check if using Neon (connection string) or local PostgreSQL
const isNeon = process.env.DATABASE_URL?.includes('neon.tech');

const poolConfig = process.env.DATABASE_URL
    ? {
        // Neon or other cloud PostgreSQL (uses connection string)
        connectionString: process.env.DATABASE_URL,
        ssl: isNeon ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    }
    : {
        // Local PostgreSQL
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'grabados_express',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
    console.log('📦 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;

// Helper function for queries
export const query = async (text, params) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
};

// Transaction helper
export const getClient = async () => {
    const client = await pool.connect();
    const originalQuery = client.query.bind(client);
    const release = () => {
        client.release();
    };
    return { client, query: originalQuery, release };
};
