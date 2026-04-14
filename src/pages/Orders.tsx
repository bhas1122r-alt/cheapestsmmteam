import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { History, Search, Filter, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function Orders({ userProfile }: { userProfile: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!userProfile?.uid) return;

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

    return () => unsubOrders();
  }, [userProfile?.uid]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.link.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Order History</h1>
          <p className="text-sm text-slate-400">Track and manage all your service orders.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Order ID, Service or Link..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-11 pr-4 text-white focus:border-blue-500 focus:outline-none backdrop-blur-xl"
            />
          </div>
        </div>
        <div className="md:col-span-4">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-11 pr-4 text-white focus:border-blue-500 focus:outline-none backdrop-blur-xl"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/30 text-sm font-medium text-slate-400">
                <th className="px-4 sm:px-6 py-4">Order ID</th>
                <th className="px-4 sm:px-6 py-4">Service</th>
                <th className="px-4 sm:px-6 py-4">Link</th>
                <th className="px-4 sm:px-6 py-4">Quantity</th>
                <th className="px-4 sm:px-6 py-4">Charge</th>
                <th className="px-4 sm:px-6 py-4">Status</th>
                <th className="px-4 sm:px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.map(order => (
                <tr key={order.id} className="group transition-colors hover:bg-slate-800/30">
                  <td className="px-4 sm:px-6 py-4">
                    <span className="font-mono text-xs text-slate-500">#{order.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <p className="text-sm font-medium text-white">{order.serviceName}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">ID: {order.serviceId}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <a 
                      href={order.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline truncate max-w-[150px] sm:max-w-[200px] block"
                    >
                      {order.link}
                    </a>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-300">{order.quantity.toLocaleString()}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-bold text-white">{formatCurrency(order.charge)}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium ${getStatusStyle(order.status)}`}>
                      {order.status === 'pending' && <Clock className="h-3 w-3" />}
                      {order.status === 'processing' && <RefreshCw className="h-3 w-3 animate-spin-slow" />}
                      {order.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                      {order.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {order.createdAt?.toDate().toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <History className="h-12 w-12 text-slate-700" />
                      <p className="text-slate-500 italic">No orders found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
