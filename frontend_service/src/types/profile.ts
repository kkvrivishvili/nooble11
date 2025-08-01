// src/types/profile.ts
import React from 'react';
import { QueryObserverResult } from '@tanstack/react-query';
import { WidgetType } from './widget';

// Define IconComponent type for Tabler icons
export type IconComponent = React.ComponentType<{ size?: number; className?: string; }>;

export interface SocialLink {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'linkedin' | 'facebook' | 'spotify';
  url: string;
  icon?: string | IconComponent;
}

// Updated ProfileLink to match widgetLinks table
export interface ProfileLink {
  id: string;
  profileId: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  createdAt?: string;
}

// Widget types
export interface Widget {
  id: string;
  type: WidgetType;
  position: number;
  isActive: boolean;
}

// Agent types - now normalized
export interface AgentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  systemPromptTemplate: string;
  defaultQueryConfig: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    stream: boolean;
  };
  defaultRagConfig: {
    embeddingModel: string;
    embeddingDimensions: number;
    chunkSize: number;
    chunkOverlap: number;
    topK: number;
    similarityThreshold: number;
    hybridSearch: boolean;
    rerank: boolean;
  };
  defaultExecutionConfig: {
    historyEnabled: boolean;
    historyWindow: number;
    historyTtl: number;
    maxIterations: number;
    timeoutSeconds: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  userId: string;
  templateId: string | null;
  name: string;
  description: string | null;
  icon: string;
  systemPromptOverride: string | null;
  queryConfig: AgentTemplate['defaultQueryConfig'];
  ragConfig: AgentTemplate['defaultRagConfig'];
  executionConfig: AgentTemplate['defaultExecutionConfig'];
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed field from view or function
  systemPrompt?: string;
  // Template reference (if needed)
  template?: AgentTemplate;
}

// Enhanced Design types
export interface ProfileTheme {
  // Colors
  primaryColor: string;
  backgroundColor: string;
  textColor?: string;
  buttonTextColor?: string;
  
  // Typography
  fontFamily?: 'sans' | 'serif' | 'mono';
  fontSize?: 'sm' | 'md' | 'lg';
  
  // Styling
  borderRadius?: 'sharp' | 'curved' | 'round';
  buttonFill?: 'solid' | 'glass' | 'outline';
  buttonShadow?: 'none' | 'subtle' | 'hard';
  
  // Wallpaper
  wallpaper?: ProfileWallpaper;
}

export interface ProfileWallpaper {
  type: 'fill' | 'gradient' | 'blur' | 'pattern' | 'image' | 'video';
  
  // Fill type
  fillColor?: string;
  
  // Gradient type
  gradientColors?: string[];
  gradientDirection?: 'up' | 'down' | 'left' | 'right' | 'diagonal';
  gradientType?: 'linear' | 'radial';
  
  // Blur type
  blurIntensity?: number;
  blurColor?: string;
  
  // Pattern type
  patternType?: 'dots' | 'lines' | 'grid' | 'waves' | 'circles';
  patternColor?: string;
  patternOpacity?: number;
  
  // Image type
  imageUrl?: string;
  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  imageSize?: 'cover' | 'contain' | 'auto';
  imageOverlay?: string; // rgba color for overlay
  
  // Video type
  videoUrl?: string;
  videoMuted?: boolean;
  videoLoop?: boolean;
  videoOverlay?: string;
}

export interface ProfileLayout {
  linkStyle?: 'card' | 'button' | 'minimal';
  socialPosition?: 'top' | 'bottom' | 'hidden';
  contentWidth?: 'narrow' | 'normal' | 'wide';
  spacing?: 'compact' | 'normal' | 'relaxed';
}

export interface ProfileDesign {
  theme: ProfileTheme;
  layout?: ProfileLayout;
  version?: number; // For migration purposes
}

// Profile interface
export interface Profile {
  id: string;
  username: string;
  displayName: string;
  description: string;
  avatar: string;
  socialLinks: SocialLink[];
  agents: string[]; // Array of agent UUIDs
  widgets: Widget[]; // Widget ordering and metadata
  design: ProfileDesign;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

// Widget-specific types matching database tables
export interface WidgetLinks {
  id: string;
  profileId: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  createdAt: string;
}

export interface WidgetGallery {
  id: string;
  profileId: string;
  title?: string;
  products: string[]; // Product IDs (jsonb)
  showPrice: boolean;
  showDescription: boolean;
  columns: number;
  createdAt: string;
}

export interface WidgetAgents {
  id: string;
  profileId: string;
  title: string;
  agentIds: string[]; // Agent IDs (jsonb)
  displayStyle: 'card' | 'list' | 'bubble';
  createdAt: string;
}

export interface WidgetYouTube {
  id: string;
  profileId: string;
  videoUrl: string;
  title?: string;
  autoplay: boolean;
  showControls: boolean;
  createdAt: string;
}

export interface WidgetMaps {
  id: string;
  profileId: string;
  address: string;
  latitude?: number;
  longitude?: number;
  zoomLevel: number;
  mapStyle: string;
  createdAt: string;
}

export interface WidgetSpotify {
  id: string;
  profileId: string;
  spotifyUrl: string;
  embedType: 'track' | 'playlist' | 'album' | 'artist';
  height: number;
  theme: 'dark' | 'light';
  createdAt: string;
}

export interface WidgetCalendar {
  id: string;
  profileId: string;
  calendlyUrl: string;
  title: string;
  hideEventDetails: boolean;
  hideCookieBanner: boolean;
  createdAt: string;
}

export interface WidgetSeparator {
  id: string;
  profileId: string;
  style: 'solid' | 'dashed' | 'dotted';
  thickness: number;
  color: string;
  marginTop: number;
  marginBottom: number;
  createdAt: string;
}

export interface WidgetTitle {
  id: string;
  profileId: string;
  text: string;
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  createdAt: string;
}

// Full profile with populated data
export interface ProfileWithAgents extends Profile {
  agentDetails: Agent[]; // Full agent objects
  linkWidgets: WidgetLinks[]; // Links from widgetLinks table
  agentWidgets?: WidgetAgents[]; // Agent widgets data
  galleryWidgets?: WidgetGallery[]; // Gallery widgets data
  youtubeWidgets?: WidgetYouTube[]; // YouTube widgets data
  mapsWidgets?: WidgetMaps[]; // Maps widgets data
  spotifyWidgets?: WidgetSpotify[]; // Spotify widgets data
  calendarWidgets?: WidgetCalendar[]; // Calendar widgets data
  separatorWidgets?: WidgetSeparator[]; // Separator widgets data
  titleWidgets?: WidgetTitle[]; // Title widgets data
}

export interface ProfileContextType {
  profile: ProfileWithAgents | null;
  isLoading: boolean;
  isError: boolean;
  updateProfile: (payload: ProfileUpdatePayload) => void;
  updateProfileInfo: (data: { displayName?: string; description?: string; avatar?: string; }) => void;
  isUsernameAvailable: (username: string) => Promise<boolean>;
  // Link widget management
  addLinkWidget: (link: Omit<ProfileLink, 'id' | 'createdAt' | 'profileId'>) => void;
  updateLinkWidget: (id: string, data: Partial<Omit<ProfileLink, 'id' | 'profileId'>>) => void;
  removeLinkWidget: (id: string) => void;
  reorderWidgets: (widgets: Widget[]) => void;
  // Social links (still in profile)
  addSocialLink: (socialLink: Omit<SocialLink, 'icon'>) => void;
  updateSocialLink: (platform: string, data: Partial<Omit<SocialLink, 'platform'>>) => void;
  removeSocialLink: (platform: string) => void;
  // Agent management
  createAgent: (templateId: string, name?: string) => Promise<Agent>;
  updateAgent: (agentId: string, data: Partial<Agent>) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  refreshProfile: () => Promise<QueryObserverResult<ProfileWithAgents | null>>;
}

// Sync status hook type
export interface SyncStatus {
  hasPendingChanges: boolean;
  pendingChangesCount: number;
  isOnline: boolean;
}

// API Request/Response types
export interface ProfileUpdatePayload {
  displayName?: string;
  description?: string;
  avatar?: string;
  socialLinks?: SocialLink[];
  design?: ProfileDesign;
  isPublic?: boolean;
}

// Platform configurations
export interface SocialPlatformConfig {
  platform: SocialLink['platform'];
  label: string;
  icon?: string | IconComponent;
  urlPattern: RegExp;
  placeholder: string;
  baseUrl: string;
}

export interface LinkTypeConfig {
  type: string;
  label: string;
  icon: string | IconComponent;
  urlPattern?: RegExp;
  placeholder: string;
}