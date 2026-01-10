
import React, { useState } from 'react';
import { 
  X, Check, Cpu, ShieldCheck, Settings as SettingsIcon, 
  Globe, Key, TrendingUp, Zap, AlertTriangle, Landmark,
  ShieldAlert, Eye, Database, Users, History, Activity, Lock, Crown
} from 'lucide-react';
import { BotConfig, UserTier, StakingPlan, AdminRole, STRATEGIES, PAIR_CONFIGS } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
  userTier: UserTier;
  userRole: AdminRole;
  onUpdateConfig: (config: BotConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, config, userTier, userRole, onUpdateConfig 
}) => {
  const [activeSection, setActiveSection] = useState<'BOT' | 'RISK' | 'BROKER' | 'ADMIN_FREE' | 'ADMIN_PRO'>('BOT');
  
  if (!isOpen) return null;

  const isObserver = userRole === 'OBSERVER' || userRole === 'ROOT';
  const isRoot = userRole === 'ROOT';

  const tierWeight = { 'BASIC': 0, 'PRO': 1, 'VIP': 2 };
  const currentTierWeight = tierWeight[userTier];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-gray-800 w-full max-w-6xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row h-[85vh]">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-80 bg-[#0a101f] border-r border-gray-800 flex flex-col">
          <div className="p-10 border-b border-gray-800">
            <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter uppercase">
              <SettingsIcon className="w-6 h-6 text-primary" /> Configuration
            </h2>
          </div>
          <nav className="flex-1 p-8 space-y-2 overflow-y-auto">
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] px-4 mb-2">Trader Controls</p>
            {[
                { id: 'BOT', label: 'Neural Engine', icon: Cpu },
                { id: 'RISK', label: 'Risk Protocol', icon: ShieldCheck },
                { id: 'BROKER', label: 'Bridge Link', icon: Globe },
            ].map(sec => (
                <button 
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id as any)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all text-[11px] font-black uppercase tracking-widest ${
                    activeSection === sec.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-500 hover:text-white hover:bg-gray-800/40'
                  }`}
                >
                  <sec.icon className="w-4 h-4" /> {sec.label}
                </button>
            ))}

            {(isObserver || isRoot) && (
              <>
                <div className="h-px bg-gray-800 my-6 mx-4"></div>
                <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em] px-4 mb-2">Admin Terminal</p>
                <button 
                  onClick={() => setActiveSection('ADMIN_FREE')}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all text-[11px] font-black uppercase tracking-widest ${
                    activeSection === 'ADMIN_FREE' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-gray-500 hover:text-white hover:bg-gray-800/40'
                  }`}
                >
                  <Eye className="w-4 h-4" /> Free Admin
                </button>
                <button 
                  disabled={!isRoot}
                  onClick={() => setActiveSection('ADMIN_PRO')}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all text-[11px] font-black uppercase tracking-widest ${
                    !isRoot ? 'opacity-30 grayscale cursor-not-allowed' :
                    activeSection === 'ADMIN_PRO' ? 'bg-danger text-white' : 'text-gray-500 hover:text-white hover:bg-gray-800/40'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" /> Pro Admin
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#0f172a] relative overflow-y-auto p-12">
            <button onClick={onClose} className="absolute top-10 right-10 p-4 bg-gray-800/80 rounded-[1.5rem] hover:bg-gray-700 transition-all text-gray-400 z-10">
                <X className="w-6 h-6" />
            </button>

            {/* Content Logic... */}
            <div className="animate-fade-in space-y-12">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Modal Content Locked</h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest">Settings managed via the main Terminal View.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
