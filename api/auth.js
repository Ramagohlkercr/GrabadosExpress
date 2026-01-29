// Vercel Serverless Function - Authentication
import { query } from './_lib/db.js';
import { handleCors, corsHeaders } from './_lib/cors.js';

// Simple password verification (for production, use bcrypt)
function verifyPassword(inputPassword, storedHash) {
    // For simplicity, we'll use a basic comparison
    // In production, use bcrypt.compare()
    return inputPassword === storedHash;
}

export default async function handler(req, res) {
    if (handleCors(req, res)) return;
    corsHeaders(res);

    const { method } = req;
    const action = req.query.action; // login, me, register

    try {
        if (method === 'POST' && action === 'login') {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ error: 'Email y contraseña requeridos' });
            }

            // Find user by email
            const result = await query(
                'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = $1',
                [email.toLowerCase()]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const user = result.rows[0];

            // Verify password
            if (!verifyPassword(password, user.password_hash)) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            // Create a simple token (for production, use JWT)
            const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64');

            return res.json({
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    email: user.email,
                    role: user.rol
                },
                token
            });
        }

        if (method === 'GET' && action === 'me') {
            // Get user from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No autorizado' });
            }

            const token = authHeader.split(' ')[1];
            try {
                const decoded = Buffer.from(token, 'base64').toString('utf-8');
                const [userId] = decoded.split(':');
                
                const result = await query(
                    'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1',
                    [userId]
                );

                if (result.rows.length === 0) {
                    return res.status(401).json({ error: 'Usuario no encontrado' });
                }

                return res.json({
                    id: result.rows[0].id,
                    nombre: result.rows[0].nombre,
                    email: result.rows[0].email,
                    role: result.rows[0].rol
                });
            } catch {
                return res.status(401).json({ error: 'Token inválido' });
            }
        }

        return res.status(405).json({ error: 'Método no permitido' });
    } catch (error) {
        console.error('Auth API Error:', error);
        return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
}
