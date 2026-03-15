import React from 'react';
import { Check, Package, Truck, User } from 'lucide-react';

type TimelineStatus = 'pendiente' | 'preparando' | 'en_camino' | 'entregado' | 'cancelado';

interface TimelineEvent {
  status: TimelineStatus;
  title: string;
  description: string;
  isCurrent: boolean;
  isCompleted: boolean;
}

interface TimelineProps {
  status: TimelineStatus;
  repartidor?: {
    nombre: string;
    telefono?: string;
    foto_url?: string;
  };
}

const Timeline: React.FC<TimelineProps> = ({ status, repartidor }) => {
  const events: TimelineEvent[] = [
    {
      status: 'pendiente',
      title: 'Solicitud Recibida',
      description: 'Hemos recibido tu pedido y lo estamos procesando.',
      isCurrent: status === 'pendiente',
      isCompleted: status !== 'pendiente',
    },
    {
      status: 'preparando',
      title: 'Empacando tus productos',
      description: 'Estamos preparando tu orden para el envío.',
      isCurrent: status === 'preparando',
      isCompleted: ['en_camino', 'entregado'].includes(status),
    },
    {
      status: 'en_camino',
      title: 'En Camino',
      description: repartidor 
        ? `El repartidor ${repartidor.nombre} va hacia ti. Contacto: ${repartidor.telefono || 'N/A'}`
        : 'Tu pedido está en camino.',
      isCurrent: status === 'en_camino',
      isCompleted: status === 'entregado',
    },
    {
      status: 'entregado',
      title: 'Entregado',
      description: 'Tu pedido ha sido entregado. ¡Gracias por tu compra!',
      isCurrent: status === 'entregado',
      isCompleted: status === 'entregado',
    },
  ];

  const getIcon = (eventStatus: TimelineStatus) => {
    switch (eventStatus) {
      case 'pendiente':
        return <Check size={16} />;
      case 'preparando':
        return <Package size={16} />;
      case 'en_camino':
        return <Truck size={16} />;
      case 'entregado':
        return <User size={16} />;
      default:
        return <Check size={16} />;
    }
  };

  return (
    <div className="space-y-8">
      {events.map((event, index) => {
        if (status === 'cancelado' && event.status !== 'pendiente') return null;

        const isActive = event.isCurrent || event.isCompleted;

        return (
          <div key={index} className="flex">
            <div className="flex flex-col items-center mr-4">
              <div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${ 
                  isActive ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-400'
                }`}>
                  {getIcon(event.status)}
                </div>
              </div>
              {index < events.length - 1 && <div className={`w-px h-full ${isActive ? 'bg-green-500' : 'bg-gray-600'}`}></div>}
            </div>
            <div className={`pt-1 ${isActive ? 'text-white' : 'text-gray-500'}`}>
              <p className="font-bold">{event.title}</p>
              <div className="flex items-center gap-3 mt-1">
                {event.status === 'en_camino' && repartidor?.foto_url && (
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                    <img src={repartidor.foto_url} alt={repartidor.nombre} className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-sm">{event.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
