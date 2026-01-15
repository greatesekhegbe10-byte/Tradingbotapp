
import React from 'react';
import { Newspaper, TrendingUp, TrendingDown, Info, Clock, AlertCircle } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  impact: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  time: string;
}

interface NewsFeedProps {
  news: NewsItem[];
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ news }) => {
  return (
    <div className="bg-[#0a101f] rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <Newspaper className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Signal Intel</h3>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Global Macro Ticker</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-lg border border-gray-800">
           <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
           <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Live Feed</span>
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide flex-1">
        {news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-20">
            <AlertCircle className="w-8 h-8 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Intel...</span>
          </div>
        ) : (
          news.map((item) => (
            <div key={item.id} className="p-5 bg-gray-900/40 rounded-[1.8rem] border border-gray-800 hover:border-gray-700 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                  item.impact === 'HIGH' ? 'bg-danger/20 text-danger' : 
                  item.impact === 'MEDIUM' ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-700 text-gray-400'
                }`}>
                  {item.impact} Impact
                </span>
                <span className="text-[8px] text-gray-600 font-black uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.time}
                </span>
              </div>
              <h4 className="text-[11px] font-bold text-gray-200 uppercase leading-relaxed tracking-tight mb-3 group-hover:text-white transition-colors">
                {item.title}
              </h4>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-800/50">
                {item.sentiment === 'BULLISH' ? (
                  <div className="flex items-center gap-1.5 text-success">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest italic">Bullish Bias</span>
                  </div>
                ) : item.sentiment === 'BEARISH' ? (
                  <div className="flex items-center gap-1.5 text-danger">
                    <TrendingDown className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest italic">Bearish Bias</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Info className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest italic">Neutral Sentiment</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
