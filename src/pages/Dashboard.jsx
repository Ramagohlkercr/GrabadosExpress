import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowRight,
  Zap,
  TrendingUp,
  Calendar,
  CheckCircle,
  Play,
  Loader2,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  getEstadisticasAsync,
  getPedidosAsync,
  getClientesAsync,
  ESTADOS_PEDIDO,
  ESTADOS_LABELS,
  checkApiStatus
} from '../lib/storageApi';
import {
  formatearFecha,
  formatearFechaRelativa,
  getNivelUrgencia,
  getEntregasSemana
} from '../lib/dateUtils';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';


export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [entregasSemana, setEntregasSemana] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Check API status and load data
        await checkApiStatus();

        const [estadisticas, pedidos, clientesData] = await Promise.all([
          getEstadisticasAsync(),
          getPedidosAsync(),
          getClientesAsync()
        ]);

        setStats(estadisticas);
        setClientes(clientesData);

        const pedidosActivos = pedidos
          .filter(p => p.estado !== ESTADOS_PEDIDO.ENTREGADO && p.estado !== ESTADOS_PEDIDO.CANCELADO)
          .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
          .slice(0, 5);

        setPedidosRecientes(pedidosActivos);
        setEntregasSemana(getEntregasSemana(pedidos));
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getCliente = (clienteId) => clientes.find(c => c.id === clienteId);

  if (loading) {
    return (
      <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!stats) return null;


  const statCards = [
    {
      label: 'Pedidos Activos',
      value: stats.pedidosActivos,
      icon: Package,
      iconClass: 'accent',
      onClick: () => navigate('/pedidos'),
    },
    {
      label: 'En Producción',
      value: stats.pedidosEnProduccion,
      icon: Play,
      iconClass: 'warning',
      onClick: () => navigate('/pedidos?estado=en_produccion'),
    },
    {
      label: 'Ingresos del Mes',
      value: `$${stats.ingresosMes?.toLocaleString() || 0}`,
      icon: DollarSign,
      iconClass: 'success',
    },
    {
      label: 'Clientes',
      value: stats.clientesTotal,
      icon: Users,
      iconClass: 'info',
      onClick: () => navigate('/clientes'),
    },
  ];

  // Pie chart data for pedidos por estado
  const CHART_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];
  const pedidosPorEstado = [
    { name: 'Confirmados', value: stats.pedidosConfirmados || 0, color: '#3b82f6' },
    { name: 'En Producción', value: stats.pedidosEnProduccion || 0, color: '#f59e0b' },
    { name: 'Terminados', value: stats.pedidosTerminados || 0, color: '#10b981' },
    { name: 'Atrasados', value: stats.pedidosAtrasados || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Bar chart data for últimos 7 días
  const ventasSemana = entregasSemana.map((dia, i) => ({
    name: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][new Date(Date.now() - (6 - i) * 86400000).getDay()],
    entregas: dia.pedidos?.length || 0,
  }));

  return (
    <div className="dashboard">
      <div className="page-header">
        <div className="page-title">
          <div className="icon">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1>Dashboard</h1>
            <p className="text-muted">{formatearFecha(new Date(), "EEEE d 'de' MMMM, yyyy")}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/cotizador')}>
          <Zap size={18} />
          Nueva Cotización
        </button>
      </div>

      {/* Alertas */}
      {(stats.pedidosAtrasados > 0 || stats.insumosStockBajo > 0) && (
        <div className="alerts-section mb-lg">
          {stats.pedidosAtrasados > 0 && (
            <div className="alert alert-danger" onClick={() => navigate('/pedidos?filter=atrasados')}>
              <AlertTriangle size={20} />
              <span>
                <strong>{stats.pedidosAtrasados} pedido{stats.pedidosAtrasados > 1 ? 's' : ''} atrasado{stats.pedidosAtrasados > 1 ? 's' : ''}</strong>
                {' '}— Requieren atención inmediata
              </span>
              <ArrowRight size={18} />
            </div>
          )}
          {stats.insumosStockBajo > 0 && (
            <div className="alert alert-warning" onClick={() => navigate('/insumos')}>
              <AlertTriangle size={20} />
              <span>
                <strong>{stats.insumosStockBajo} insumo{stats.insumosStockBajo > 1 ? 's' : ''}</strong> con stock bajo
              </span>
              <ArrowRight size={18} />
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-4 mb-lg">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="stat-card"
            onClick={stat.onClick}
            style={{ cursor: stat.onClick ? 'pointer' : 'default' }}
          >
            <div className={`stat-icon ${stat.iconClass}`}>
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      {(pedidosPorEstado.length > 0 || stats.pedidosActivos > 0) && (
        <div className="grid grid-2 mb-lg">
          {/* Pie Chart - Pedidos por Estado */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <PieChartIcon size={18} />
                Pedidos por Estado
              </h3>
            </div>
            <div className="card-body chart-container">
              {pedidosPorEstado.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pedidosPorEstado}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {pedidosPorEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <p className="text-muted">No hay datos de pedidos</p>
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart - Entregas de la Semana */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <TrendingUp size={18} />
                Entregas Esta Semana
              </h3>
            </div>
            <div className="card-body chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ventasSemana}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="entregas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        {/* Pedidos Recientes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Package size={18} />
              Pedidos Activos
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/pedidos')}>
              Ver todos
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body">
            {pedidosRecientes.length === 0 ? (
              <div className="empty-state">
                <p className="text-muted">No hay pedidos activos</p>
                <button className="btn btn-primary btn-sm mt-md" onClick={() => navigate('/cotizador')}>
                  Crear primer pedido
                </button>
              </div>
            ) : (
              <div className="pedidos-list">
                {pedidosRecientes.map(pedido => {
                  const cliente = getCliente(pedido.clienteId);
                  const estadoInfo = ESTADOS_LABELS[pedido.estado];
                  const urgencia = getNivelUrgencia(pedido.fechaEntregaEstimada);

                  return (
                    <div
                      key={pedido.id}
                      className={`pedido-item ${urgencia}`}
                      onClick={() => navigate('/pedidos')}
                    >
                      <div className="pedido-info">
                        <div className="pedido-numero">#{pedido.numero}</div>
                        <div className="pedido-cliente">{cliente?.nombre || 'Sin cliente'}</div>
                      </div>
                      <div className="pedido-meta">
                        <span className={`badge badge-${estadoInfo.color}`}>
                          {estadoInfo.label}
                        </span>
                        {pedido.fechaEntregaEstimada && (
                          <span className="pedido-fecha">
                            {formatearFechaRelativa(pedido.fechaEntregaEstimada)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Entregas de la Semana */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={18} />
              Entregas Esta Semana
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendario')}>
              Ver calendario
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body">
            {entregasSemana.length === 0 ? (
              <div className="empty-state">
                <p className="text-muted">No hay entregas programadas</p>
              </div>
            ) : (
              <div className="entregas-list">
                {entregasSemana.slice(0, 5).map(pedido => {
                  const cliente = getCliente(pedido.clienteId);
                  const urgencia = getNivelUrgencia(pedido.fechaEntregaEstimada);

                  return (
                    <div key={pedido.id} className={`entrega-item ${urgencia}`}>
                      <div className="entrega-fecha">
                        <span className="entrega-dia">
                          {formatearFecha(pedido.fechaEntregaEstimada, 'dd')}
                        </span>
                        <span className="entrega-mes">
                          {formatearFecha(pedido.fechaEntregaEstimada, 'MMM')}
                        </span>
                      </div>
                      <div className="entrega-info">
                        <div className="entrega-numero">Pedido #{pedido.numero}</div>
                        <div className="entrega-cliente">{cliente?.nombre}</div>
                      </div>
                      <div className="entrega-total">
                        ${pedido.total?.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard {
          padding: 1rem 0;
        }
        
        .alerts-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .alert:hover {
          transform: translateX(4px);
        }
        
        .alert-danger {
          background: var(--danger-bg);
          color: var(--danger);
          border: 1px solid var(--danger);
        }
        
        .alert-warning {
          background: var(--warning-bg);
          color: var(--warning);
          border: 1px solid var(--warning);
        }
        
        .alert span {
          flex: 1;
        }
        
        .pedidos-list, .entregas-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .pedido-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          border-left: 3px solid transparent;
        }
        
        .pedido-item:hover {
          background: var(--bg-hover);
        }
        
        .pedido-item.atrasado {
          border-left-color: var(--danger);
          background: var(--danger-bg);
        }
        
        .pedido-item.hoy, .pedido-item.urgente {
          border-left-color: var(--warning);
        }
        
        .pedido-numero {
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .pedido-cliente {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .pedido-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }
        
        .pedido-fecha {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        
        .entrega-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          border-left: 3px solid var(--accent);
        }
        
        .entrega-item.hoy {
          border-left-color: var(--warning);
          background: var(--warning-bg);
        }
        
        .entrega-item.atrasado {
          border-left-color: var(--danger);
          background: var(--danger-bg);
        }
        
        .entrega-fecha {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 40px;
        }
        
        .entrega-dia {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1;
        }
        
        .entrega-mes {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        
        .entrega-info {
          flex: 1;
        }
        
        .entrega-numero {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .entrega-cliente {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .entrega-total {
          font-weight: 600;
          color: var(--accent);
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .dashboard { padding: 0.5rem 0; }
          
          .dashboard .page-header {
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          
          .dashboard .page-header .btn {
            width: 100%;
            justify-content: center;
          }
          
          .dashboard .page-title p {
            font-size: 0.7rem;
          }
          
          .grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem;
          }
          
          .grid-2 {
            grid-template-columns: 1fr !important;
            gap: 0.75rem;
          }
          
          .stat-card {
            padding: 0.75rem;
          }
          
          .stat-icon {
            width: 36px;
            height: 36px;
          }
          
          .stat-icon svg {
            width: 18px;
            height: 18px;
          }
          
          .stat-label {
            font-size: 0.65rem;
          }
          
          .stat-value {
            font-size: 1.1rem;
          }
          
          .alert {
            padding: 0.75rem;
            font-size: 0.8rem;
          }
          
          .alert span {
            font-size: 0.75rem;
          }
          
          .card-header {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .card-title {
            font-size: 0.9rem;
          }
          
          .pedido-item, .entrega-item {
            padding: 0.6rem;
          }
          
          .pedido-numero, .entrega-numero {
            font-size: 0.8rem;
          }
          
          .pedido-cliente, .entrega-cliente {
            font-size: 0.7rem;
          }
          
          .entrega-dia {
            font-size: 1rem;
          }
          
          .entrega-total {
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 400px) {
          .stat-card {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
          }
          
          .stat-content {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
