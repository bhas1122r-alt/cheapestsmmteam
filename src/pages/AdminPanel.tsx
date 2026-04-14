import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, increment, writeBatch, setDoc, serverTimestamp, getDocs, where, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { Plus, Trash2, Edit2, Users, Package, ShoppingBag, Search, X, Check, ArrowUpCircle, Menu, Eye, EyeOff, AlertCircle, Info, Loader2 } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'orders' | 'users' | 'navigation' | 'fundRequests' | 'tickets' | 'subscriptions'>('dashboard');
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [navItems, setNavItems] = useState<any[]>([]);
  const [fundRequests, setFundRequests] = useState<any[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [usdtQrCodeUrl, setUsdtQrCodeUrl] = useState('');
  const [usdtWalletAddress, setUsdtWalletAddress] = useState('');
  const [usdtNetwork, setUsdtNetwork] = useState('');
  const [minDepositINR, setMinDepositINR] = useState(10);
  const [minDepositUSDT, setMinDepositUSDT] = useState(10);
  const [referralBonusPercent, setReferralBonusPercent] = useState(2);
  const [smmApiUrl, setSmmApiUrl] = useState('');
  const [smmApiKey, setSmmApiKey] = useState('');
  const [silverQrCodeUrl, setSilverQrCodeUrl] = useState('');
  const [goldQrCodeUrl, setGoldQrCodeUrl] = useState('');
  const [vipQrCodeUrl, setVipQrCodeUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [usdToInr, setUsdToInr] = useState(83);
  const [editingService, setEditingService] = useState<any>(null);
  const [editingNavItem, setEditingNavItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const navigate = useNavigate();
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'approve' | 'reject' | 'delete' | 'cancel';
    loading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'approve',
    loading: false
  });

  const [balanceModal, setBalanceModal] = useState<{
    isOpen: boolean;
    userId: string;
    userEmail: string;
    amount: string;
    type: 'add' | 'deduct';
  }>({
    isOpen: false,
    userId: '',
    userEmail: '',
    amount: '',
    type: 'add'
  });

  // Form states
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: '',
    pricePer1000: 0,
    minOrder: 10,
    maxOrder: 100000,
    description: ''
  });

  const [navForm, setNavForm] = useState({
    label: '',
    icon: 'Circle',
    path: '/',
    isVisible: true,
    order: 0,
    badge: ''
  });

  useEffect(() => {
    const unsubServices = onSnapshot(query(collection(db, 'services'), orderBy('category')), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'services');
    });

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    const unsubNav = onSnapshot(collection(db, 'navigation'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNavItems(items.sort((a: any, b: any) => a.order - b.order));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'navigation');
    });

    const unsubFundRequests = onSnapshot(query(collection(db, 'fundRequests'), orderBy('createdAt', 'desc')), (snapshot) => {
      setFundRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'fundRequests');
    });

    const unsubSubscriptionRequests = onSnapshot(query(collection(db, 'subscriptionRequests'), orderBy('createdAt', 'desc')), (snapshot) => {
      setSubscriptionRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'subscriptionRequests');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'payment'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setQrCodeUrl(data.qrCodeUrl || '');
        setUsdtQrCodeUrl(data.usdtQrCodeUrl || '');
        setUsdtWalletAddress(data.usdtWalletAddress || '');
        setUsdtNetwork(data.usdtNetwork || '');
        setMinDepositINR(data.minDepositINR || 10);
        setMinDepositUSDT(data.minDepositUSDT || 10);
        setReferralBonusPercent(data.referralBonusPercent || 2);
        setSmmApiUrl(data.smmApiUrl || '');
        setSmmApiKey(data.smmApiKey || '');
        setSilverQrCodeUrl(data.silverQrCodeUrl || '');
        setGoldQrCodeUrl(data.goldQrCodeUrl || '');
        setVipQrCodeUrl(data.vipQrCodeUrl || '');
      }
    });

    const unsubTickets = onSnapshot(query(collection(db, 'tickets'), orderBy('updatedAt', 'desc')), (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tickets');
    });

    return () => {
      unsubServices();
      unsubOrders();
      unsubUsers();
      unsubNav();
      unsubFundRequests();
      unsubSubscriptionRequests();
      unsubSettings();
      unsubTickets();
    };
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await updateDoc(doc(db, 'services', editingService.id), serviceForm);
        showNotification('success', 'Service updated successfully');
      } else {
        await addDoc(collection(db, 'services'), serviceForm);
        showNotification('success', 'Service added successfully');
      }
      setIsModalOpen(false);
      setEditingService(null);
      setServiceForm({ name: '', category: '', pricePer1000: 0, minOrder: 10, maxOrder: 100000, description: '' });
    } catch (err) {
      showNotification('error', 'Failed to save service');
      handleFirestoreError(err, OperationType.WRITE, 'services');
    }
  };

  const handleDeleteService = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Service',
      message: 'Are you sure you want to delete this service?',
      type: 'delete',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'services', id));
          showNotification('success', 'Service deleted');
        } catch (err) {
          showNotification('error', 'Failed to delete service');
          handleFirestoreError(err, OperationType.DELETE, `services/${id}`);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      showNotification('success', `Order status updated to ${status}`);
    } catch (err) {
      showNotification('error', 'Failed to update order status');
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const handleAddBalance = (user: any) => {
    setBalanceModal({
      isOpen: true,
      userId: user.id,
      userEmail: user.email,
      amount: '',
      type: 'add'
    });
  };

  const handleDeductBalance = (user: any) => {
    setBalanceModal({
      isOpen: true,
      userId: user.id,
      userEmail: user.email,
      amount: '',
      type: 'deduct'
    });
  };

  const confirmBalanceUpdate = async () => {
    const amount = parseFloat(balanceModal.amount);
    if (isNaN(amount) || amount <= 0) {
      showNotification('error', 'Please enter a valid amount');
      return;
    }

    const isAdd = balanceModal.type === 'add';

    try {
      console.log(`${isAdd ? 'Adding' : 'Deducting'} balance:`, amount, 'to user:', balanceModal.userId);
      const batch = writeBatch(db);
      
      const userRef = doc(db, 'users', balanceModal.userId);
      batch.update(userRef, {
        balance: increment(isAdd ? amount : -amount)
      });

      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        userId: balanceModal.userId,
        amount: amount,
        type: isAdd ? 'deposit' : 'deduction',
        description: isAdd ? `Admin added funds` : `Admin deducted funds`,
        createdAt: serverTimestamp()
      });

      await batch.commit();
      
      showNotification('success', `${isAdd ? 'Added' : 'Deducted'} ₹${amount} ${isAdd ? 'to' : 'from'} ${balanceModal.userEmail}`);
      setBalanceModal(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error(`Error ${isAdd ? 'adding' : 'deducting'} balance:`, err);
      showNotification('error', `Failed to ${isAdd ? 'add' : 'deduct'} balance`);
      handleFirestoreError(err, OperationType.UPDATE, `users/${balanceModal.userId}`);
    }
  };

  const handleApproveFunds = async (request: any) => {
    console.log('Attempting to approve funds for request:', request);
    setConfirmModal({
      isOpen: true,
      title: 'Approve Funds',
      message: `Approve ₹${request.amount} for ${request.userEmail}?`,
      type: 'approve',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          console.log('Confirming approval for:', request.id, 'user:', request.userId);
          const batch = writeBatch(db);
          
          const { getDoc: getDocSingle } = await import('firebase/firestore');
          const userSnap = await getDocSingle(doc(db, 'users', request.userId));
          const userData = userSnap.data();

          // Check if already approved to prevent double refund/deposit
          if (request.status === 'approved') {
            showNotification('error', 'This request is already approved');
            setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
            return;
          }

          batch.update(doc(db, 'fundRequests', request.id), { status: 'approved' });
          batch.update(doc(db, 'users', request.userId), {
            balance: increment(request.amount)
          });

          // Create Deposit Transaction
          const depositTxRef = doc(collection(db, 'transactions'));
          batch.set(depositTxRef, {
            userId: request.userId,
            amount: request.amount,
            type: 'deposit',
            description: `Deposit via ${request.paymentMethod || 'UPI'} - ${request.transactionId}`,
            createdAt: serverTimestamp()
          });

          // Referral Bonus Logic
          if (userData?.referredBy) {
            const bonusAmount = (request.amount * referralBonusPercent) / 100;
            if (bonusAmount > 0) {
              batch.update(doc(db, 'users', userData.referredBy), {
                balance: increment(bonusAmount),
                referralEarnings: increment(bonusAmount)
              });
              
              // Create Referral Transaction
              const referralTxRef = doc(collection(db, 'transactions'));
              batch.set(referralTxRef, {
                userId: userData.referredBy,
                amount: bonusAmount,
                type: 'referral',
                description: `Referral bonus from ${request.userEmail} deposit`,
                createdAt: serverTimestamp()
              });
              
              console.log(`Referral bonus of ₹${bonusAmount} applied to referrer ${userData.referredBy}`);
            }
          }

          await batch.commit();
          console.log('Batch commit successful');
          showNotification('success', 'Funds approved successfully');
        } catch (err) {
          console.error('Error in handleApproveFunds:', err);
          showNotification('error', 'Failed to approve funds');
          handleFirestoreError(err, OperationType.UPDATE, 'fundRequests/users');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
      }
    });
  };

  const handleRejectFunds = async (requestId: string) => {
    console.log('Attempting to reject fund request:', requestId);
    setConfirmModal({
      isOpen: true,
      title: 'Reject Request',
      message: 'Are you sure you want to reject this request?',
      type: 'reject',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          console.log('Confirming rejection for:', requestId);
          await updateDoc(doc(db, 'fundRequests', requestId), { status: 'rejected' });
          console.log('Rejection successful');
          showNotification('success', 'Request rejected');
        } catch (err) {
          console.error('Error rejecting request:', err);
          showNotification('error', 'Failed to reject request');
          handleFirestoreError(err, OperationType.UPDATE, `fundRequests/${requestId}`);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
      }
    });
  };

  const handleApproveSubscription = async (request: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Subscription',
      message: `Approve ${request.planType.toUpperCase()} plan for ${request.userEmail}?`,
      type: 'approve',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          const batch = writeBatch(db);
          
          // 1. Update request status
          batch.update(doc(db, 'subscriptionRequests', request.id), { status: 'approved' });
          
          // 2. Update user plan
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          
          const bonusMap: Record<string, number> = {
            'silver': 50,
            'gold': 150,
            'vip': 400
          };
          const bonus = bonusMap[request.planType] || 0;

          batch.update(doc(db, 'users', request.userId), {
            plan_type: request.planType,
            plan_expiry: expiryDate.toISOString(),
            balance: increment(bonus)
          });

          // 3. Create transaction record for bonus
          const txRef = doc(collection(db, 'transactions'));
          batch.set(txRef, {
            userId: request.userId,
            amount: bonus,
            type: 'deposit',
            description: `Premium ${request.planType.toUpperCase()} Upgrade Bonus`,
            createdAt: serverTimestamp()
          });

          await batch.commit();
          showNotification('success', 'Subscription approved and plan activated!');
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'subscriptionRequests/approve');
          showNotification('error', 'Failed to approve subscription');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
      }
    });
  };

  const handleRejectSubscription = async (requestId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Subscription',
      message: 'Are you sure you want to reject this subscription request?',
      type: 'reject',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await updateDoc(doc(db, 'subscriptionRequests', requestId), { status: 'rejected' });
          showNotification('success', 'Subscription request rejected');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `subscriptionRequests/${requestId}`);
          showNotification('error', 'Failed to reject request');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
      }
    });
  };

  const handleRefundOrder = async (order: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Refund Order',
      message: `Refund ₹${order.charge} to ${order.userId}?`,
      type: 'approve',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          // Check if already cancelled/refunded to prevent double refund
          if (order.status === 'cancelled') {
            showNotification('error', 'This order is already cancelled/refunded');
            setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
            return;
          }
          const batch = writeBatch(db);
          
          // 1. Update order status
          batch.update(doc(db, 'orders', order.id), { status: 'cancelled' });
          
          // 2. Refund balance
          batch.update(doc(db, 'users', order.userId), {
            balance: increment(order.charge)
          });

          // 3. Create transaction record
          const txRef = doc(collection(db, 'transactions'));
          batch.set(txRef, {
            userId: order.userId,
            amount: order.charge,
            type: 'refund',
            description: `Refund for order #${order.id.slice(0, 8)}`,
            createdAt: serverTimestamp()
          });

          await batch.commit();
          showNotification('success', 'Order refunded successfully');
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'orders/refund');
          showNotification('error', 'Failed to refund order');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
      }
    });
  };

  const handleDirectChat = async (user: any) => {
    try {
      // Check for existing open ticket for this user
      const q = query(
        collection(db, 'tickets'),
        where('userId', '==', user.id),
        where('status', '==', 'open'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Redirect to existing ticket
        navigate(`/tickets/${snapshot.docs[0].id}`);
      } else {
        // Create new direct chat ticket
        const ticketRef = await addDoc(collection(db, 'tickets'), {
          userId: user.id,
          userEmail: user.email,
          subject: 'Direct Support Chat',
          request: 'Support',
          status: 'open',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: 'Chat started by Admin',
          lastSenderId: 'admin',
          lastSenderName: 'Admin'
        });
        
        // Add initial message
        await addDoc(collection(db, 'tickets', ticketRef.id, 'messages'), {
          ticketId: ticketRef.id,
          senderId: 'admin',
          senderName: 'Admin',
          text: 'Hello! How can I help you today?',
          createdAt: serverTimestamp()
        });
        
        navigate(`/tickets/${ticketRef.id}`);
      }
    } catch (err) {
      console.error('Error starting direct chat:', err);
      showNotification('error', 'Failed to start chat');
    }
  };

  const handleUpdatePaymentSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'payment'), {
        qrCodeUrl,
        usdtQrCodeUrl,
        usdtWalletAddress,
        usdtNetwork,
        minDepositINR,
        minDepositUSDT,
        referralBonusPercent,
        smmApiUrl,
        smmApiKey,
        silverQrCodeUrl,
        goldQrCodeUrl,
        vipQrCodeUrl,
        updatedAt: serverTimestamp()
      });
      showNotification('success', 'Settings updated successfully');
    } catch (err) {
      showNotification('error', 'Failed to update settings');
      handleFirestoreError(err, OperationType.WRITE, 'settings/payment');
    }
  };

  const handleUpdateSubscriptionSettings = async () => {
    try {
      await updateDoc(doc(db, 'settings', 'payment'), {
        silverQrCodeUrl,
        goldQrCodeUrl,
        vipQrCodeUrl,
        updatedAt: serverTimestamp()
      });
      showNotification('success', 'Subscription settings updated');
    } catch (err) {
      showNotification('error', 'Failed to update subscription settings');
      handleFirestoreError(err, OperationType.WRITE, 'settings/payment');
    }
  };

  const toggleNavVisibility = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'navigation', id), { isVisible: !current });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `navigation/${id}`);
    }
  };

  const syncOrderStatus = async (orderId: string, externalOrderId: string) => {
    try {
      const response = await fetch(`/api/smm/status/${externalOrderId}`);
      const data = await response.json();
      if (data.status) {
        let newStatus = 'pending';
        const apiStatus = data.status.toLowerCase();
        if (apiStatus.includes('completed')) newStatus = 'completed';
        else if (apiStatus.includes('processing') || apiStatus.includes('inprogress')) newStatus = 'processing';
        else if (apiStatus.includes('canceled') || apiStatus.includes('cancelled')) newStatus = 'cancelled';
        
        await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      }
    } catch (err) {
      console.error("Status Sync Error:", err);
    }
  };

  const syncServicesFromAPI = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/smm/services');
      const apiServices = await response.json();

      if (Array.isArray(apiServices)) {
        const batch = writeBatch(db);
        
        // Fetch existing services to avoid duplicates
        const existingServicesSnap = await getDocs(collection(db, 'services'));
        const existingMap = new Map();
        existingServicesSnap.forEach(doc => {
          const data = doc.data();
          if (data.externalId) {
            existingMap.set(String(data.externalId), doc.id);
          }
        });

        // Sync all services in batches of 500
        const CHUNK_SIZE = 500;

        for (let i = 0; i < apiServices.length; i += CHUNK_SIZE) {
          const batch = writeBatch(db);
          const chunk = apiServices.slice(i, i + CHUNK_SIZE);

          for (const service of chunk) {
            // Convert provider rate (usually in USD) to INR
            const rawRate = parseFloat(service.rate);
            let baseRate = rawRate * usdToInr;
            let finalRate = baseRate;
            
            const name = (service.name || '').toLowerCase();
            const category = (service.category || '').toLowerCase();

            // Increase 30rs in followers
            if (name.includes('follower') || category.includes('follower')) {
              finalRate += 30;
            }
            // Increase 0.0200 in instagram views
            else if ((name.includes('instagram') && name.includes('view')) || 
                     (category.includes('instagram') && category.includes('view'))) {
              finalRate += 0.0200;
            }
            // Increase 2rs in likes
            else if (name.includes('like') || category.includes('like')) {
              finalRate += 2;
            }
            // Default margin
            else {
              finalRate += 5;
            }

            const externalId = String(service.service);
            const existingId = existingMap.get(externalId);
            const serviceRef = existingId ? doc(db, 'services', existingId) : doc(collection(db, 'services'));
            
            batch.set(serviceRef, {
              name: service.name,
              category: service.category,
              pricePer1000: finalRate,
              providerPrice: rawRate,
              minOrder: parseInt(service.min),
              maxOrder: parseInt(service.max),
              description: service.type || '',
              externalId: service.service,
              provider: 'mainsmmteam',
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          await batch.commit();
        }

        showNotification('success', `Successfully synced ${apiServices.length} services with price adjustments!`);
      }
    } catch (err) {
      console.error("Sync Error:", err);
      showNotification('error', "Failed to sync services. Check console.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteAllServices = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete All Services',
      message: 'Are you sure you want to delete ALL services? This action cannot be undone.',
      type: 'delete',
      onConfirm: async () => {
        try {
          const snapshot = await getDocs(collection(db, 'services'));
          if (snapshot.empty) {
            showNotification('info' as any, 'No services to delete');
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            return;
          }
          
          const batch = writeBatch(db);
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          showNotification('success', `Successfully deleted ${snapshot.size} services`);
        } catch (err) {
          showNotification('error', 'Failed to delete all services');
          handleFirestoreError(err, OperationType.DELETE, 'services');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSaveNavItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNavItem) {
        await updateDoc(doc(db, 'navigation', editingNavItem.id), navForm);
      } else {
        await addDoc(collection(db, 'navigation'), navForm);
      }
      setIsNavModalOpen(false);
      setEditingNavItem(null);
      setNavForm({ label: '', icon: 'Circle', path: '/', isVisible: true, order: navItems.length + 1, badge: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'navigation');
    }
  };

  const handleDeleteNavItem = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Menu Item',
      message: 'Are you sure you want to delete this menu item?',
      type: 'delete',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'navigation', id));
          showNotification('success', 'Menu item deleted');
        } catch (err) {
          showNotification('error', 'Failed to delete menu item');
          handleFirestoreError(err, OperationType.DELETE, `navigation/${id}`);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const stats = {
    totalUsers: users.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((acc, order) => acc + (order.charge || 0), 0),
    totalDeposits: fundRequests.filter(r => r.status === 'approved').reduce((acc, r) => acc + (r.amount || 0), 0),
    pendingFunds: fundRequests.filter(r => r.status === 'pending').length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    totalReferralEarnings: users.reduce((acc, user) => acc + (user.referralEarnings || 0), 0)
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2 rounded-xl bg-slate-900 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LucideIcons.LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'services' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="h-4 w-4" />
            Services
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('navigation')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'navigation' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
          <button
            onClick={() => setActiveTab('fundRequests')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'fundRequests' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LucideIcons.Wallet className="h-4 w-4" />
            Funds
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'tickets' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LucideIcons.Ticket className="h-4 w-4" />
            Tickets
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'subscriptions' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LucideIcons.Crown className="h-4 w-4" />
            Subs
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Users</p>
                  <h3 className="text-2xl font-bold text-white">{stats.totalUsers}</h3>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Orders</p>
                  <h3 className="text-2xl font-bold text-white">{stats.totalOrders}</h3>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <LucideIcons.IndianRupee className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</h3>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <LucideIcons.Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Deposits</p>
                  <h3 className="text-2xl font-bold text-white">{formatCurrency(stats.totalDeposits)}</h3>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Pending Funds</p>
                  <h3 className="text-2xl font-bold text-white">{stats.pendingFunds}</h3>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <LucideIcons.Ticket className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Open Tickets</p>
                  <h3 className="text-2xl font-bold text-white">{stats.openTickets}</h3>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-bold text-white">Recent Activity</h3>
              <div className="space-y-4">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between rounded-xl bg-slate-800/50 p-3 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{order.serviceName}</p>
                        <p className="text-[10px] text-slate-500">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Just now'}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-500">{formatCurrency(order.charge)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-bold text-white">New Users</h3>
              <div className="space-y-4">
                {users.slice(0, 5).map(user => (
                  <div key={user.id} className="flex items-center justify-between rounded-xl bg-slate-800/50 p-3 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.email}</p>
                        <p className="text-[10px] text-slate-500">Balance: {formatCurrency(user.balance)}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      user.role === 'admin' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2">
                <span className="text-xs font-medium text-slate-400">USD to INR:</span>
                <input
                  type="number"
                  value={usdToInr}
                  onChange={(e) => setUsdToInr(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>
              <button 
                onClick={syncServicesFromAPI}
                disabled={isSyncing}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-700 disabled:opacity-50"
              >
                <LucideIcons.RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                {isSyncing ? 'Syncing...' : 'Sync from API'}
              </button>
              <button 
                onClick={handleDeleteAllServices}
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-500 transition-all hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </button>
            </div>
            <button
              onClick={() => {
                setEditingService(null);
                setServiceForm({ name: '', category: '', pricePer1000: 0, minOrder: 10, maxOrder: 100000, description: '' });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Add Service
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-sm font-medium text-slate-400">
                  <th className="pb-4 pr-4">Name</th>
                  <th className="pb-4 pr-4">Category</th>
                  <th className="pb-4 pr-4">Price/1k</th>
                  <th className="pb-4 pr-4">Min/Max</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {services
                  .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .sort((a, b) => {
                    const catCompare = a.category.localeCompare(b.category);
                    if (catCompare !== 0) return catCompare;
                    return a.name.localeCompare(b.name);
                  })
                  .map(service => (
                  <tr key={service.id} className="text-sm">
                    <td className="py-4 pr-4 text-white font-medium">{service.name}</td>
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                        {service.category}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-emerald-500 font-bold">{formatCurrency(service.pricePer1000)}</td>
                    <td className="py-4 pr-4 text-slate-400 text-xs">{service.minOrder} / {service.maxOrder}</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingService(service);
                            setServiceForm(service);
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteService(service.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'orders' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-sm font-medium text-slate-400">
                  <th className="pb-4 pr-4">ID</th>
                  <th className="pb-4 pr-4">User</th>
                  <th className="pb-4 pr-4">Service</th>
                  <th className="pb-4 pr-4">Quantity</th>
                  <th className="pb-4 pr-4">Status</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map(order => (
                  <tr key={order.id} className="text-sm">
                    <td className="py-4 pr-4 font-mono text-xs text-slate-500">#{order.id.slice(0, 6)}</td>
                    <td className="py-4 pr-4 text-slate-300 text-xs">{order.userId.slice(0, 8)}...</td>
                    <td className="py-4 pr-4 text-white font-medium">{order.serviceName}</td>
                    <td className="py-4 pr-4 text-slate-400">{order.quantity}</td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        order.status === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-1">
                        {order.externalOrderId && (
                          <button
                            onClick={() => syncOrderStatus(order.id, order.externalOrderId)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition-colors"
                            title="Sync Status from API"
                          >
                            <LucideIcons.RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400"
                          title="Set Processing"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400"
                          title="Set Completed"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                          title="Set Cancelled"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleRefundOrder(order)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-orange-400"
                          title="Refund Order"
                        >
                          <LucideIcons.RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'users' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-sm font-medium text-slate-400">
                  <th className="pb-4 pr-4">User</th>
                  <th className="pb-4 pr-4">Email</th>
                  <th className="pb-4 pr-4">Balance</th>
                  <th className="pb-4 pr-4">Role</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map(user => (
                  <tr key={user.id} className="text-sm">
                    <td className="py-4 pr-4 text-white font-medium">{user.displayName}</td>
                    <td className="py-4 pr-4 text-slate-400">{user.email}</td>
                    <td className="py-4 pr-4 text-emerald-500 font-bold">{formatCurrency(user.balance)}</td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === 'admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAddBalance(user)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-500"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </button>
                        <button 
                          onClick={() => handleDeductBalance(user)}
                          className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-red-500"
                        >
                          <LucideIcons.Minus className="h-3 w-3" />
                          Deduct
                        </button>
                        <button 
                          onClick={() => handleDirectChat(user)}
                          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-blue-500"
                        >
                          <LucideIcons.MessageSquare className="h-3 w-3" />
                          Chat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'navigation' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Sidebar Navigation</h2>
              <p className="text-sm text-slate-400">Manage sidebar menu items.</p>
            </div>
            <button
              onClick={() => {
                setEditingNavItem(null);
                setNavForm({ label: '', icon: 'Circle', path: '/', isVisible: true, order: navItems.length + 1, badge: '' });
                setIsNavModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {navItems.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4 transition-all",
                  item.isVisible ? "border-blue-500/30 bg-blue-500/5" : "border-slate-800 bg-slate-900/50 opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-800 p-2 text-slate-400">
                    {(() => {
                      const Icon = (LucideIcons as any)[item.icon] || LucideIcons.HelpCircle;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingNavItem(item);
                      setNavForm({
                        label: item.label,
                        icon: item.icon,
                        path: item.path,
                        isVisible: item.isVisible,
                        order: item.order,
                        badge: item.badge || ''
                      });
                      setIsNavModalOpen(true);
                    }}
                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleNavVisibility(item.id, item.isVisible)}
                    className={cn(
                      "rounded-lg p-2 transition-all",
                      item.isVisible ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500"
                    )}
                  >
                    {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteNavItem(item.id)}
                    className="rounded-lg p-2 text-red-400 transition-all hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'fundRequests' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Payment Settings */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Payment Settings</h2>
              <p className="text-sm text-slate-400">Update the payment details shown to users.</p>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-2">
              {/* UPI Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">UPI Settings</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">UPI QR Code Image URL</label>
                  <input
                    type="text"
                    value={qrCodeUrl}
                    onChange={(e) => setQrCodeUrl(e.target.value)}
                    placeholder="https://example.com/qr-code.png"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* SMM Provider Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">SMM Provider Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">API URL</label>
                    <input
                      type="text"
                      value={smmApiUrl}
                      onChange={(e) => setSmmApiUrl(e.target.value)}
                      placeholder="https://mainsmmteam.com/api/v2"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">API Key</label>
                    <input
                      type="text"
                      value={smmApiKey}
                      onChange={(e) => setSmmApiKey(e.target.value)}
                      placeholder="Enter your API key"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* USDT Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">USDT Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">USDT QR Code URL</label>
                    <input
                      type="text"
                      value={usdtQrCodeUrl}
                      onChange={(e) => setUsdtQrCodeUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">USDT Wallet Address</label>
                    <input
                      type="text"
                      value={usdtWalletAddress}
                      onChange={(e) => setUsdtWalletAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">USDT Network (e.g. TRC20)</label>
                    <input
                      type="text"
                      value={usdtNetwork}
                      onChange={(e) => setUsdtNetwork(e.target.value)}
                      placeholder="TRC20"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Referral & Deposit Limits */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Referral & Deposit Limits</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Min Deposit (INR)</label>
                    <input
                      type="number"
                      value={minDepositINR}
                      onChange={(e) => setMinDepositINR(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Min Deposit (USDT)</label>
                    <input
                      type="number"
                      value={minDepositUSDT}
                      onChange={(e) => setMinDepositUSDT(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Referral Bonus (%)</label>
                    <input
                      type="number"
                      value={referralBonusPercent}
                      onChange={(e) => setReferralBonusPercent(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleUpdatePaymentSettings}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-all hover:bg-blue-500"
              >
                Save Payment Settings
              </button>
            </div>
          </div>

          {/* Fund Requests Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Fund Requests</h2>
              <p className="text-sm text-slate-400">Review and approve user payment requests.</p>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-sm font-medium text-slate-400">
                  <th className="pb-4 pr-4">User</th>
                  <th className="pb-4 pr-4">Amount</th>
                  <th className="pb-4 pr-4">Method</th>
                  <th className="pb-4 pr-4">Transaction ID</th>
                  <th className="pb-4 pr-4">Status</th>
                  <th className="pb-4 pr-4">Date</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {fundRequests.map(request => (
                  <tr key={request.id} className="text-sm">
                    <td className="py-4 pr-4">
                      <div className="text-white font-medium">{request.userEmail}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{request.userId}</div>
                    </td>
                    <td className="py-4 pr-4 text-emerald-500 font-bold">{formatCurrency(request.amount)}</td>
                    <td className="py-4 pr-4">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        request.paymentMethod === 'usdt' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      )}>
                        {request.paymentMethod || 'upi'}
                      </span>
                    </td>
                    <td className="py-4 pr-4 font-mono text-xs text-blue-400">{request.transactionId}</td>
                    <td className="py-4 pr-4">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        request.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                        request.status === 'rejected' ? "bg-red-500/10 text-red-500" :
                        "bg-blue-500/10 text-blue-500"
                      )}>
                        {request.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-slate-500 text-xs">
                      {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleString() : 'Pending...'}
                    </td>
                    <td className="py-4">
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApproveFunds(request)}
                            className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-500 transition-colors"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleRejectFunds(request.id)}
                            className="rounded-lg bg-red-600 p-1.5 text-white hover:bg-red-500 transition-colors"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {fundRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 italic">No fund requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    )}

      {activeTab === 'tickets' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Support Tickets</h2>
            <p className="text-sm text-slate-400">Manage user support requests and complaints.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-sm font-medium text-slate-400">
                  <th className="pb-4 pr-4">Subject</th>
                  <th className="pb-4 pr-4">User</th>
                  <th className="pb-4 pr-4">Type</th>
                  <th className="pb-4 pr-4">Status</th>
                  <th className="pb-4 pr-4">Last Update</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="text-sm">
                    <td className="py-4 pr-4">
                      <div className="text-white font-bold">{ticket.subject}</div>
                      {ticket.orderId && <div className="text-[10px] text-blue-500 font-mono">Order: #{ticket.orderId}</div>}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="text-slate-300 text-xs">{ticket.userId.slice(0, 8)}...</div>
                    </td>
                    <td className="py-4 pr-4 text-slate-400">{ticket.request}</td>
                    <td className="py-4 pr-4">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                        ticket.status === 'open' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                        ticket.status === 'closed' ? "bg-slate-500/10 text-slate-500 border-slate-700" :
                        "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      )}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-slate-500 text-xs">
                      {ticket.updatedAt?.toDate ? ticket.updatedAt.toDate().toLocaleString() : 'Pending...'}
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <Link 
                          to={`/tickets/${ticket.id}`}
                          className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-500 transition-colors"
                          title="Open Chat"
                        >
                          <LucideIcons.MessageSquare className="h-4 w-4" />
                        </Link>
                        {ticket.status !== 'closed' && (
                          <button 
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'tickets', ticket.id), { status: 'closed', updatedAt: serverTimestamp() });
                                showNotification('success', 'Ticket closed');
                              } catch (err) {
                                showNotification('error', 'Failed to close ticket');
                              }
                            }}
                            className="rounded-lg bg-slate-700 p-1.5 text-slate-300 hover:bg-slate-600 transition-colors"
                            title="Close Ticket"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 italic">No support tickets found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Subscription Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Subscription QR Codes</h2>
              <p className="text-sm text-slate-400">Set unique QR codes for each premium plan.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">Silver Plan QR URL</label>
                <input
                  type="text"
                  value={silverQrCodeUrl}
                  onChange={(e) => setSilverQrCodeUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">Gold Plan QR URL</label>
                <input
                  type="text"
                  value={goldQrCodeUrl}
                  onChange={(e) => setGoldQrCodeUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">VIP Plan QR URL</label>
                <input
                  type="text"
                  value={vipQrCodeUrl}
                  onChange={(e) => setVipQrCodeUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpdateSubscriptionSettings}
                className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-all"
              >
                Save QR Settings
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Subscription Requests</h2>
              <p className="text-sm text-slate-400">Approve or reject user plan upgrade requests.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-sm font-medium text-slate-400">
                    <th className="pb-4 pr-4">User</th>
                    <th className="pb-4 pr-4">Plan</th>
                    <th className="pb-4 pr-4">Amount</th>
                    <th className="pb-4 pr-4">Transaction ID</th>
                    <th className="pb-4 pr-4">Status</th>
                    <th className="pb-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {subscriptionRequests.map(req => (
                    <tr key={req.id} className="text-sm">
                      <td className="py-4 pr-4 text-white">{req.userEmail}</td>
                      <td className="py-4 pr-4">
                        <span className={cn(
                          "font-bold uppercase",
                          req.planType === 'silver' ? "text-slate-400" :
                          req.planType === 'gold' ? "text-amber-400" :
                          "text-purple-400"
                        )}>
                          {req.planType}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-white font-medium">{formatCurrency(req.amount)}</td>
                      <td className="py-4 pr-4 font-mono text-xs text-slate-500">{req.transactionId}</td>
                      <td className="py-4 pr-4">
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                          req.status === 'approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          req.status === 'rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4">
                        {req.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveSubscription(req)}
                              className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-500 transition-colors"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectSubscription(req.id)}
                              className="rounded-lg bg-red-600 p-1.5 text-white hover:bg-red-500 transition-colors"
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {subscriptionRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500 italic">No subscription requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Service Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
            >
              <h2 className="mb-6 text-2xl font-bold text-white">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <form onSubmit={handleSaveService} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">Name</label>
                    <input
                      required
                      type="text"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">Category</label>
                    <input
                      required
                      type="text"
                      value={serviceForm.category}
                      onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-400">Price per 1000 (INR)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={serviceForm.pricePer1000}
                    onChange={(e) => setServiceForm({ ...serviceForm, pricePer1000: parseFloat(e.target.value) })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">Min Order</label>
                    <input
                      required
                      type="number"
                      value={serviceForm.minOrder}
                      onChange={(e) => setServiceForm({ ...serviceForm, minOrder: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">Max Order</label>
                    <input
                      required
                      type="number"
                      value={serviceForm.maxOrder}
                      onChange={(e) => setServiceForm({ ...serviceForm, maxOrder: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-400">Description</label>
                  <textarea
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    className="h-24 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-700 py-3 font-bold text-slate-400 transition-all hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-500"
                  >
                    Save Service
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isNavModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
            >
              <h2 className="mb-6 text-2xl font-bold text-white">
                {editingNavItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <form onSubmit={handleSaveNavItem} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">Label</label>
                    <input
                      required
                      type="text"
                      value={navForm.label}
                      onChange={(e) => setNavForm({ ...navForm, label: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">Icon (Lucide Name)</label>
                    <input
                      required
                      type="text"
                      value={navForm.icon}
                      onChange={(e) => setNavForm({ ...navForm, icon: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">Path</label>
                    <input
                      required
                      type="text"
                      value={navForm.path}
                      onChange={(e) => setNavForm({ ...navForm, path: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">Order</label>
                    <input
                      required
                      type="number"
                      value={navForm.order}
                      onChange={(e) => setNavForm({ ...navForm, order: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-400">Badge (Optional)</label>
                  <input
                    type="text"
                    value={navForm.badge}
                    onChange={(e) => setNavForm({ ...navForm, badge: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isVisible"
                    checked={navForm.isVisible}
                    onChange={(e) => setNavForm({ ...navForm, isVisible: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isVisible" className="text-sm font-medium text-slate-400">Visible in Sidebar</label>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsNavModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-300 transition-all hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-500"
                  >
                    {editingNavItem ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-8 left-1/2 z-[100] flex items-center gap-2 rounded-xl px-6 py-3 shadow-2xl backdrop-blur-xl border",
              notification.type === 'success' ? "bg-emerald-500/90 border-emerald-400 text-white" : "bg-red-500/90 border-red-400 text-white"
            )}
          >
            {notification.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="text-sm font-bold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Update Modal */}
      <AnimatePresence>
        {balanceModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBalanceModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
            >
              <h2 className="mb-2 text-xl font-bold text-white">
                {balanceModal.type === 'add' ? 'Add Balance' : 'Deduct Balance'}
              </h2>
              <p className="mb-6 text-sm text-slate-400">
                {balanceModal.type === 'add' ? 'Add funds to' : 'Deduct funds from'} {balanceModal.userEmail}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-400">Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                    <input
                      autoFocus
                      type="number"
                      value={balanceModal.amount}
                      onChange={(e) => setBalanceModal(prev => ({ ...prev, amount: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && confirmBalanceUpdate()}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-8 pr-4 text-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setBalanceModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-300 transition-all hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBalanceUpdate}
                    className={cn(
                      "flex-1 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition-all",
                      balanceModal.type === 'add' 
                        ? "bg-emerald-600 shadow-emerald-900/20 hover:bg-emerald-500" 
                        : "bg-red-600 shadow-red-900/20 hover:bg-red-500"
                    )}
                  >
                    Confirm {balanceModal.type === 'add' ? 'Add' : 'Deduct'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className={cn(
                  "rounded-full p-3",
                  confirmModal.type === 'approve' ? "bg-emerald-500/10 text-emerald-500" :
                  confirmModal.type === 'reject' ? "bg-red-500/10 text-red-500" :
                  "bg-blue-500/10 text-blue-500"
                )}>
                  <Info className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{confirmModal.title}</h2>
                  <p className="text-sm text-slate-400">{confirmModal.message}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-300 transition-all hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  disabled={confirmModal.loading}
                  className={cn(
                    "flex-1 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2",
                    confirmModal.loading ? "opacity-50 cursor-not-allowed" : "",
                    confirmModal.type === 'approve' ? "bg-emerald-600 hover:bg-emerald-500" :
                    confirmModal.type === 'reject' ? "bg-red-600 hover:bg-red-500" :
                    confirmModal.type === 'delete' ? "bg-red-600 hover:bg-red-500" :
                    "bg-blue-600 hover:bg-blue-500"
                  )}
                >
                  {confirmModal.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
