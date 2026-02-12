import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Debug: Log localStorage status on app start
const STORAGE_KEY = 'grabados_express_data';
const storedData = localStorage.getItem(STORAGE_KEY);
if (storedData) {
    try {
        const parsed = JSON.parse(storedData);
        console.log('[INIT] App starting - localStorage has:', {
            clientes: parsed.clientes?.length || 0,
            pedidos: parsed.pedidos?.length || 0,
            productos: parsed.productos?.length || 0,
        });
    } catch (e) {
        console.error('[INIT] Error parsing localStorage:', e);
    }
} else {
    console.log('[INIT] App starting - NO localStorage data found');
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
)
