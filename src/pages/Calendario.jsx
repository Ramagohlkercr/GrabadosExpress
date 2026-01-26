import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Package,
  Loader2
} from 'lucide-react';
import {
  getPedidosAsync,
  getClientesAsync,
  ESTADOS_PEDIDO,
  ESTADOS_LABELS
} from '../lib/storageApi';
import {
  formatearFecha,
  getNivelUrgencia
} from '../lib/dateUtils';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  format,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';

export default function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [pedidosDelDia, setPedidosDelDia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [pedidosData, clientesData] = await Promise.all([
        getPedidosAsync(),
        getClientesAsync()
      ]);
      setPedidos(pedidosData.filter(p =>
        p.estado !== ESTADOS_PEDIDO.ENTREGADO &&
        p.estado !== ESTADOS_PEDIDO.CANCELADO
      ));
      setClientes(clientesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getCliente(clienteId) {
    return clientes.find(c => c.id === clienteId);
  }

  function getPedidosPorFecha(date) {
    const dateStr = format(date, 'yyyy-MM-dd');
    return pedidos.filter(p => {
      if (!p.fechaEntregaEstimada) return false;
      return format(parseISO(p.fechaEntregaEstimada), 'yyyy-MM-dd') === dateStr;
    });
  }

  function handleDayClick(date) {
    setSelectedDate(date);
    setPedidosDelDia(getPedidosPorFecha(date));
  }

  function renderCalendar() {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayPedidos = getPedidosPorFecha(day);
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate && isSameDay(day, selectedDate);

        // Get urgency class
        let urgencyClass = '';
        if (dayPedidos.length > 0) {
          const hasAtrasado = dayPedidos.some(p => getNivelUrgencia(p.fechaEntregaEstimada) === 'atrasado');
          const hasHoy = dayPedidos.some(p => getNivelUrgencia(p.fechaEntregaEstimada) === 'hoy');
          if (hasAtrasado) urgencyClass = 'atrasado';
          else if (hasHoy) urgencyClass = 'hoy';
        }

        days.push(
          <div
            key={day.toString()}
            className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayPedidos.length > 0 ? 'has-events' : ''} ${urgencyClass}`}
            onClick={() => handleDayClick(cloneDay)}
          >
            <span className="day-number">{format(day, 'd')}</span>
            {dayPedidos.length > 0 && (
              <div className="day-events">
                <span className="event-count">{dayPedidos.length}</span>
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="calendar-row" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return rows;
  }

  if (loading) {
    return (
      <div className="calendario-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="calendario-page">
      <div className="page-header">
        <div className="page-title">
          <div className="icon">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1>Calendario</h1>
            <p className="text-muted">Entregas programadas</p>
          </div>
        </div>
      </div>

      <div className="calendario-layout">
        {/* Calendar */}
        <div className="card calendario-card">
          <div className="calendar-header">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft size={20} />
            </button>
            <h2>
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="calendar-weekdays">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-body">
            {renderCalendar()}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot today" />
              <span>Hoy</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot has-events" />
              <span>Entregas</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot atrasado" />
              <span>Atrasado</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="card day-details">
          <div className="card-header">
            <h3 className="card-title">
              <Package size={18} />
              {selectedDate
                ? format(selectedDate, "d 'de' MMMM", { locale: es })
                : 'Seleccioná un día'
              }
            </h3>
          </div>
          <div className="card-body">
            {!selectedDate ? (
              <p className="text-muted text-center">
                Hacé clic en un día para ver las entregas
              </p>
            ) : pedidosDelDia.length === 0 ? (
              <p className="text-muted text-center">
                No hay entregas este día
              </p>
            ) : (
              <div className="day-pedidos">
                {pedidosDelDia.map(pedido => {
                  const cliente = getCliente(pedido.clienteId);
                  const estadoInfo = ESTADOS_LABELS[pedido.estado];

                  return (
                    <div key={pedido.id} className="day-pedido">
                      <div className="pedido-header">
                        <span className="pedido-numero">#{pedido.numero}</span>
                        <span className={`badge badge-${estadoInfo.color}`}>
                          {estadoInfo.label}
                        </span>
                      </div>
                      <div className="pedido-cliente">
                        {cliente?.nombre || 'Sin cliente'}
                      </div>
                      <div className="pedido-total">
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
        .calendario-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 1.5rem;
          align-items: start;
        }
        
        @media (max-width: 900px) {
          .calendario-layout {
            grid-template-columns: 1fr;
          }
        }
        
        .calendario-card {
          padding: 1.5rem;
        }
        
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .calendar-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 0.5rem;
        }
        
        .weekday {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          padding: 0.5rem;
        }
        
        .calendar-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .calendar-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        
        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
          min-height: 50px;
        }
        
        .calendar-day:hover {
          background: var(--bg-hover);
        }
        
        .calendar-day.other-month {
          opacity: 0.3;
        }
        
        .calendar-day.today {
          border: 2px solid var(--accent);
        }
        
        .calendar-day.selected {
          background: var(--accent);
        }
        
        .calendar-day.selected .day-number {
          color: white;
        }
        
        .calendar-day.has-events {
          background: var(--accent-glow);
        }
        
        .calendar-day.atrasado {
          background: var(--danger-bg);
          border-color: var(--danger);
        }
        
        .calendar-day.hoy:not(.selected) {
          background: var(--warning-bg);
        }
        
        .day-number {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .day-events {
          position: absolute;
          bottom: 4px;
        }
        
        .event-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          background: var(--accent);
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          border-radius: 9px;
          padding: 0 4px;
        }
        
        .calendar-legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }
        
        .legend-dot.today {
          border: 2px solid var(--accent);
          background: transparent;
        }
        
        .legend-dot.has-events {
          background: var(--accent-glow);
        }
        
        .legend-dot.atrasado {
          background: var(--danger);
        }
        
        .day-details {
          position: sticky;
          top: 80px;
        }
        
        .day-pedidos {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .day-pedido {
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .day-pedido .pedido-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        
        .day-pedido .pedido-numero {
          font-weight: 600;
        }
        
        .day-pedido .pedido-cliente {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }
        
        .day-pedido .pedido-total {
          font-weight: 600;
          color: var(--accent);
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .calendario-card {
            padding: 1rem;
          }
          
          .calendar-header h2 {
            font-size: 1rem;
          }
          
          .weekday {
            font-size: 0.65rem;
            padding: 0.25rem;
          }
          
          .calendar-day {
            min-height: 40px;
          }
          
          .day-number {
            font-size: 0.75rem;
          }
          
          .event-count {
            min-width: 14px;
            height: 14px;
            font-size: 0.6rem;
          }
          
          .calendar-legend {
            gap: 0.75rem;
            flex-wrap: wrap;
            justify-content: flex-start;
          }
          
          .legend-item {
            font-size: 0.65rem;
          }
          
          .day-details {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}
