
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SettingsContextType {
  fontSizeClass: string;
  updateFontSize: (size: string) => Promise<void>;
  hideSafetyTips: boolean;
  hideSellTips: boolean;
  hideMessageTips: boolean;
  showSafetyTips: boolean;
  setShowSafetyTips: (show: boolean) => void;
  loadingSettings: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontSizeClass, setFontSizeClass] = useState('medium');
  const [hideSafetyTips, setHideSafetyTips] = useState(false);
  const [hideSellTips, setHideSellTips] = useState(false);
  const [hideMessageTips, setHideMessageTips] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            // Use optional chaining and nullish coalescing for safer access
            setFontSizeClass(data.font_size || 'medium');
            setHideSafetyTips(data.hide_safety_tips || false);
            setHideSellTips(data.hide_sell_tips || false);
            setHideMessageTips(data.hide_message_tips || false);
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

  return (
    <SettingsContext.Provider 
      value={{ 
        fontSizeClass, 
        updateFontSize,
        hideSafetyTips,
        hideSellTips,
        hideMessageTips,
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
