import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import OfflineIndicator from './components/ui/OfflineIndicator';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Productos from './pages/Productos';
import Insumos from './pages/Insumos';
import Cotizador from './pages/Cotizador';
import Pedidos from './pages/Pedidos';
import Calendario from './pages/Calendario';
import Configuracion from './pages/Configuracion';
import Asistente from './pages/Asistente';
import Envios from './pages/Envios';
import Gastos from './pages/Gastos';
import Conversaciones from './pages/Conversaciones';
import Login from './pages/Login';
import { clientesApi, pedidosApi, insumosApi } from './lib/api';
import { initOfflineDB } from './lib/offlineStorage';

// API handlers for sync queue
const apiHandlers = {
    clientes: clientesApi,
    pedidos: pedidosApi,
    insumos: insumosApi,
};

// Main layout for authenticated pages
function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Initialize offline database
    useEffect(() => {
        initOfflineDB().catch(console.error);
    }, []);

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="main-content">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <main className="page-content">
                    {children}
                </main>
            </div>
            
            {/* Offline status indicator */}
            <OfflineIndicator apiHandlers={apiHandlers} />
        </div>
    );
}

// Protected layout wrapper
function ProtectedLayout({ children }) {
    return (
        <PrivateRoute>
            <Layout>{children}</Layout>
        </PrivateRoute>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public route */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes */}
                <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
                <Route path="/clientes" element={<ProtectedLayout><Clientes /></ProtectedLayout>} />
                <Route path="/productos" element={<ProtectedLayout><Productos /></ProtectedLayout>} />
                <Route path="/insumos" element={<ProtectedLayout><Insumos /></ProtectedLayout>} />
                <Route path="/cotizador" element={<ProtectedLayout><Cotizador /></ProtectedLayout>} />
                <Route path="/pedidos" element={<ProtectedLayout><Pedidos /></ProtectedLayout>} />
                <Route path="/calendario" element={<ProtectedLayout><Calendario /></ProtectedLayout>} />
                <Route path="/configuracion" element={<ProtectedLayout><Configuracion /></ProtectedLayout>} />
                <Route path="/asistente" element={<ProtectedLayout><Asistente /></ProtectedLayout>} />
                <Route path="/envios" element={<ProtectedLayout><Envios /></ProtectedLayout>} />
                <Route path="/gastos" element={<ProtectedLayout><Gastos /></ProtectedLayout>} />
                <Route path="/conversaciones" element={<ProtectedLayout><Conversaciones /></ProtectedLayout>} />
                
                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}
