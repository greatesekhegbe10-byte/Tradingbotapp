
import React, { useState, useMemo } from 'react';
import { X, Landmark, Download, FileCode, Key, Link as LinkIcon, ShieldCheck, Globe, Cpu, Server, Search, CheckCircle2, AlertCircle, Radio, Bitcoin, Layers, Terminal, Webhook, Zap, ArrowRight, Lock, Activity, ShieldAlert } from 'lucide-react';
import { getNexusEA } from '../services/eaScript';
import { BINARY_BROKERS, INSTITUTIONAL_BROKERS, CRYPTO_BROKERS, ConnectionMethod } from '../types';

interface BrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (broker: string, isLive: boolean, type: string) => void;
}

export const BrokerModal: React.FC<BrokerModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [connectType, setConnectType] = useState<'BINARY' | 'MT5' | 'CRYPTO'>('MT5');
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>('MT5_EA');
  const [selectedBroker, setSelectedBroker] = useState(INSTITUTIONAL_BROKERS[0]);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [serverCluster, setServerCluster] = useState('AWS-VA-INSTITUTIONAL');
  const [connecting, setConnecting] = useState(false);

  const brokerList = useMemo(() => {
    if (connectType === 'BINARY') return BINARY_BROKERS;
    if (connectType === 'MT5') return INSTITUTIONAL_BROKERS;
    return CRYPTO_BROKERS;
  }, [connectType]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setConnecting(true);
    setTimeout(() => {
      onConnect(selectedBroker, isLiveMode, connectionMethod);
      setConnecting(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-4 animate-fade-in">
      <div className="bg-[#0a101f] border border-gray-800 w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col h-[850px] transition-all">
        {/* Header */}
        <div className="p-10 border-b border-gray-800 flex justify-between items-center bg-gray-900/40">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-primary/20 rounded-[1.8rem] border border-primary/30 shadow-2xl">
              <Server className="text-primary w-7 h-7" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Broker Terminal Hub</h2>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                 <ShieldCheck className="w-3 h-3 text-success" /> End-to-End Encrypted Handshake
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-gray-800/50 hover:bg-gray-700 rounded-2xl transition-all text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-10 overflow-y-auto space-y-10 scrollbar-hide">
          {/* Node Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-8">
                <div className="space-y-3">
                   <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-3">Protocol Tier</label>
                   <div className="flex bg-gray-900 p-2 rounded-[2rem] border border-gray-800">
                      {['BINARY', 'MT5', 'CRYPTO'].map(type => (
                        <button 
                          key={type}
                          onClick={() => setConnectType(type as any)}
                          className={`flex-1 py-4 text-[11px] font-black rounded-[1.5rem] uppercase transition-all tracking-widest ${connectType === type ? 'bg-primary text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
                        >
                          {type}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-3">Server Cluster</label>
                   <select 
                     value={serverCluster}
                     onChange={(e) => setServerCluster(e.target.value)}
                     className="w-full bg-gray-900 border border-gray-800 rounded-3xl py-4 px-6 text-xs text-white font-black uppercase tracking-widest outline-none focus:border-primary transition-all"
                   >
                      <option value="AWS-VA-INSTITUTIONAL">AWS - Virginia (HFT-01)</option>
                      <option value="AWS-EU-INSTITUTIONAL">AWS - Frankfurt (HFT-02)</option>
                      <option value="AWS-TOKYO-INSTITUTIONAL">AWS - Tokyo (HFT-03)</option>
                   </select>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-3">Asset Registry</label>
                   <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-6 h-48 overflow-y-auto scrollbar-hide">
                      <div className="grid grid-cols-1 gap-2">
                        {brokerList.map(b => (
                          <button 
                            key={b}
                            onClick={() => setSelectedBroker(b)}
                            className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase flex justify-between items-center transition-all ${selectedBroker === b ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-600 hover:text-gray-400'}`}
                          >
                            {b} {selectedBroker === b && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <div className="bg-gray-900/60 p-8 rounded-[3rem] border border-gray-800 h-full flex flex-col justify-between">
                   <div className="space-y-6">
                      <div className="flex items-center gap-4 text-white">
                         <Activity className="w-5 h-5 text-primary" />
                         <h3 className="text-sm font-black uppercase tracking-tighter">Connection Stats</h3>
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                            <span className="text-[9px] text-gray-600 font-black uppercase">Simulated Ping</span>
                            <span className="text-[10px] text-success font-black">1.2ms (Ultra Fast)</span>
                         </div>
                         <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                            <span className="text-[9px] text-gray-600 font-black uppercase">Proxy Protocol</span>
                            <span className="text-[10px] text-white font-black uppercase">ShadowSocks Institutional</span>
                         </div>
                         <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                            <span className="text-[9px] text-gray-600 font-black uppercase">Node Priority</span>
                            <span className="text-[10px] text-amber-500 font-black uppercase">High Probability Tier</span>
                         </div>
                      </div>
                   </div>

                   <div className="p-6 bg-black/40 rounded-[2rem] border border-gray-800 mt-8">
                      <div className="flex items-center gap-3 mb-3">
                         <ShieldAlert className="w-4 h-4 text-danger" />
                         <span className="text-[9px] font-black text-danger uppercase tracking-widest">Risk Guard Active</span>
                      </div>
                      <p className="text-[9px] text-gray-600 font-bold uppercase leading-relaxed italic">
                         Establishing a live link will synchronize capital across all distributed ledger nodes. Ensure API permissions are restricted to 'Trading' only.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="p-10 bg-gray-900/60 border-t border-gray-800">
           <button 
             onClick={handleSubmit}
             disabled={connecting}
             className={`w-full py-6 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 ${isLiveMode ? 'bg-danger text-white shadow-danger/20' : 'bg-success text-white shadow-success/20'}`}
           >
             {connecting ? (
               <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  SYNCHRONIZING HUB...
               </div>
             ) : (
               <>AUTHORIZE {selectedBroker} NODE <ArrowRight className="w-5 h-5" /></>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};
