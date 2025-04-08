
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

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontSizeClass, setFontSizeClass] = useState('medium');
  const [hideSafetyTips, setHideSafetyTipsState] = useState(false);
  const [hideSellTips, setHideSellTipsState] = useState(false);
  const [hideMessageTips, setHideMessageTipsState] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('font_size, hide_safety_tips, hide_sell_tips, hide_message_tips')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            setFontSizeClass(data.font_size || 'medium');
            setHideSafetyTipsState(data.hide_safety_tips || false);
            setHideSellTipsState(data.hide_sell_tips || false);
            setHideMessageTipsState(data.hide_message_tips || false);
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
