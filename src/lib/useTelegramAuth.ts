import { useState, useEffect } from 'react';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramWebAppInitData {
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  query_id?: string;
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
}

export interface TelegramAuthState {
  loading: boolean;
  isValidTelegram: boolean;
  user: TelegramUser | null;
  initData: TelegramWebAppInitData | null;
  error: string | null;
  isGroupMember: boolean | null;
  groupCheckLoading: boolean;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: TelegramWebAppInitData;
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}

export function useTelegramAuth(): TelegramAuthState {
  const [state, setState] = useState<TelegramAuthState>({
    loading: true,
    isValidTelegram: false,
    user: null,
    initData: null,
    error: null,
    isGroupMember: null,
    groupCheckLoading: false,
  });

  useEffect(() => {
    const checkTelegramAuth = async () => {
      try {
        // Wait for Telegram WebApp to be available (with timeout)
        const waitForTelegram = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds max wait
            
            const check = () => {
              attempts++;
              
              // Check multiple ways to detect Telegram
              const hasTelegramWebApp = window.Telegram?.WebApp;
              const hasTelegramInUA = navigator.userAgent.includes('Telegram');
              const isInTelegramFrame = window.parent !== window;
              
              if (hasTelegramWebApp) {
                console.log('Telegram WebApp found after', attempts * 100, 'ms');
                resolve(hasTelegramWebApp);
                return;
              }
              
              if (attempts >= maxAttempts) {
                console.log('Telegram detection failed. UA:', navigator.userAgent);
                console.log('Has Telegram object:', !!window.Telegram);
                console.log('Has WebApp:', !!window.Telegram?.WebApp);
                console.log('In frame:', isInTelegramFrame);
                reject(new Error('Telegram WebApp not found'));
                return;
              }
              
              setTimeout(check, 100); // Check every 100ms
            };
            
            check();
          });
        };

        let telegram;
        try {
          telegram = await waitForTelegram();
        } catch {
          // Not in Telegram environment - check if we're in development
          const isDev = import.meta.env.DEV || import.meta.env.VITE_ALLOW_NON_TELEGRAM;
          
          if (isDev) {
            setState(prev => ({
              ...prev,
              loading: false,
              isValidTelegram: true,
              isGroupMember: true,
              error: null,
            }));
            return;
          }
          
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'This app can only be accessed through Telegram',
          }));
          return;
        }

        // Initialize Telegram WebApp
        telegram.ready();
        telegram.expand();

        const initData = telegram.initDataUnsafe;
        const rawInitData = telegram.initData;

        if (!initData || !initData.user || !rawInitData) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Invalid Telegram initialization data',
          }));
          return;
        }

        // Update state with Telegram user data
        setState(prev => ({
          ...prev,
          isValidTelegram: true,
          user: initData.user || null,
          initData,
          groupCheckLoading: true,
        }));

        // Check group membership via API
        try {
          const response = await fetch('/.netlify/functions/telegram-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              initData: rawInitData,
              userId: initData.user.id,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();

          setState(prev => ({
            ...prev,
            loading: false,
            groupCheckLoading: false,
            isGroupMember: result.isGroupMember,
            error: result.isGroupMember ? null : 'Group membership required',
          }));

        } catch (error) {
          setState(prev => ({
            ...prev,
            loading: false,
            groupCheckLoading: false,
            error: error instanceof Error ? error.message : 'Failed to verify group membership',
          }));
        }

      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
        }));
      }
    };

    checkTelegramAuth();
  }, []);

  return state;
}
