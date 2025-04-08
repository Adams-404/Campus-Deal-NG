
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SettingsContextType {
  fontSizeClass: string;
  updateFontSize: (size: string) => Promise<void>;
  hideSafetyTips: boolean;
  setHideSafetyTips: (value: boolean) => Promise<void>;
  hideSellTips: boolean;
  setHideSellTips: (value: boolean) => Promise<void>;
  hideMessageTips: boolean;
  setHideMessageTips: (value: boolean) => Promise<void>;
  showSafetyTips: boolean;
  setShowSafetyTips: (show: boolean) => void;
  loadingSettings: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// LocalStorage keys
const LS_HIDE_SAFETY_TIPS = 'hide_safety_tips';
const LS_HIDE_SELL_TIPS = 'hide_sell_tips';
const LS_HIDE_MESSAGE_TIPS = 'hide_message_tips';
const LS_FONT_SIZE = 'font_size';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontSizeClass, setFontSizeClass] = useState('medium');
  const [hideSafetyTips, setHideSafetyTipsState] = useState(false);
  const [hideSellTips, setHideSellTipsState] = useState(false);
  const [hideMessageTips, setHideMessageTipsState] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load settings from localStorage first, then try Supabase if user is logged in
  useEffect(() => {
    // First load from localStorage (for immediate response and guest users)
    const loadLocalSettings = () => {
      const localFontSize = localStorage.getItem(LS_FONT_SIZE);
      const localHideSafetyTips = localStorage.getItem(LS_HIDE_SAFETY_TIPS);
      const localHideSellTips = localStorage.getItem(LS_HIDE_SELL_TIPS);
      const localHideMessageTips = localStorage.getItem(LS_HIDE_MESSAGE_TIPS);

      if (localFontSize) setFontSizeClass(localFontSize);
      if (localHideSafetyTips) setHideSafetyTipsState(localHideSafetyTips === 'true');
      if (localHideSellTips) setHideSellTipsState(localHideSellTips === 'true');
      if (localHideMessageTips) setHideMessageTipsState(localHideMessageTips === 'true');
    };

    // Then try to load from Supabase if user is logged in
    const loadUserSettings = async () => {
      try {
        loadLocalSettings(); // Load from localStorage first for immediate response
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('font_size, hide_safety_tips, hide_sell_tips, hide_message_tips')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            // Update state and localStorage with Supabase data
            setFontSizeClass(data.font_size || 'medium');
            setHideSafetyTipsState(data.hide_safety_tips || false);
            setHideSellTipsState(data.hide_sell_tips || false);
            setHideMessageTipsState(data.hide_message_tips || false);
            
            // Update localStorage
            localStorage.setItem(LS_FONT_SIZE, data.font_size || 'medium');
            localStorage.setItem(LS_HIDE_SAFETY_TIPS, String(data.hide_safety_tips || false));
            localStorage.setItem(LS_HIDE_SELL_TIPS, String(data.hide_sell_tips || false));
            localStorage.setItem(LS_HIDE_MESSAGE_TIPS, String(data.hide_message_tips || false));
          }
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadUserSettings();
  }, []);

  const updateFontSize = async (size: string) => {
    setFontSizeClass(size);
    localStorage.setItem(LS_FONT_SIZE, size);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ font_size: size })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating font size:', error);
    }
  };

  const setHideSafetyTips = async (value: boolean) => {
    setHideSafetyTipsState(value);
    localStorage.setItem(LS_HIDE_SAFETY_TIPS, String(value));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ hide_safety_tips: value })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating safety tips preference:', error);
    }
  };

  const setHideSellTips = async (value: boolean) => {
    setHideSellTipsState(value);
    localStorage.setItem(LS_HIDE_SELL_TIPS, String(value));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ hide_sell_tips: value })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating sell tips preference:', error);
    }
  };

  const setHideMessageTips = async (value: boolean) => {
    setHideMessageTipsState(value);
    localStorage.setItem(LS_HIDE_MESSAGE_TIPS, String(value));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ hide_message_tips: value })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating message tips preference:', error);
    }
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        fontSizeClass, 
        updateFontSize,
        hideSafetyTips,
        setHideSafetyTips,
        hideSellTips,
        setHideSellTips,
        hideMessageTips,
        setHideMessageTips,
        showSafetyTips,
        setShowSafetyTips,
        loadingSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
