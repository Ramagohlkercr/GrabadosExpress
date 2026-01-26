import { CheckCircle, Truck, Play, FileText, Package } from 'lucide-react';
import { ESTADOS_PEDIDO } from '../lib/storageApi';
import { formatearFecha } from '../lib/dateUtils';

export default function OrderTimeline({ estado, historial }) {
    const steps = [
        { id: ESTADOS_PEDIDO.COTIZACION, label: 'Cotización', icon: FileText },
        { id: ESTADOS_PEDIDO.CONFIRMADO, label: 'Confirmado', icon: CheckCircle },
        { id: ESTADOS_PEDIDO.EN_PRODUCCION, label: 'En Producción', icon: Play },
        { id: ESTADOS_PEDIDO.TERMINADO, label: 'Terminado', icon: Package },
        { id: ESTADOS_PEDIDO.ENTREGADO, label: 'Entregado', icon: Truck },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === estado);

    return (
        <div className="order-timeline">
            <div className="timeline-steps">
                {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                        <div key={step.id} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                            <div className="step-icon">
                                <step.icon size={16} />
                            </div>
                            <div className="step-label">{step.label}</div>
                            {/* Line connector */}
                            {index < steps.length - 1 && (
                                <div className={`step-connector ${index < currentStepIndex ? 'completed' : ''}`} />
                            )}
                        </div>
                    );
                })}
            </div>

            <style>{`
                .order-timeline {
                    padding: 1rem 0;
                    width: 100%;
                }

                .timeline-steps {
                    display: flex;
                    justify-content: space-between;
                    position: relative;
                }

                .timeline-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    flex: 1;
                    z-index: 1;
                }

                .step-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--bg-tertiary);
                    border: 2px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    margin-bottom: 0.5rem;
                    transition: all var(--transition-normal);
                }

                .step-label {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    font-weight: 500;
                    text-align: center;
                }

                .step-connector {
                    position: absolute;
                    top: 16px;
                    left: 50%;
                    width: 100%;
                    height: 2px;
                    background: var(--border-color);
                    z-index: -1;
                    transform: translateY(-50%);
                }

                .timeline-step:last-child .step-connector {
                    display: none;
                }

                /* States */
                .timeline-step.completed .step-icon {
                    background: var(--accent);
                    border-color: var(--accent);
                    color: white;
                }

                .timeline-step.completed .step-label {
                    color: var(--text-primary);
                }

                .timeline-step.current .step-icon {
                    box-shadow: 0 0 0 4px var(--accent-glow);
                }

                .step-connector.completed {
                    background: var(--accent);
                }
                
                @media (max-width: 600px) {
                   .step-label {
                       display: none;
                   }
                   .timeline-step.current .step-label {
                       display: block;
                       position: absolute;
                       top: 100%;
                       width: 100px;
                   }
                }
            `}</style>
        </div>
    );
}
