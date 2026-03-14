import React from 'react';
import { Layout } from '../components/Layout';
import { History, Crown, Store, ChevronRight, Receipt } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <Layout>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="p-8 space-y-12 max-w-lg mx-auto"
      >
        {/* Header Section */}
        <motion.header variants={itemVariants} className="flex items-center gap-8 py-6">
          <div className="w-24 h-24 bg-[#0F0F0F] border border-white/5 rounded-[2rem] flex items-center justify-center p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
            <div className="relative">
              <span className="text-5xl font-black text-gold-500 tracking-tighter drop-shadow-[0_0_15px_rgba(217,165,18,0.3)]">G</span>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gold-500 rounded-full border-4 border-[#0F0F0F]"></div>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">
              {user?.email?.split('@')[0] || 'ANTONIO'}
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-gold-500 shadow-[0_0_10px_rgba(217,165,18,0.5)]"></div>
              <p className="text-xs uppercase tracking-[0.4em] text-gold-500 font-black opacity-80">Entry</p>
            </div>
          </div>
        </motion.header>

        {/* Menu Section */}
        <div className="space-y-6">
          {/* Historial de Activos */}
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[#0A0A0A] border border-white/5 p-8 rounded-[2.5rem] flex items-center gap-8 group hover:bg-[#0F0F0F] transition-all duration-500 text-left shadow-xl"
          >
            <div className="w-16 h-16 bg-[#121212] rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-gold-500/30 transition-all duration-500">
              <Receipt size={28} className="text-white/40 group-hover:text-gold-500 transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-white tracking-widest uppercase leading-tight">HISTORIAL_DE_ACTIVOS</h3>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-2 font-bold">Registro completo de operaciones</p>
            </div>
          </motion.button>

          {/* Gestionar Membresía */}
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[#0A0A0A] border border-white/5 p-8 rounded-[2.5rem] flex items-center gap-8 group hover:bg-[#0F0F0F] transition-all duration-500 text-left shadow-xl"
          >
            <div className="w-16 h-16 bg-[#121212] rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-gold-500/30 transition-all duration-500">
              <Crown size={28} className="text-white/40 group-hover:text-gold-500 transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-white tracking-widest uppercase leading-tight">GESTIONAR_MEMBRESÍA</h3>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-2 font-bold">Actualizar nivel de socio</p>
            </div>
          </motion.button>

          {/* Mi Negocio (Highlighted) */}
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gold-500 p-8 rounded-[2.5rem] flex items-center gap-8 group hover:bg-gold-400 transition-all duration-700 text-left relative overflow-hidden shadow-[0_20px_40px_rgba(217,165,18,0.2)]"
          >
            <Store size={160} className="absolute -right-12 -bottom-12 text-black/5 rotate-12 transition-transform group-hover:scale-110 duration-1000" />
            
            <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center border border-black/5 relative z-10">
              <Store size={28} className="text-black" />
            </div>
            <div className="flex-1 relative z-10">
              <h3 className="text-lg font-black text-black tracking-widest uppercase leading-tight">MI_NEGOCIO</h3>
              <p className="text-[10px] text-black/60 uppercase tracking-[0.2em] mt-2 font-bold">Central de operaciones comerciales</p>
            </div>
            <ChevronRight size={24} className="text-black/30 relative z-10 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </motion.div>
    </Layout>
  );
};
