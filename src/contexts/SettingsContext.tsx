
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserSettings {
  language?: string;
  onboardingCompleted?: boolean;
  emailFrequency?: 'daily' | 'weekly' | 'never';
  distance?: 'km' | 'miles';
  currency?: string;
  showGeneralSafetyTips?: boolean;
  showMessageSafetyTips?: boolean;
  showSellingSafetyTips?: boolean;
  fontSizeClass?: 'small' | 'medium' | 'large';
}

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
  fontSizeClass: string;
}

const defaultSettings: UserSettings = {
  language: 'en',
  onboardingCompleted: false,
  emailFrequency: 'weekly',
  distance: 'miles',
  currency: 'USD',
  showGeneralSafetyTips: true,
  showMessageSafetyTips: true,
  showSellingSafetyTips: true,
  fontSizeClass: 'medium'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if user_settings table exists
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (data && !error) {
            setSettings({
              ...defaultSettings,
              ...data
            });
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load user settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);
        
        // Check if user_settings table exists before upserting
        const { error } = await supabase
          .from('user_settings')
          .upsert({ 
            user_id: user.id, 
            ...updatedSettings,
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          console.error('Error updating settings:', error);
          toast.error('Failed to save settings');
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to save settings');
      throw error;
    }
  };

  // Helper property for font size class
  const fontSizeClass = settings.fontSizeClass || 'medium';

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading, fontSizeClass }}>
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
