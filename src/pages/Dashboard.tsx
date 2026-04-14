import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, serverTimestamp, where, orderBy, doc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, History, Info, AlertCircle, CheckCircle2, Clock, ArrowRight, QrCode, Instagram, Facebook, Youtube, Twitter, Send, Music2, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard({ userProfile }: { userProfile: any }) {
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
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
  const USDT_RATE = 90; // 1 USDT = 90 INR (approx P2P rate)

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

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubOrders = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    return () => {
      unsubServices();
      unsubOrders();
    };
  }, [userProfile?.uid]);

  const categories = Array.from(new Set(services.map(s => s.category))).sort();
  const filteredCategories = categories.filter(cat => 
    (cat as string).toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredServices = services.filter(s => 
    s.category === selectedCategory && 
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

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
      // 1. Call SMM API via our server if it's an external service
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

      // 2. Use Batch for balance deduction, order creation, and transaction record
      const batch = writeBatch(db);
      
      const userRef = doc(db, 'users', userProfile.uid);
      batch.update(userRef, {
        balance: increment(-totalCharge)
      });

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
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
        <Link 
          to="/transactions"
          className="flex items-center gap-3 rounded-2xl bg-slate-900/50 p-4 border border-slate-800 backdrop-blur-xl hover:bg-slate-800 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20">
            <ShoppingCart className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Balance</div>
            <div className="text-lg font-bold text-emerald-500">{formatCurrency(userProfile?.balance || 0)}</div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-blue-500 ml-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:gap-8 lg:grid-cols-12">
        {/* Order Form */}
        <div className="lg:col-span-12 xl:col-span-5">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xl"
          >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-bold text-white">New Order</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                to="/services" 
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-400 border border-slate-700 hover:text-white transition-all"
              >
                <Layers className="h-3.5 w-3.5" />
                All Services
              </Link>
              <button
                onClick={() => setIsUsdtMode(!isUsdtMode)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  isUsdtMode 
                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                {isUsdtMode ? 'USDT Mode' : 'Convert to USDT'}
              </button>
            </div>
          </div>

            <form onSubmit={handlePlaceOrder} className="space-y-6">
              <div className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-400">1. Select Category</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-32 rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-1 text-[10px] text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50 p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {filteredCategories.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 italic">No categories found</div>
                    ) : (
                      filteredCategories.map(cat => (
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
                      ))
                    )}
                  </div>
                </div>

                {/* Service Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-400">2. Select Service</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="w-32 rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-1 text-[10px] text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className={cn(
                    "max-h-[300px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50 p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent transition-all",
                    !selectedCategory && "opacity-50 pointer-events-none"
                  )}>
                    {!selectedCategory ? (
                      <div className="py-10 text-center text-xs text-slate-500 italic">Please select a category first</div>
                    ) : filteredServices.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-500 italic">No services in this category</div>
                    ) : (
                      filteredServices.sort((a, b) => a.name.localeCompare(b.name)).map(s => (
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
                              {multiplier < 1 && (
                                <div className="text-[8px] text-slate-600 line-through">
                                  {formatCurrency(s.pricePer1000)}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {selectedService && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-xl bg-blue-500/10 p-4 text-sm text-blue-400 border border-blue-500/20"
                >
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">Service Details:</p>
                      <p className="text-slate-400">{selectedService.description}</p>
                      <p className="mt-1">Min: {selectedService.minOrder} | Max: {selectedService.maxOrder}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-400">Link</label>
                  <input
                    type="url"
                    required
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://instagram.com/p/..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-400">Quantity</label>
                  <input
                    type="number"
                    required
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Charge:</span>
                  <div className="text-right">
                    <div className="font-bold text-white text-lg">{formatCurrency(totalCharge)}</div>
                    {isUsdtMode && (
                      <div className="text-xs text-emerald-500 font-medium">
                        ≈ {(totalCharge / USDT_RATE).toFixed(2)} USDT
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-400 border border-emerald-500/20"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white btn-primary-glow disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-12 xl:col-span-7">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-bold text-white">Recent Orders</h2>
              </div>
              <Link 
                to="/orders" 
                className="flex items-center gap-1 text-xs font-bold text-blue-500 transition-all hover:text-blue-400"
              >
                View All
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-sm font-medium text-slate-400">
                    <th className="pb-4 pr-4">ID</th>
                    <th className="pb-4 pr-4">Service</th>
                    <th className="pb-4 pr-4">Quantity</th>
                    <th className="pb-4 pr-4">Charge</th>
                    <th className="pb-4 pr-4">Status</th>
                    <th className="pb-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map(order => (
                    <tr key={order.id} className="text-sm">
                      <td className="py-4 pr-4 font-mono text-xs text-slate-500">#{order.id.slice(0, 6)}</td>
                      <td className="py-4 pr-4 text-white font-medium">{order.serviceName}</td>
                      <td className="py-4 pr-4 text-slate-400">{order.quantity}</td>
                      <td className="py-4 pr-4 text-white font-medium">{formatCurrency(order.charge)}</td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          order.status === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                          order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {order.status === 'pending' && <Clock className="h-3 w-3" />}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500 text-xs">
                        {order.createdAt?.toDate().toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
