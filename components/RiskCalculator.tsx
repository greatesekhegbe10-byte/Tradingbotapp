
import React, { useState, useEffect } from 'react';
import { Calculator, ShieldCheck, DollarSign, Target, AlertTriangle, TrendingUp } from 'lucide-react';

export const RiskCalculator: React.FC<{ balance: number }> = ({ balance }) => {
  const [riskPercent, setRiskPercent] = useState(1);
  const [slPips, setSlPips] = useState(20);
  const [lotSize, setLotSize] = useState(0);
  const [riskAmount, setRiskAmount] = useState(0);

  useEffect(() => {
    const amount = balance * (riskPercent / 100);
    setRiskAmount(amount);
    // Standard Forex calculation (per 10 pips $100 on 1 lot)
    const lots = amount / (slPips * 10);
    setLotSize(parseFloat(lots.toFixed(2)));
  }, [balance, riskPercent, slPips]);

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
      <div className="bg-[#0a101f] p-10 rounded-[4rem] border border-gray-800 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-6 mb-12">
          <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30">
            <Calculator className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Capital Protocol</h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1">Institutional Risk Provisioning Engine</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
           <div className="space-y-8">
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Account Balance</label>
                    <span className="text-xl font-mono font-black text-white italic">${balance.toLocaleString()}</span>
                 </div>
                 <div className="bg-black/40 border border-gray-800 p-6 rounded-[2rem] text-center">
                    <DollarSign className="w-6 h-6 text-primary mx-auto mb-2" />
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Vault Sync Active</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Risk per trade (%)</label>
                    <span className="text-lg font-mono font-black text-primary">{riskPercent}%</span>
                 </div>
                 <input 
                    type="range" min="0.5" max="10" step="0.5" 
                    value={riskPercent} 
                    onChange={e => setRiskPercent(parseFloat(e.target.value))}
                    className="w-full accent-primary bg-gray-800 h-2 rounded-full cursor-pointer" 
                 />
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Stop Loss (Pips)</label>
                    <span className="text-lg font-mono font-black text-danger">{slPips} PIPS</span>
                 </div>
                 <input 
                    type="range" min="5" max="200" step="5" 
                    value={slPips} 
                    onChange={e => setSlPips(parseInt(e.target.value))}
                    className="w-full accent-danger bg-gray-800 h-2 rounded-full cursor-pointer" 
                 />
              </div>
           </div>

           <div className="space-y-8">
              <div className="bg-primary/5 border border-primary/20 rounded-[3rem] p-10 text-center flex flex-col justify-center items-center shadow-2xl">
                 <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-4">Suggested Lot Size</span>
                 <h1 className="text-7xl font-black text-white tracking-tighter italic mb-4">{lotSize}</h1>
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Standard Institutional Lot</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 text-center">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Dollar Risk</p>
                    <p className="text-xl font-mono font-black text-danger">-${riskAmount.toFixed(2)}</p>
                 </div>
                 <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 text-center flex flex-col items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-success mb-1" />
                    <p className="text-[10px] font-black text-white uppercase italic">Safety OK</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
