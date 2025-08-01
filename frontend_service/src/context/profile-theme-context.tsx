// src/context/profile-theme-context.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ProfileDesign, ProfileTheme, ProfileLayout, ProfileWallpaper } from '@/types/profile';

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
  textColor: '#111827',
  buttonTextColor: '#ffffff',
  borderRadius: 'curved',
  buttonFill: 'solid',
  buttonShadow: 'subtle',
  fontFamily: 'sans',
};

const defaultLayout: ProfileLayout = {
  linkStyle: 'card',
  socialPosition: 'top',
  contentWidth: 'normal',
  spacing: 'normal',
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

  // Generate wallpaper CSS
  const generateWallpaperStyles = (wallpaper?: ProfileWallpaper): string => {
    if (!wallpaper) return '';

    switch (wallpaper.type) {
      case 'fill':
        return wallpaper.fillColor || '#ffffff';
      
      case 'gradient': {
        if (!wallpaper.gradientColors || wallpaper.gradientColors.length === 0) return '';
        const direction = wallpaper.gradientDirection === 'diagonal' ? 'to bottom right' :
                         wallpaper.gradientDirection === 'up' ? 'to top' :
                         wallpaper.gradientDirection === 'down' ? 'to bottom' :
                         wallpaper.gradientDirection === 'left' ? 'to left' : 'to right';
        return `linear-gradient(${direction}, ${wallpaper.gradientColors.join(', ')})`;
      }
      
      case 'blur':
        // This creates a backdrop blur effect
        return `rgba(${hexToRgb(wallpaper.blurColor || '#f3f4f6')}, 0.8)`;
      
      case 'pattern':
        return generatePatternBackground(wallpaper);
      
      case 'image':
        if (!wallpaper.imageUrl) return '';
        return `url(${wallpaper.imageUrl})`;
      
      case 'video':
        // Video backgrounds need to be handled differently with a video element
        return 'transparent';
      
      default:
        return '';
    }
  };

  // Generate pattern backgrounds
  const generatePatternBackground = (wallpaper: ProfileWallpaper): string => {
    const color = wallpaper.patternColor || '#000000';
    const opacity = wallpaper.patternOpacity || 0.2;
    
    switch (wallpaper.patternType) {
      case 'dots':
        return `radial-gradient(circle, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 1px, transparent 1px)`;
      case 'lines':
        return `repeating-linear-gradient(45deg, transparent, transparent 10px, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 10px, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 11px)`;
      case 'grid':
        return `repeating-linear-gradient(0deg, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 1px, transparent 1px, transparent 20px)`;
      default:
        return '';
    }
  };

  // Helper function to convert hex to rgb
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '0, 0, 0';
  };

  // Apply theme to CSS variables
  const applyCSSVariables = (theme: ProfileTheme) => {
    const root = document.documentElement;
    
    // Colors
    root.style.setProperty('--profile-primary-color', theme.primaryColor);
    root.style.setProperty('--profile-background-color', theme.backgroundColor);
    root.style.setProperty('--profile-text-color', theme.textColor || '#111827');
    root.style.setProperty('--profile-button-text-color', theme.buttonTextColor || '#ffffff');
    
    // Border radius mapping
    const radiusMap = {
      'sharp': '0.25rem',
      'curved': '0.5rem',
      'round': '9999px'
    };
    root.style.setProperty('--profile-border-radius', radiusMap[theme.borderRadius || 'curved']);
    
    // Font family
    const fontMap = {
      'sans': 'system-ui, -apple-system, sans-serif',
      'serif': 'Georgia, serif',
      'mono': 'Monaco, monospace'
    };
    root.style.setProperty('--profile-font-family', fontMap[theme.fontFamily || 'sans']);
    
    // Button styles
    root.style.setProperty('--profile-button-fill', theme.buttonFill || 'solid');
    
    // Button shadow mapping
    const shadowMap = {
      'none': 'none',
      'subtle': '0 2px 4px rgba(0, 0, 0, 0.1)',
      'hard': '4px 4px 0 rgba(0, 0, 0, 0.2)'
    };
    root.style.setProperty('--profile-button-shadow', shadowMap[theme.buttonShadow || 'subtle']);
    
    // Wallpaper
    if (theme.wallpaper) {
      const wallpaperStyle = generateWallpaperStyles(theme.wallpaper);
      root.style.setProperty('--profile-wallpaper', wallpaperStyle);
      
      // Background size for patterns
      if (theme.wallpaper.type === 'pattern') {
        root.style.setProperty('--profile-wallpaper-size', '20px 20px');
      } else if (theme.wallpaper.type === 'image') {
        root.style.setProperty('--profile-wallpaper-size', theme.wallpaper.imageSize || 'cover');
        root.style.setProperty('--profile-wallpaper-position', theme.wallpaper.imagePosition || 'center');
      } else {
        root.style.setProperty('--profile-wallpaper-size', 'auto');
        root.style.setProperty('--profile-wallpaper-position', 'center');
      }
      
      // Blur effect
      if (theme.wallpaper.type === 'blur') {
        root.style.setProperty('--profile-blur-intensity', `${theme.wallpaper.blurIntensity || 20}px`);
      } else {
        root.style.setProperty('--profile-blur-intensity', '0');
      }
    } else {
      root.style.setProperty('--profile-wallpaper', theme.backgroundColor);
      root.style.setProperty('--profile-wallpaper-size', 'auto');
      root.style.setProperty('--profile-blur-intensity', '0');
    }
  };

  // Apply layout variables
  const applyLayoutVariables = (layout: ProfileLayout) => {
    const root = document.documentElement;
    
    // Content width
    const widthMap = {
      'narrow': '28rem',
      'normal': '36rem',
      'wide': '48rem'
    };
    root.style.setProperty('--profile-content-width', widthMap[layout.contentWidth || 'normal']);
    
    // Spacing
    const spacingMap = {
      'compact': '0.5rem',
      'normal': '1rem',
      'relaxed': '1.5rem'
    };
    root.style.setProperty('--profile-spacing', spacingMap[layout.spacing || 'normal']);
  };

  // Apply theme when profileDesign changes
  useEffect(() => {
    if (profileDesign) {
      const newTheme = { ...defaultTheme, ...profileDesign.theme };
      const newLayout = { ...defaultLayout, ...profileDesign.layout };
      
      setTheme(newTheme);
      setLayout(newLayout);
      applyCSSVariables(newTheme);
      applyLayoutVariables(newLayout);
    } else {
      // Apply default theme
      setTheme(defaultTheme);
      setLayout(defaultLayout);
      applyCSSVariables(defaultTheme);
      applyLayoutVariables(defaultLayout);
    }
    setIsLoading(false);
  }, [profileDesign]);

  const applyTheme = (design: ProfileDesign) => {
    const newTheme = { ...defaultTheme, ...design.theme };
    const newLayout = { ...defaultLayout, ...design.layout };
    
    setTheme(newTheme);
    setLayout(newLayout);
    applyCSSVariables(newTheme);
    applyLayoutVariables(newLayout);
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    setLayout(defaultLayout);
    applyCSSVariables(defaultTheme);
    applyLayoutVariables(defaultLayout);
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