import { Menu, Bell, Search, User, ChevronDown, Package, Box, Wallet, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { obtenerNotificaciones, PRIORIDAD } from '../../lib/notificaciones';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificacionesData, setNotificacionesData] = useState({
    notificaciones: [],
    porCategoria: { pedidos: [], stock: [], pagos: [] },
    stats: { total: 0, criticas: 0, altas: 0 },
    hayCriticas: false,
  });
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [loading, setLoading] = useState(true);
  const notifRef = useRef(null);

  useEffect(() => {
    loadNotificaciones();
    // Actualizar cada 2 minutos
    const interval = setInterval(loadNotificaciones, 120000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotificaciones() {
    try {
      setLoading(true);
      const data = await obtenerNotificaciones();
      setNotificacionesData(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  const { notificaciones, porCategoria, stats, hayCriticas } = notificacionesData;
  const totalAlertas = stats.total || 0;

  // Get user initials
  const userInitials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  function handleLogout() {
    logout();
    setShowUserMenu(false);
  }

  // Filtrar notificaciones por categoría
  const notificacionesFiltradas = filtroCategoria === 'todas' 
    ? notificaciones 
    : porCategoria[filtroCategoria] || [];

  function handleNotificationClick(notif) {
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link.split('?')[0]); // Navigate to base path
    }
  }

  function getColorClass(prioridad) {
    switch (prioridad) {
      case PRIORIDAD.CRITICA: return 'danger';
      case PRIORIDAD.ALTA: return 'warning';
      case PRIORIDAD.MEDIA: return 'info';
      default: return 'success';
    }
  }

  return (
    <header className={`app-header ${hayCriticas ? 'has-critical' : ''}`}>
      <div className="header-left">
        <button className="btn btn-ghost btn-icon mobile-only" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
      </div>

      <div className="header-right">
        {/* Notifications */}
        <div className="notification-wrapper" ref={notifRef}>
          <button
            className={`btn btn-ghost btn-icon notification-btn ${hayCriticas ? 'has-critical' : ''}`}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
              if (!showNotifications) loadNotificaciones(); // Refresh on open
            }}
          >
            <Bell size={20} />
            {totalAlertas > 0 && (
              <span className={`notification-badge ${hayCriticas ? 'critical' : ''}`}>
                {totalAlertas > 99 ? '99+' : totalAlertas}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <div className="notification-header-top">
                  <h4>
                    <Bell size={18} />
                    Notificaciones
                  </h4>
                  <button 
                    className="notification-close"
                    onClick={() => setShowNotifications(false)}
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {/* Estadísticas rápidas */}
                {totalAlertas > 0 && (
                  <div className="notification-stats">
                    {stats.criticas > 0 && (
                      <span className="stat-badge danger">
                        <AlertTriangle size={12} />
                        {stats.criticas} urgente{stats.criticas > 1 ? 's' : ''}
                      </span>
                    )}
                    {stats.altas > 0 && (
                      <span className="stat-badge warning">
                        <Clock size={12} />
                        {stats.altas} próximo{stats.altas > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* Filtros de categoría */}
                <div className="notification-filters">
                  <button 
                    className={`filter-btn ${filtroCategoria === 'todas' ? 'active' : ''}`}
                    onClick={() => setFiltroCategoria('todas')}
                  >
                    Todas ({stats.total})
                  </button>
                  <button 
                    className={`filter-btn ${filtroCategoria === 'pedidos' ? 'active' : ''}`}
                    onClick={() => setFiltroCategoria('pedidos')}
                  >
                    <Package size={14} />
                    Pedidos ({porCategoria.pedidos?.length || 0})
                  </button>
                  <button 
                    className={`filter-btn ${filtroCategoria === 'stock' ? 'active' : ''}`}
                    onClick={() => setFiltroCategoria('stock')}
                  >
                    <Box size={14} />
                    Stock ({porCategoria.stock?.length || 0})
                  </button>
                  <button 
                    className={`filter-btn ${filtroCategoria === 'pagos' ? 'active' : ''}`}
                    onClick={() => setFiltroCategoria('pagos')}
                  >
                    <Wallet size={14} />
                    Pagos ({porCategoria.pagos?.length || 0})
                  </button>
                </div>
              </div>

              <div className="notification-list">
                {loading ? (
                  <div className="notification-loading">
                    <div className="spinner-small"></div>
                    Cargando...
                  </div>
                ) : notificacionesFiltradas.length === 0 ? (
                  <div className="notification-empty">
                    <CheckCircle size={48} />
                    <p>¡Todo en orden!</p>
                    <span>No hay notificaciones pendientes</span>
                  </div>
                ) : (
                  notificacionesFiltradas.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${getColorClass(notif.prioridad)}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notification-icon">{notif.icono}</div>
                      <div className="notification-content">
                        <div className="notification-title">{notif.titulo}</div>
                        <div className="notification-time">{notif.mensaje}</div>
                      </div>
                      <div className={`notification-priority ${notif.prioridad}`}></div>
                    </div>
                  ))
                )}
              </div>

              {totalAlertas > 0 && (
                <div className="notification-footer">
                  <button 
                    className="btn-view-all"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/pedidos');
                    }}
                  >
                    Ver todos los pedidos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="user-wrapper">
          <button
            className="user-btn"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
          >
            <div className="user-avatar">{userInitials}</div>
            <span className="user-name">{user?.nombre || 'Usuario'}</span>
            <ChevronDown size={16} />
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-avatar-lg">{userInitials}</div>
                <div className="user-info">
                  <div className="user-info-name">{user?.nombre || 'Admin'}</div>
                  <div className="user-info-email">{user?.email || 'admin@grabadosexpress.com'}</div>
                  <div className="user-info-role badge badge-primary mt-1" style={{ fontSize: '0.7rem', display: 'inline-block' }}>ADMIN</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: linear-gradient(180deg, rgba(12, 12, 18, 0.95) 0%, rgba(12, 12, 18, 0.8) 100%);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        
        .app-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent-glow), transparent);
        }
        
        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .mobile-only {
          display: none;
        }
        
        @media (max-width: 768px) {
          .mobile-only {
            display: flex;
          }
        }
        
        .notification-wrapper {
          position: relative;
        }
        
        .notification-btn {
          position: relative;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          transition: all var(--transition-normal);
        }
        
        .notification-btn:hover {
          border-color: var(--accent);
          box-shadow: 0 0 20px var(--accent-glow);
        }
        
        .notification-btn.has-critical {
          border-color: var(--danger);
          animation: critical-pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes critical-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.6); }
        }
        
        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          background: linear-gradient(135deg, var(--accent), #d97706);
          color: #000;
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px var(--accent-glow);
        }
        
        .notification-badge.critical {
          background: linear-gradient(135deg, var(--danger), #dc2626);
          color: white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
          animation: pulse-notification 2s infinite;
        }
        
        @keyframes pulse-notification {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .notification-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 400px;
          background: linear-gradient(145deg, var(--bg-secondary), var(--bg-primary));
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl), 0 0 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: dropdown-appear 0.2s ease;
        }
        
        @keyframes dropdown-appear {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .notification-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-tertiary);
        }
        
        .notification-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .notification-header h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        
        .notification-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }
        
        .notification-close:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }
        
        .notification-stats {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .stat-badge {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: var(--radius-full);
        }
        
        .stat-badge.danger {
          background: rgba(239, 68, 68, 0.15);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .stat-badge.warning {
          background: rgba(245, 158, 11, 0.15);
          color: var(--warning);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .notification-filters {
          display: flex;
          gap: 0.375rem;
          overflow-x: auto;
          padding-bottom: 0.25rem;
        }
        
        .filter-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        
        .filter-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        
        .filter-btn.active {
          background: var(--accent-gradient);
          color: #000;
          border-color: transparent;
          font-weight: 600;
        }
        
        .notification-list {
          max-height: 380px;
          overflow-y: auto;
        }
        
        .notification-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 2rem;
          color: var(--text-muted);
        }
        
        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid var(--border-color);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .notification-empty {
          padding: 3rem 1.5rem;
          text-align: center;
          color: var(--text-muted);
        }
        
        .notification-empty svg {
          color: var(--success);
          margin-bottom: 1rem;
          opacity: 0.7;
        }
        
        .notification-empty p {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }
        
        .notification-empty span {
          font-size: 0.85rem;
        }
        
        .notification-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }
        
        .notification-item:hover {
          background: var(--bg-hover);
        }
        
        .notification-item:last-child {
          border-bottom: none;
        }
        
        .notification-item.danger {
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.1), transparent);
          border-left: 3px solid var(--danger);
        }
        
        .notification-item.warning {
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.1), transparent);
          border-left: 3px solid var(--warning);
        }
        
        .notification-item.info {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), transparent);
          border-left: 3px solid var(--info);
        }
        
        .notification-item.success {
          background: linear-gradient(90deg, rgba(34, 197, 94, 0.08), transparent);
          border-left: 3px solid var(--success);
        }
        
        .notification-icon {
          font-size: 1.25rem;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }
        
        .notification-content {
          flex: 1;
          min-width: 0;
        }
        
        .notification-priority {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .notification-priority.critica {
          background: var(--danger);
          box-shadow: 0 0 8px var(--danger);
        }
        
        .notification-priority.alta {
          background: var(--warning);
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
        }
        
        .notification-priority.media {
          background: var(--info);
        }
        
        .notification-priority.baja {
          background: var(--success);
        }
        
        .notification-footer {
          padding: 0.875rem 1.25rem;
          border-top: 1px solid var(--border-color);
          background: var(--bg-tertiary);
        }
        
        .btn-view-all {
          width: 100%;
          padding: 0.625rem 1rem;
          background: var(--accent-gradient);
          color: #000;
          font-size: 0.8rem;
          font-weight: 600;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .btn-view-all:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px var(--accent-glow);
        }
        
        .notification-title {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }
        
        .notification-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        /* User Menu Styles */
        .user-wrapper {
          position: relative;
        }
        
        .user-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem 0.5rem 0.5rem;
          background: linear-gradient(145deg, var(--bg-tertiary), var(--bg-secondary));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
          color: var(--text-primary);
        }
        
        .user-btn:hover {
          background: var(--bg-hover);
          border-color: var(--accent);
          box-shadow: 0 0 20px var(--accent-glow);
        }
        
        .user-avatar {
          width: 36px;
          height: 36px;
          background: var(--accent-gradient);
          color: #000;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          box-shadow: 0 2px 8px var(--accent-glow);
        }
        
        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        @media (max-width: 768px) {
          .user-name {
            display: none;
          }
          
          .user-btn {
            padding: 0.5rem;
          }
          
          .app-header {
            padding: 0.75rem 1rem;
          }
          
          .notification-dropdown {
            width: calc(100vw - 2rem);
            right: -0.5rem;
            max-height: 80vh;
          }
          
          .notification-header {
            padding: 0.875rem 1rem;
          }
          
          .notification-filters {
            gap: 0.25rem;
          }
          
          .filter-btn {
            padding: 0.35rem 0.6rem;
            font-size: 0.7rem;
          }
          
          .notification-item {
            padding: 0.75rem 1rem;
          }
          
          .notification-icon {
            width: 32px;
            height: 32px;
            font-size: 1.1rem;
          }
          
          .notification-title {
            font-size: 0.8rem;
          }
          
          .notification-time {
            font-size: 0.7rem;
          }
          
          .notification-list {
            max-height: calc(80vh - 180px);
          }
          
          .user-dropdown {
            width: calc(100vw - 2rem);
            right: -0.5rem;
          }
          
          .user-dropdown-header {
            padding: 1rem;
          }
          
          .user-avatar-lg {
            width: 44px;
            height: 44px;
            font-size: 1rem;
          }
          
          .user-info-name {
            font-size: 0.875rem;
          }
          
          .user-dropdown-item {
            padding: 0.875rem 1rem;
          }
        }
        
        @media (max-width: 430px) {
          .app-header {
            padding: 0.65rem 0.875rem;
          }
          
          .header-right {
            gap: 0.5rem;
          }
          
          .notification-btn,
          .user-btn {
            width: 40px;
            height: 40px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .user-avatar {
            width: 32px;
            height: 32px;
            font-size: 0.7rem;
          }
          
          .notification-badge {
            min-width: 18px;
            height: 18px;
            font-size: 0.65rem;
            top: -3px;
            right: -3px;
          }
          
          .notification-dropdown {
            width: 100vw;
            right: -0.875rem;
            border-radius: 0 0 var(--radius-xl) var(--radius-xl);
            max-height: 85vh;
          }
          
          .notification-header-top h4 {
            font-size: 0.9rem;
          }
          
          .notification-stats {
            flex-wrap: wrap;
          }
          
          .stat-badge {
            padding: 0.3rem 0.6rem;
            font-size: 0.7rem;
          }
          
          .filter-btn {
            padding: 0.3rem 0.5rem;
            font-size: 0.65rem;
          }
          
          .notification-list {
            max-height: calc(85vh - 200px);
          }
          
          .notification-item {
            padding: 0.65rem 0.875rem;
            gap: 0.65rem;
          }
          
          .notification-icon {
            width: 30px;
            height: 30px;
            font-size: 1rem;
          }
          
          .notification-priority {
            width: 6px;
            height: 6px;
          }
          
          .notification-footer {
            padding: 0.75rem 0.875rem;
          }
          
          .btn-view-all {
            padding: 0.6rem;
            font-size: 0.75rem;
          }
        }
        
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          background: linear-gradient(145deg, var(--bg-secondary), var(--bg-primary));
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl), 0 0 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          z-index: 100;
          animation: dropdown-appear 0.2s ease;
        }
        
        .user-dropdown-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-hover));
          border-bottom: 1px solid var(--border-color);
        }
        
        .user-avatar-lg {
          width: 52px;
          height: 52px;
          background: var(--accent-gradient);
          color: #000;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          font-weight: 700;
          box-shadow: 0 4px 15px var(--accent-glow);
        }
        
        .user-info {
          flex: 1;
          min-width: 0;
        }
        
        .user-info-name {
          font-weight: 700;
          font-size: 0.95rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 0.125rem;
        }
        
        .user-info-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .user-info-role {
          margin-top: 0.5rem;
        }
        
        .user-dropdown-divider {
          height: 1px;
          background: var(--border-color);
        }
        
        .user-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          width: 100%;
          padding: 1rem 1.25rem;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .user-dropdown-item:hover {
          background: var(--bg-hover);
          color: var(--accent);
        }
        
        .user-dropdown-item svg {
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }
        
        .user-dropdown-item:hover svg {
          color: var(--accent);
        }
        
        .badge-primary {
          background: var(--accent-glow);
          color: var(--accent);
          border: 1px solid var(--border-glow);
        }
      `}</style>
    </header>
  );
}
