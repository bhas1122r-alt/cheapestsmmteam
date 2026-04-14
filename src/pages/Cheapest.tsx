import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, serverTimestamp, where, orderBy, doc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Info, AlertCircle, CheckCircle2, QrCode, Instagram, Facebook, Youtube, Twitter, Send, Music2, Layers, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Cheapest({ userProfile }: { userProfile: any }) {
  const [services, setServices] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [quantity, setQuantity] = useState(0);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUsdtMode, setIsUsdtMode] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const USDT_RATE = 90;

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
    if (!userProfile?.uid) return;

    const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'services');
    });

    return () => unsubServices();
  }, [userProfile?.uid]);

  // Filter categories that have services under a certain threshold (e.g., 50 INR per 1k)
  // Or just sort services by price
  const categories = Array.from(new Set(services.map(s => s.category))).sort();
  const filteredCategories = categories.filter(cat => 
    (cat as string).toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredServices = services
    .filter(s => s.category === selectedCategory && s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
    .sort((a, b) => (a.pricePer1000 * multiplier) - (b.pricePer1000 * multiplier));

  const getPlatformIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('instagram')) return <Instagram className="h-4 w-4 text-pink-500" />;
    if (cat.includes('facebook')) return <Facebook className="h-4 w-4 text-blue-600" />;
    if (cat.includes('youtube')) return <Youtube className="h-4 w-4 text-red-600" />;
    if (cat.includes('twitter') || cat.includes('x')) return <Twitter className="h-4 w-4 text-sky-400" />;
    if (cat.includes('telegram')) return <Send className="h-4 w-4 text-blue-400" />;
    if (cat.includes('tiktok')) return <Music2 className="h-4 w-4 text-purple-500" />;
    return <Layers className="h-4 w-4 text-slate-400" />;
  };

  const totalCharge = selectedService ? (selectedService.pricePer1000 * multiplier / 1000) * quantity : 0;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedService || quantity <= 0 || !link) {
      setError('Please fill all fields correctly.');
      return;
    }

    if (quantity < selectedService.minOrder || quantity > selectedService.maxOrder) {
      setError(`Quantity must be between ${selectedService.minOrder} and ${selectedService.maxOrder}`);
      return;
    }

    if (userProfile.balance < totalCharge) {
      setError('Insufficient balance. Please contact admin to add funds.');
      return;
    }

    setLoading(true);
    try {
      let externalOrderId = null;
      if (selectedService.externalId) {
        const response = await fetch('/api/smm/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: selectedService.externalId,
            link,
            quantity
          })
        });
        const apiData = await response.json();
        if (apiData.order) {
          externalOrderId = apiData.order;
        } else if (apiData.error) {
          throw new Error(apiData.error);
        } else {
          throw new Error('Unknown API error');
        }
      }

      const batch = writeBatch(db);
      const userRef = doc(db, 'users', userProfile.uid);
      batch.update(userRef, { balance: increment(-totalCharge) });

      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, {
        userId: userProfile.uid,
        serviceId: selectedService.id,
        externalOrderId,
        serviceName: selectedService.name,
        link,
        quantity,
        charge: totalCharge,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        userId: userProfile.uid,
        amount: totalCharge,
        type: 'spend',
        description: `Order for ${selectedService.name} (Qty: ${quantity})`,
        createdAt: serverTimestamp()
      });

      await batch.commit();

      setSuccess('Order placed successfully!');
      setQuantity(0);
      setLink('');
      setSelectedService(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'orders/users/transactions');
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-500 fill-yellow-500/20" />
            Cheapest Services
          </h1>
          <p className="text-slate-400 text-sm mt-1">Get the most affordable services at lightning speed.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-900/50 p-4 border border-slate-800 backdrop-blur-xl">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <ShoppingCart className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Balance</div>
            <div className="text-lg font-bold text-emerald-500">{formatCurrency(userProfile?.balance || 0)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-8 backdrop-blur-xl">
        <form onSubmit={handlePlaceOrder} className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Category Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">1. Category</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-32 rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-1 text-[10px] text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50 p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {filteredCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedService(null);
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all flex items-center gap-3",
                      selectedCategory === cat 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      selectedCategory === cat ? "bg-white/20" : "bg-slate-800"
                    )}>
                      {getPlatformIcon(cat as string)}
                    </div>
                    <span className="truncate">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Service Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">2. Service (Sorted by Price)</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-32 rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-1 text-[10px] text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className={cn(
                "max-h-[300px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50 p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent transition-all",
                !selectedCategory && "opacity-50 pointer-events-none"
              )}>
                {!selectedCategory ? (
                  <div className="py-20 text-center text-xs text-slate-500 italic">Select a category to see cheapest options</div>
                ) : (
                  filteredServices.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedService(s)}
                      className={cn(
                        "w-full rounded-lg px-3 py-3 text-left transition-all group border",
                        selectedService?.id === s.id 
                          ? "bg-blue-600/10 border-blue-500/50 text-white" 
                          : "text-slate-400 hover:bg-slate-800 hover:text-white border-transparent"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "text-xs font-bold mb-1 leading-tight",
                            selectedService?.id === s.id ? "text-blue-400" : "text-white group-hover:text-blue-400"
                          )}>
                            {s.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            Min: {s.minOrder} • Max: {s.maxOrder}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-emerald-500">
                            {formatCurrency(s.pricePer1000 * multiplier)}
                          </div>
                          <div className="text-[9px] text-slate-500 uppercase">/ 1k</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">3. Link</label>
              <input
                type="url"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">4. Quantity</label>
              <input
                type="number"
                required
                value={quantity || ''}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="Enter quantity"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Charge</div>
              <div className="text-3xl font-bold text-white">{formatCurrency(totalCharge)}</div>
            </div>
            <button
              disabled={loading}
              className="px-12 py-4 rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Order'}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
