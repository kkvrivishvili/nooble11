import React, { createContext, useContext, useEffect, useState } from 'react';
import { ProfileDesign, ProfileTheme, ProfileLayout } from '@/types/profile';

interface ProfileThemeContextType {
  theme: ProfileTheme;
  layout: ProfileLayout;
  applyTheme: (design: ProfileDesign) => void;
  resetTheme: () => void;
  isLoading: boolean;
}

const defaultTheme: ProfileTheme = {
  primaryColor: '#000000',
  backgroundColor: '#ffffff',
  backgroundImage: undefined,
  borderRadius: 'lg',
  fontFamily: 'sans',
};

const defaultLayout: ProfileLayout = {
  linkStyle: 'card',
  socialPosition: 'top',
};

const ProfileThemeContext = createContext<ProfileThemeContextType | null>(null);

interface ProfileThemeProviderProps {
  children: React.ReactNode;
  profileDesign?: ProfileDesign;
}

export function ProfileThemeProvider({ 
  children, 
  profileDesign 
}: ProfileThemeProviderProps) {
  const [theme, setTheme] = useState<ProfileTheme>(defaultTheme);
  const [layout, setLayout] = useState<ProfileLayout>(defaultLayout);
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme to CSS variables
  const applyCSSVariables = (theme: ProfileTheme) => {
    const root = document.documentElement;
    
    // Set CSS custom properties for the profile theme
    root.style.setProperty('--profile-primary-color', theme.primaryColor);
    root.style.setProperty('--profile-background-color', theme.backgroundColor);
    
    if (theme.backgroundImage) {
      root.style.setProperty('--profile-background-image', `url(${theme.backgroundImage})`);
    } else {
      root.style.removeProperty('--profile-background-image');
    }
    
    // Border radius mapping
    const radiusMap = {
      'sm': '4px',
      'md': '8px', 
      'lg': '12px',
      'xl': '16px'
    };
    root.style.setProperty('--profile-border-radius', radiusMap[theme.borderRadius || 'lg']);
    
    // Font family
    const fontMap = {
      'sans': 'system-ui, -apple-system, sans-serif',
      'serif': 'Georgia, serif',
      'mono': 'Monaco, monospace'
    };
    root.style.setProperty('--profile-font-family', fontMap[theme.fontFamily || 'sans']);
  };

  // Apply theme when profileDesign changes
  useEffect(() => {
    if (profileDesign) {
      const newTheme = { ...defaultTheme, ...profileDesign.theme };
      const newLayout = { ...defaultLayout, ...profileDesign.layout };
      
      setTheme(newTheme);
      setLayout(newLayout);
      applyCSSVariables(newTheme);
    } else {
      // Apply default theme
      setTheme(defaultTheme);
      setLayout(defaultLayout);
      applyCSSVariables(defaultTheme);
    }
    setIsLoading(false);
  }, [profileDesign]);

  const applyTheme = (design: ProfileDesign) => {
    const newTheme = { ...defaultTheme, ...design.theme };
    const newLayout = { ...defaultLayout, ...design.layout };
    
    setTheme(newTheme);
    setLayout(newLayout);
    applyCSSVariables(newTheme);
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    setLayout(defaultLayout);
    applyCSSVariables(defaultTheme);
  };

  const value: ProfileThemeContextType = {
    theme,
    layout,
    applyTheme,
    resetTheme,
    isLoading,
  };

  return (
    <ProfileThemeContext.Provider value={value}>
      {children}
    </ProfileThemeContext.Provider>
  );
}

export function useProfileTheme() {
  const context = useContext(ProfileThemeContext);
  if (!context) {
    throw new Error('useProfileTheme must be used within a ProfileThemeProvider');
  }
  return context;
}