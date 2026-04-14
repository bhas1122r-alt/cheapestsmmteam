import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Layers, Search, Info, Instagram, Facebook, Youtube, Twitter, Send, Music2 } from 'lucide-react';

export default function Services({ userProfile }: { userProfile?: any }) {
  const [services, setServices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const getMultiplier = () => {
    if (!userProfile?.plan_type) return 1.0;
    switch (userProfile.plan_type) {
      case 'silver': return 0.9;
      case 'gold': return 0.8;
      case 'vip': return 0.7;
      default: return 1.0;
    }
  };

  const multiplier = getMultiplier();

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'services'), orderBy('category')), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'services');
    });
    return () => unsub();
  }, []);

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category)))].sort();

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getPlatformIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('instagram')) return <Instagram className="h-5 w-5 text-pink-500" />;
    if (cat.includes('facebook')) return <Facebook className="h-5 w-5 text-blue-600" />;
    if (cat.includes('youtube')) return <Youtube className="h-5 w-5 text-red-600" />;
    if (cat.includes('twitter') || cat.includes('x')) return <Twitter className="h-5 w-5 text-sky-400" />;
    if (cat.includes('telegram')) return <Send className="h-5 w-5 text-blue-400" />;
    if (cat.includes('tiktok')) return <Music2 className="h-5 w-5 text-purple-500" />;
    return <Layers className="h-5 w-5 text-slate-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Services</h1>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-900/50 p-2 border border-slate-800 backdrop-blur-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-all border",
              selectedCategory === cat 
                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-sm font-medium text-slate-400">
                <th className="px-4 sm:px-6 py-4">ID</th>
                <th className="px-4 sm:px-6 py-4">Service Name</th>
                <th className="px-4 sm:px-6 py-4 text-center">Rate / 1k</th>
                <th className="px-4 sm:px-6 py-4 text-center">Min / Max</th>
                <th className="px-4 sm:px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredServices.map((s, index) => (
                <motion.tr 
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4 font-mono text-xs text-slate-500">{s.id.slice(0, 8)}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 group-hover:border-blue-500/50 transition-colors">
                        {getPlatformIcon(s.category)}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{s.name}</div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-center">
                    <div className="text-xs sm:text-sm font-bold text-emerald-500">
                      {formatCurrency(s.pricePer1000 * multiplier)}
                    </div>
                    {multiplier < 1 && (
                      <div className="text-[10px] text-slate-600 line-through">
                        {formatCurrency(s.pricePer1000)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-center">
                    <div className="text-[10px] sm:text-xs text-slate-400 font-medium">
                      {s.minOrder.toLocaleString()} - {s.maxOrder.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <div className="group/info relative inline-block">
                      <button className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                        <Info className="h-4 w-4" />
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 w-64 scale-0 rounded-xl bg-slate-950 p-4 text-left text-xs text-slate-400 shadow-2xl border border-slate-800 group-hover/info:scale-100 transition-all origin-bottom-right z-50">
                        <p className="font-bold text-white mb-1">Description:</p>
                        {s.description || 'No description available.'}
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Search className="h-8 w-8 opacity-20" />
                      <p className="italic">No services found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
