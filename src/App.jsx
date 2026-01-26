import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
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

// Main layout for all pages
function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="main-content">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/productos" element={<Productos />} />
                    <Route path="/insumos" element={<Insumos />} />
                    <Route path="/cotizador" element={<Cotizador />} />
                    <Route path="/pedidos" element={<Pedidos />} />
                    <Route path="/calendario" element={<Calendario />} />
                    <Route path="/configuracion" element={<Configuracion />} />
                    <Route path="/asistente" element={<Asistente />} />
                    <Route path="/envios" element={<Envios />} />
                    {/* Redirect login to dashboard if someone tries to access it */}
                    <Route path="/login" element={<Dashboard />} />
                </Routes>
            </Layout>
        </AuthProvider>
    );
}
