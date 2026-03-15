
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Package, Tag, Info, Check, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { AppNotification } from '../types';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const data = await api.data.getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string, actionUrl?: string) => {
      await api.data.markNotificationRead(id);
      
      // Update local state to reflect read status immediately
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      
      if (actionUrl) {
          navigate(actionUrl);
      }
  };

  const filteredNotifs = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  const getIcon = (type: string) => {
      switch(type) {
          case 'order': return <Package size={20} />;
          case 'promo': return <Tag size={20} />;
          case 'system': return <Info size={20} />;
          default: return <Bell size={20} />;
      }
  };

  const getColor = (type: string) => {
      switch(type) {
          case 'order': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
          case 'promo': return 'bg-gold-100 text-gold-600 dark:bg-gold-900/20 dark:text-gold-400';
          case 'system': return 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300';
          default: return 'bg-gray-100 text-gray-600';
      }
  };

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500">
      
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-dark-950 dark:via-dark-900 dark:to-black z-0"></div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8 pb-32">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors">
                <ArrowLeft size={20} className="text-gray-900 dark:text-white" />
            </button>
            <h1 className="font-heading text-2xl font-light text-gray-900 dark:text-white">Centro de Mensajes</h1>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
            <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white/50 dark:bg-white/5 text-gray-500'}`}
            >
                Todos
            </button>
            <button 
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${filter === 'unread' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white/50 dark:bg-white/5 text-gray-500'}`}
            >
                No leídos
            </button>
        </div>

        {loading ? (
            <div className="text-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-400 mx-auto"></div>
            </div>
        ) : filteredNotifs.length === 0 ? (
            <div className="text-center py-20 opacity-50">
                <Bell size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500">No tienes notificaciones en este momento.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {filteredNotifs.map(notif => (
                    <div 
                        key={notif.id} 
                        onClick={() => handleMarkAsRead(notif.id, notif.action_url)}
                        className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] ${notif.read ? 'bg-white/40 dark:bg-white/5 border-transparent opacity-80' : 'bg-white dark:bg-white/10 border-gold-400/30 shadow-lg'}`}
                    >
                        <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getColor(notif.type)}`}>
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-sm ${notif.read ? 'text-gray-700 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                        {notif.title}
                                    </h3>
                                    {!notif.read && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
                                    {notif.message}
                                </p>
                                <span className="text-[10px] text-gray-400 font-mono">
                                    {new Date(notif.created_at).toLocaleDateString()} • {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
};
