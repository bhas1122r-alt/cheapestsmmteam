import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';

interface NotificationManagerProps {
  userProfile: any;
}

export default function NotificationManager({ userProfile }: NotificationManagerProps) {
  const lastProcessedTime = useRef<number>(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    // Check if notifications are enabled in localStorage
    const notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    if (notificationsEnabled && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!userProfile) return;

    // Listen for ticket updates
    // For admins, listen to ALL tickets. For users, only THEIR tickets.
    const ticketsQuery = userProfile.role === 'admin' 
      ? query(collection(db, 'tickets'), orderBy('updatedAt', 'desc'), limit(10))
      : query(collection(db, 'tickets'), where('userId', '==', userProfile.uid), orderBy('updatedAt', 'desc'), limit(10));

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const ticket = change.doc.data();
          const updatedAt = ticket.updatedAt?.toMillis() || 0;

          // Only process if it's a new update and not from the current user
          if (updatedAt > lastProcessedTime.current && ticket.lastSenderId !== userProfile.uid) {
            lastProcessedTime.current = updatedAt;
            
            const notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
            if (notificationsEnabled) {
              // Play sound
              audioRef.current?.play().catch(e => console.log('Audio play failed:', e));

              // Show browser notification
              if (Notification.permission === 'granted') {
                const notification = new Notification(`New Message: ${ticket.subject}`, {
                  body: `${ticket.lastSenderName}: ${ticket.lastMessage}`,
                  icon: '/favicon.ico',
                  tag: change.doc.id // Prevent duplicate notifications for same ticket
                });

                notification.onclick = () => {
                  window.focus();
                  navigate(`/tickets/${change.doc.id}`);
                  notification.close();
                };
              }
            }
          }
        }
      });
      
      // Update lastProcessedTime to current max updatedAt on initial load to avoid back-notifications
      if (snapshot.docs.length > 0) {
        const maxTime = Math.max(...snapshot.docs.map(d => d.data().updatedAt?.toMillis() || 0));
        if (maxTime > lastProcessedTime.current) {
          lastProcessedTime.current = maxTime;
        }
      }
    });

    return () => unsubscribe();
  }, [userProfile]);

  return null;
}
