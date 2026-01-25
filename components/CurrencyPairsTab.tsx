
import React, { useState, useMemo } from 'react';
import { Search, Shield, Lock, CheckCircle, Globe, Zap, Cpu, ArrowRight, Coins, LayoutGrid, ListFilter, TrendingUp, BarChart3, Binary } from 'lucide-react';
import { PAIR_CONFIGS, UserTier } from '../types';

interface CurrencyPairsTabProps {
  currentPair: string;
  userTier: UserTier;
  onSelectPair: (pair: string) => void;
}

export const CurrencyPairsTab: React.FC<CurrencyPairsTabProps> = ({ currentPair, userTier, onSelectPair }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'FOREX' | 'CRYPTO' | 'INDICES'>('ALL');

  const tierRank: Record<UserTier, number> = { 'BASIC': 0, 'PRO': 1, 'VIP': 2 };

  const filteredPairs = useMemo(() => {
    return Object.entries(PAIR_CONFIGS).filter(([symbol, config]) => {
      const matchesSearch = symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            config.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isForex = symbol.includes('/') && !['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'].some(c => symbol.includes(c));
      const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'].some(c => symbol.includes(c));
      const isIndex = ['NAS100', 'US30', 'XAU', 'XAG'].some(c => symbol.includes(c));

      let matchesCategory = true;
      if (activeCategory === 'FOREX') matchesCategory = isForex;
      if (activeCategory === 'CRYPTO') matchesCategory = isCrypto;
      if (activeCategory === 'INDICES') matchesCategory = isIndex;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#0a101f] p-8 rounded-[3rem] border border-gray-800 shadow-2xl gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
            <Coins className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Instrument Terminal</h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Multi-Asset Cluster Synchronization</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input 
              type="text" 
              placeholder="Search Assets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-3 pl-12 pr-4 text-xs text-white outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800">
            {['ALL', 'FOREX', 'CRYPTO', 'INDICES'].map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                className={`px-4 py-2 text-[9px] font-black rounded-xl uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPairs.map(([symbol, details]) => {
          const isLocked = tierRank[userTier] < tierRank[details.requiredTier];
          const isActive = currentPair === symbol;
          
          const isForex = symbol.includes('/') && !['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'].some(c => symbol.includes(c));
          const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'].some(c => symbol.includes(c));
          const isIndex = ['NAS100', 'US30', 'XAU', 'XAG'].some(c => symbol.includes(c));

          return (
            <div 
              key={symbol}
              className={`relative bg-surface rounded-[2.5rem] border p-8 shadow-xl transition-all duration-300 group overflow-hidden ${
                isActive ? 'border-primary bg-primary/5 shadow-primary/10' : 
                isLocked ? 'border-gray-800 opacity-60 grayscale' : 'border-gray-800 hover:border-primary/40'
              }`}
            >
              <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] transition-all duration-700 ${
                isActive ? 'bg-primary/20' : isLocked ? 'bg-gray-800' : 'bg-primary/5 group-hover:bg-primary/10'
              }`}></div>

              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl border ${isActive ? 'bg-primary/20 border-primary/30' : 'bg-gray-900 border-gray-800'}`}>
                    {isCrypto ? <Coins className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-500'}`} /> : 
                     isIndex ? <TrendingUp className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-500'}`} /> : 
                     <Globe className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-500'}`} />}
                  </div>
                  {isLocked ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-danger/10 border border-danger/20 rounded-lg">
                      <Lock className="w-3 h-3 text-danger" />
                      <span className="text-[8px] font-black text-danger uppercase tracking-widest">{details.requiredTier} REQUIRED</span>
                    </div>
                  ) : isActive ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 border border-success/20 rounded-lg">
                      <CheckCircle className="w-3 h-3 text-success" />
                      <span className="text-[8px] font-black text-success uppercase tracking-widest">ACTIVE NODE</span>
                    </div>
                  ) : (
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{details.requiredTier} ACCESS</span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{symbol}</h3>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1 line-clamp-1">{details.name}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-600 border-b border-gray-800/50 pb-2">
                    <span>Precision</span>
                    <span className="text-gray-300">{details.precision} D.P.</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-600 border-b border-gray-800/50 pb-2">
                    <span>Classification</span>
                    <span className="text-primary">{isCrypto ? 'CRYPTO' : isIndex ? 'INDEX/METAL' : 'FOREX'}</span>
                  </div>
                </div>

                <button 
                  disabled={isLocked || isActive}
                  onClick={() => onSelectPair(symbol)}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                    isActive ? 'bg-primary/20 text-primary border border-primary/30 cursor-default' : 
                    isLocked ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed' : 
                    'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 border border-primary/50'
                  }`}
                >
                  {isActive ? 'CURRENTLY ACTIVE' : isLocked ? 'NODE RESTRICTED' : 'ACTIVATE NODE'}
                  {!isActive && !isLocked && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPairs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-20">
          <LayoutGrid className="w-16 h-16" />
          <h3 className="text-lg font-black uppercase tracking-widest text-white">No Matching Instruments Found</h3>
        </div>
      )}
    </div>
  );
};
