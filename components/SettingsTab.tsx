
import React, { useState } from 'react';
import { BotConfig, UserProfile, BINARY_BROKERS, INSTITUTIONAL_BROKERS } from '../types';
import { Sliders, ShieldAlert, Globe, Key, Landmark, ToggleLeft, ToggleRight, Lock, Check, Zap, Server } from 'lucide-react';

interface SettingsTabProps {
  config: BotConfig;
  user: UserProfile;
  onUpdateConfig: (config: BotConfig) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ config, user, onUpdateConfig }) => {
  const [activeBrokerTab, setActiveBrokerTab] = useState<'BINARY' | 'INSTITUTIONAL'>('INSTITUTIONAL');

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in pb-32">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <Sliders className="w-8 h-8 text-primary" />
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter">Terminal Hub</h1>
        </div>
        <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-[10px]">
          Institutional Infrastructure & Safety Provisioning
        </p>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl relative overflow-hidden group">
            {!user.brokerConfig.isAdminUnlocked && (
              <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center">
                 <Lock className="w-12 h-12 text-amber-500 mb-6" />
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Broker Node Locked</h2>
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2 max-w-sm leading-relaxed">
                   Trading execution is disabled until an administrator authorizes this terminal node.
                 </p>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-primary/20 rounded-2xl"><Globe className="w-6 h-6 text-primary" /></div>
                <div>
                   <h2 className="text-xl font-black text-white uppercase tracking-tighter">Bridge Link</h2>
                   <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Connect to Distributed Liquidity Nodes</p>
                </div>
            </div>

            <div className="space-y-8">
               <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800">
                  {['BINARY', 'INSTITUTIONAL'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setActiveBrokerTab(type as any)}
                      className={`flex-1 py-3 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${activeBrokerTab === type ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                      {type}
                    </button>
                  ))}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-1">Select Active Node</label>
                     <select className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-4 px-6 text-xs text-white outline-none focus:border-primary">
                        {(activeBrokerTab === 'BINARY' ? BINARY_BROKERS : INSTITUTIONAL_BROKERS).map(b => <option key={b}>{b}</option>)}
                     </select>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-1">Meta API Key</label>
                     <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input type="password" placeholder="••••••••••••••••" className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-xs text-white outline-none focus:border-primary" />
                     </div>
                  </div>
               </div>
            </div>
          </section>

          <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-amber-500/20 rounded-2xl"><Server className="w-6 h-6 text-amber-500" /></div>
                <div>
                   <h2 className="text-xl font-black text-white uppercase tracking-tighter">Cloud Sync</h2>
                   <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">VPS Persistence Protocol</p>
                </div>
            </div>
            <div className="p-6 bg-gray-900/40 rounded-[2rem] border border-gray-800 border-dashed flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${config.vpsStatus === 'ONLINE' ? 'bg-success shadow-[0_0_10px_#10b981]' : 'bg-danger'}`}></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">HFT VPS Cluster {config.vpsStatus}</span>
               </div>
               <button className="px-6 py-3 bg-gray-800 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-white border border-gray-700">Manage Server</button>
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
           <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                 <ShieldAlert className="w-6 h-6 text-danger" />
                 <h2 className="text-xl font-black text-white uppercase tracking-tighter">Safety Master</h2>
              </div>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black text-white uppercase">Execution Master</p>
                       <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mt-1">Allow Node to Open Orders</p>
                    </div>
                    <button onClick={() => onUpdateConfig({...config, isExecutionEnabled: !config.isExecutionEnabled})}>
                       {config.isExecutionEnabled ? <ToggleRight className="w-10 h-10 text-success" /> : <ToggleLeft className="w-10 h-10 text-gray-700" />}
                    </button>
                 </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};
