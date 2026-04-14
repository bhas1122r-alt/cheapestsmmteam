import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion } from 'motion/react';
import { Ticket, Send, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function CreateTicket({ userProfile }: { userProfile: any }) {
  const [subject, setSubject] = useState('');
  const [orderId, setOrderId] = useState('');
  const [request, setRequest] = useState('Order');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const ticketRef = await addDoc(collection(db, 'tickets'), {
        userId: userProfile.uid,
        subject,
        orderId,
        request,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: message,
        lastSenderId: userProfile.uid,
        lastSenderName: userProfile.displayName || 'User',
      });

      // Add initial message
      await addDoc(collection(db, 'tickets', ticketRef.id, 'messages'), {
        ticketId: ticketRef.id,
        senderId: userProfile.uid,
        senderName: userProfile.displayName || 'User',
        text: message,
        createdAt: serverTimestamp(),
      });

      setSuccess('Ticket created successfully! Redirecting to chat...');
      setTimeout(() => {
        navigate(`/tickets/${ticketRef.id}`);
      }, 1500);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'tickets');
      setError('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/tickets"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Create New Ticket</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-400">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Order not processing"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-400">Order ID (Optional)</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., #123456"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Request Type *</label>
            <select
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Order">Order Related</option>
              <option value="Payment">Payment Related</option>
              <option value="Service">Service Related</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Message *</label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white btn-primary-glow disabled:opacity-50 shadow-lg shadow-blue-900/20"
          >
            {loading ? 'Creating...' : (
              <>
                <Send className="h-5 w-5" />
                Submit Ticket
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
