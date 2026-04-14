import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ArrowLeft, User, Bot, Shield, Clock, CheckCircle2, AlertCircle, MoreVertical, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Chat({ userProfile }: { userProfile: any }) {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const unsubTicket = onSnapshot(doc(db, 'tickets', id), (docSnap) => {
      if (docSnap.exists()) {
        setTicket({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate('/tickets');
      }
    });

    const q = query(
      collection(db, 'tickets', id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubMessages = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubTicket();
      unsubMessages();
    };
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || !ticket) return;

    const text = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      const senderName = userProfile.role === 'admin' ? 'Admin' : (userProfile.displayName || 'User');
      
      // 1. Add user message
      await addDoc(collection(db, 'tickets', id, 'messages'), {
        ticketId: id,
        senderId: userProfile.uid,
        senderName,
        text,
        createdAt: serverTimestamp(),
      });

      // 2. Update ticket updatedAt and last message info
      await updateDoc(doc(db, 'tickets', id), {
        updatedAt: serverTimestamp(),
        lastMessage: text,
        lastSenderId: userProfile.uid,
        lastSenderName: senderName,
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'tickets', id), {
        status: 'closed',
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'tickets');
    }
  };

  if (!ticket) return null;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between rounded-t-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            to="/tickets"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">{ticket.subject}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className={cn(
                "rounded-full px-2 py-0.5 font-bold uppercase tracking-wider border",
                ticket.status === 'open' ? "text-blue-500 border-blue-500/20 bg-blue-500/5" : "text-slate-500 border-slate-700 bg-slate-800"
              )}>
                {ticket.status}
              </span>
              <span>•</span>
              <span>{ticket.request}</span>
              {ticket.orderId && (
                <>
                  <span>•</span>
                  <span className="text-blue-500/70 font-mono">#{ticket.orderId}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {ticket.status === 'open' && (
          <button
            onClick={handleCloseTicket}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-500 border border-slate-700 hover:border-red-500/20 transition-all"
          >
            <XCircle className="h-4 w-4" />
            Close Ticket
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto border-x border-slate-800 bg-slate-950/50 p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === userProfile.uid;
          const isAI = msg.senderId === 'ai';
          const isUser = msg.senderId === ticket.userId;
          const isStaff = !isAI && !isUser;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex flex-col max-w-[80%]",
                isMe ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {isMe ? 'You' : isAI ? 'AI Support' : isUser ? 'User' : 'Staff'}
                </span>
                <span className="text-[10px] text-slate-600">
                  {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={cn(
                "rounded-2xl px-4 py-3 text-sm shadow-lg",
                isMe 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : isAI 
                    ? "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none"
                    : isStaff
                      ? "bg-emerald-600 text-white rounded-tl-none"
                      : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none"
              )}>
                {msg.text}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="rounded-b-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-xl">
        {ticket.status === 'closed' ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500 italic">
            <CheckCircle2 className="h-4 w-4" />
            This ticket is closed.
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white btn-primary-glow disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
