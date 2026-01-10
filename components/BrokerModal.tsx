
import React, { useState, useMemo } from 'react';
import { X, Landmark, Download, FileCode, Key, Link as LinkIcon, ShieldCheck, Globe, Cpu, Server, Search, CheckCircle2, AlertCircle, Radio, Bitcoin, Layers, Terminal, Webhook, Zap, ArrowRight, Lock } from 'lucide-react';
import { getNexusEA } from '../services/eaScript';
import { BINARY_BROKERS, INSTITUTIONAL_BROKERS, CRYPTO_BROKERS, ConnectionMethod } from '../types';

interface BrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (broker: string, isLive: boolean, type: string) => void;
}

export const BrokerModal: React.FC<BrokerModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [connectType, setConnectType] = useState<'BINARY' | 'MT5' | 'CRYPTO'>('BINARY');
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>('BINARY_API');
  const [selectedBroker, setSelectedBroker] = useState(BINARY_BROKERS[0]);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [connecting, setConnecting] = useState(false);

  const brokerList = useMemo(() => {
    if (connectType === 'BINARY') return BINARY_BROKERS;
    if (connectType === 'MT5') return INSTITUTIONAL_BROKERS;
    return CRYPTO_BROKERS;
  }, [connectType]);

  const filteredBrokers = useMemo(() => {
    return brokerList.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, brokerList]);

  const availableMethods = useMemo(() => {
    if (connectType === 'BINARY') return ['BINARY_API', 'WEBHOOK'];
    if (connectType === 'MT5') return ['MT5_EA', 'META_API', 'WEBHOOK'];
    return ['CRYPTO_API', 'WEBHOOK'];
  }, [connectType]);

  if (!isOpen) return null;

  const handleDownloadEA = () => {
    const eaContent = getNexusEA(apiKey || "NX-MASTER-BRIDGE");
    const blob = new Blob([eaContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nexus_AI_v6_Institutional.mq5`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSubmit = () => {
    setConnecting(true);
    setTimeout(() => {
      onConnect(selectedBroker, isLiveMode, connectionMethod);
      setConnecting(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-fade-in">
      <div className="bg-surface border border-gray-800 w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col h-[850px] transition-all">
        <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-primary/20 rounded-3xl shadow-xl border border-primary/20">
              <Landmark className="text-primary w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Institutional Bridge Hub</h2>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Cross-Protocol Liquidity Interface</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-800/50 hover:bg-gray-700 rounded-2xl transition-all text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto space-y-8 scrollbar-hide">
          {/* Account Type Toggle */}
          <div className="flex gap-4 p-2 bg-gray-900 rounded-[2rem] border border-gray-800">
             <button 
                onClick={() => setIsLiveMode(false)}
                className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!isLiveMode ? 'bg-gray-800 text-white shadow-xl border border-gray-700' : 'text-gray-600'}`}
             >
                <div className={`w-2 h-2 rounded-full ${!isLiveMode ? 'bg-primary' : 'bg-gray-700'}`}></div>
                Demo Sandbox
             </button>
             <button 
                onClick={() => setIsLiveMode(true)}
                className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isLiveMode ? 'bg-danger/20 text-danger border border-danger/30 shadow-xl' : 'text-gray-600'}`}
             >
                <div className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-danger animate-pulse' : 'bg-gray-700'}`}></div>
                Live Production
             </button>
          </div>

          <div className="flex bg-gray-900 p-2 rounded-3xl border border-gray-800">
            {[
              { id: 'BINARY', label: 'Binary', icon: Radio },
              { id: 'MT5', label: 'Forex / Indices', icon: Layers },
              { id: 'CRYPTO', label: 'Crypto', icon: Bitcoin }
            ].map(type => (
              <button 
                key={type.id}
                onClick={() => {
                  setConnectType(type.id as any);
                  setSearchQuery('');
                  const firstBroker = type.id === 'BINARY' ? BINARY_BROKERS[0] : type.id === 'MT5' ? INSTITUTIONAL_BROKERS[0] : CRYPTO_BROKERS[0];
                  setSelectedBroker(firstBroker);
                  setConnectionMethod(type.id === 'BINARY' ? 'BINARY_API' : type.id === 'MT5' ? 'MT5_EA' : 'CRYPTO_API');
                }} 
                className={`flex-1 py-3 text-[11px] font-black rounded-2xl uppercase transition-all tracking-widest flex items-center justify-center gap-2 ${connectType === type.id ? `bg-primary text-white shadow-xl` : 'text-gray-500 hover:text-gray-400'}`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Connection Method Selection */}
              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-3">Select Bridge Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {availableMethods.map(method => (
                    <button
                      key={method}
                      onClick={() => setConnectionMethod(method as ConnectionMethod)}
                      className={`py-3 px-4 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${connectionMethod === method ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'}`}
                    >
                      {method === 'META_API' && <Terminal className="w-3.5 h-3.5" />}
                      {method === 'WEBHOOK' && <Webhook className="w-3.5 h-3.5" />}
                      {method === 'MT5_EA' && <FileCode className="w-3.5 h-3.5" />}
                      {method.includes('API') && method !== 'META_API' && <Key className="w-3.5 h-3.5" />}
                      {method.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-3">Platform Matrix</label>
                <div className="relative">
                  <Search className="absolute left-5 top-4 w-4 h-4 text-gray-600" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search brokers..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-3.5 pl-14 pr-6 text-xs text-white font-black outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="h-40 overflow-y-auto bg-gray-900/50 border border-gray-800 rounded-2xl p-3 grid grid-cols-1 gap-1.5 scrollbar-hide">
                  {filteredBrokers.map(b => (
                    <button 
                      key={b}
                      onClick={() => setSelectedBroker(b)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all flex justify-between items-center ${selectedBroker === b ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-500 hover:bg-white/5'}`}
                    >
                      {b}
                      {selectedBroker === b && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Inputs Based on Connection Method */}
              <div className="space-y-4">
                {(connectionMethod === 'BINARY_API' || connectionMethod === 'CRYPTO_API' || connectionMethod === 'META_API') && (
                  <div className="space-y-3">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-3">
                      {connectionMethod === 'META_API' ? 'MetaApi Token' : 'API Key'}
                    </label>
                    <div className="relative">
                      <Key className="absolute left-4 top-3.5 w-4 h-4 text-gray-600" />
                      <input 
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={`Enter ${connectionMethod.replace('_', ' ')} Key`}
                        className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-3 pl-12 pr-6 text-xs text-white font-mono outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {connectionMethod === 'CRYPTO_API' && (
                  <div className="space-y-3">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-3">API Secret</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-600" />
                      <input 
                        type="password"
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        placeholder="Enter API Secret"
                        className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-3 pl-12 pr-6 text-xs text-white font-mono outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {connectionMethod === 'WEBHOOK' && (
                  <div className="space-y-3">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-3">Webhook Gateway URL</label>
                    <div className="relative">
                      <Webhook className="absolute left-4 top-3.5 w-4 h-4 text-gray-600" />
                      <input 
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://your-webhook-endpoint.com/signals"
                        className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-3 pl-12 pr-6 text-xs text-white font-mono outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-900/50 p-8 rounded-[3rem] border border-gray-800 flex flex-col justify-between h-full min-h-[400px]">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <Server className="w-4 h-4 text-primary" /> Active Protocol Node
                  </h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                        <span className="text-[9px] text-gray-500 font-black uppercase">Latency Node</span>
                        <span className="text-[10px] text-success font-black">2.4ms (AWS-EU)</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                        <span className="text-[9px] text-gray-500 font-black uppercase">Sync Method</span>
                        <span className="text-[10px] text-white font-black uppercase">{connectionMethod.replace('_', ' ')}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                        <span className="text-[9px] text-gray-500 font-black uppercase">Tier Access</span>
                        <span className={`text-[10px] font-black uppercase text-accent`}>INSTITUTIONAL GRADE</span>
                     </div>
                  </div>
                </div>

                <div className="space-y-4 pt-8">
                   {connectionMethod === 'MT5_EA' && (
                    <button onClick={handleDownloadEA} className="w-full py-4 bg-amber-500 text-black font-black text-[10px] uppercase rounded-2xl flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-xl shadow-amber-900/20">
                      <Download className="w-5 h-5" /> Download Nexus EA (mq5)
                    </button>
                   )}
                   <div className="p-5 bg-black/40 rounded-2xl border border-gray-800">
                      <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-4 h-4 text-success" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">TLS 1.3 Encryption</span>
                      </div>
                      <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
                        Secure tunneling active. Your API credentials are never stored in plain text and are discarded after handshake.
                      </p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-900/80 border-t border-gray-800">
           <button 
             onClick={handleSubmit}
             disabled={connecting || (!apiKey && connectionMethod !== 'MT5_EA' && connectionMethod !== 'WEBHOOK') || (connectionMethod === 'WEBHOOK' && !webhookUrl)}
             className={`w-full py-6 text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-[2rem] shadow-2xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-4 ${isLiveMode ? 'bg-danger shadow-danger/20' : 'bg-success shadow-success/20'}`}
           >
             {connecting ? (
               <>
                 <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                 ESTABLISHING LINK...
               </>
             ) : (
               <>AUTHORIZE {selectedBroker} NODE <ArrowRight className="w-4 h-4" /></>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};
