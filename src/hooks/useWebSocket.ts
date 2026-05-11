import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authUtils } from '../utils/auth';
import { toast } from 'react-toastify';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

export function useWebSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = () => {
    const token = authUtils.getToken();
    if (!token) return;

    // Remove potential trailing slash from WS_URL
    const baseUrl = WS_URL.replace(/\/$/, '');
    const ws = new WebSocket(`${baseUrl}/ws?token=${token}`);

    ws.onopen = () => {
      console.log('✅ WebSocket Connected');
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('📩 WebSocket Message:', payload);

        if (payload.type === 'pong') return;

        switch (payload.type) {
          case 'order_update':
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders-count'] });
            toast.info(`Order #${payload.data.order_id} status updated to ${payload.data.status}`, {
              position: "bottom-right",
              autoClose: 5000,
            });
            break;

          case 'new_order':
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders-count'] });
            toast.success('New order received! 🛍️', {
              position: "top-center",
              autoClose: 10000,
            });
            
            // Play sound with interaction check
            notificationSound.play().catch(e => {
              console.warn('🔊 Audio play failed (likely due to browser policy):', e);
            });
            break;

          case 'stock_update':
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products-count'] });
            if (payload.data.stock <= 5) {
               toast.warning(`Low stock alert: ${payload.data.product_name || 'Product'} (${payload.data.stock} left)`, {
                 position: "bottom-right"
               });
            }
            break;

          case 'product_update':
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products-count'] });
            break;

          case 'category_update':
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            break;

          case 'new_user':
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.info('A new user has registered! 👋', {
              position: "bottom-right"
            });
            break;

          default:
            console.log('Unhandled WebSocket message type:', payload.type);
        }
      } catch (e) {
        console.error('❌ Failed to parse WebSocket message', e);
      }
    };

    ws.onclose = (event) => {
      console.log(`🔌 WebSocket Disconnected (${event.code}). Reconnecting in 5s...`);
      socketRef.current = null;
      reconnectTimeoutRef.current = window.setTimeout(connect, 5000);
    };

    ws.onerror = (error) => {
      console.error('🚨 WebSocket Error:', error);
      ws.close();
    };

    socketRef.current = ws;
  };

  useEffect(() => {
    connect();

    // Heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds

    return () => {
      clearInterval(heartbeatInterval);
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return socketRef.current;
}
