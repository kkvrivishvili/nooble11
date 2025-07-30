// src/context/profile-theme-context.tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ProfileDesign, ProfileTheme, ProfileLayout } from '@/types/profile';
import { designPresets } from '@/api/design-api';

interface ProfileThemeContextType {
  theme: ProfileTheme;
  layout: ProfileLayout;
  isLoading: boolean;
}

const ProfileThemeContext = createContext<ProfileThemeContextType | undefined>(undefined);

interface ProfileThemeProviderProps {
  children: React.ReactNode;
  profileDesign?: ProfileDesign | null;
}

export function ProfileThemeProvider({ children, profileDesign }: ProfileThemeProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Use provided design or default
  const design = useMemo(() => {
    if (profileDesign) return profileDesign;
    return designPresets.classic;
  }, [profileDesign]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const value = useMemo(() => ({
    theme: design.theme,
    layout: design.layout || {
      linkStyle: 'card',
      socialPosition: 'top',
      contentWidth: 'normal',
      spacing: 'normal',
      showChatInput: true
    },
    isLoading
  }), [design, isLoading]);

  return (
    <ProfileThemeContext.Provider value={value}>
      {children}
    </ProfileThemeContext.Provider>
  );
}

export function useProfileTheme() {
  const context = useContext(ProfileThemeContext);
  if (!context) {
    throw new Error('useProfileTheme must be used within ProfileThemeProvider');
  }
  return context;
}