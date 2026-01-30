import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Package,
    Box,
    Calculator,
    ClipboardList,
    Calendar,
    Settings,
    Zap,
    X,
    Bell,
    Sparkles,
    Truck,
    Receipt
} from 'lucide-react';
import { getEstadisticas } from '../../lib/storage';
import { useEffect, useState } from 'react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pedidos', icon: ClipboardList, label: 'Pedidos', badge: true },
    { to: '/cotizador', icon: Calculator, label: 'Cotizador' },
    { to: '/gastos', icon: Receipt, label: 'Gastos' },
    // { to: '/envios', icon: Truck, label: 'Envíos' }, // Oculto hasta tener credenciales API
    { to: '/asistente', icon: Sparkles, label: 'Asistente IA', highlight: true },
    { to: '/clientes', icon: Users, label: 'Clientes' },
    { to: '/productos', icon: Package, label: 'Productos' },
    { to: '/insumos', icon: Box, label: 'Insumos' },
    { to: '/calendario', icon: Calendar, label: 'Calendario' },
];

const bottomNavItems = [
    { to: '/configuracion', icon: Settings, label: 'Configuración' },
];

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const [stats, setStats] = useState({ pedidosActivos: 0, pedidosAtrasados: 0 });

    useEffect(() => {
        const updateStats = () => {
            setStats(getEstadisticas());
        };
        updateStats();

        // Update every minute
        const interval = setInterval(updateStats, 60000);
        return () => clearInterval(interval);
    }, [location]);

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={onClose} />
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <Zap size={24} />
                        </div>
                        <div className="sidebar-logo-text">
                            Grabados<span>Express</span>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon mobile-only" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">Principal</div>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <item.icon className="icon" size={20} />
                                <span>{item.label}</span>
                                {item.badge && stats.pedidosActivos > 0 && (
                                    <span className="nav-badge">{stats.pedidosActivos}</span>
                                )}
                            </NavLink>
                        ))}
                    </div>

                    {stats.pedidosAtrasados > 0 && (
                        <div className="nav-section">
                            <div className="nav-section-title">Alertas</div>
                            <NavLink
                                to="/pedidos?filter=atrasados"
                                className="nav-link"
                                style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                                onClick={onClose}
                            >
                                <Bell className="icon" size={20} />
                                <span>Pedidos atrasados</span>
                                <span className="nav-badge">{stats.pedidosAtrasados}</span>
                            </NavLink>
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer">
                    {bottomNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <item.icon className="icon" size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </aside>
        </>
    );
}
