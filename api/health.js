// Vercel Serverless Function - Health Check
export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        platform: 'vercel'
    });
}
