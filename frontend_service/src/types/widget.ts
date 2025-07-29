// src/types/widget.ts
import { IconComponent } from './profile';

// Base widget interface
export interface BaseWidget {
  id: string;
  type: WidgetType;
  position: number;
  isActive: boolean;
}

// Widget types enum
export enum WidgetType {
  Link = 'link',
  Agents = 'agents',
  Gallery = 'gallery',
  YouTube = 'youtube',
  Maps = 'maps',
  Spotify = 'spotify',
  Calendar = 'calendar',
  Separator = 'separator',
  Title = 'title',
}

// Main Widget interface used in profiles
export interface Widget {
  id: string;
  type: WidgetType;
  position: number;
  isActive: boolean;
}

// Widget data wrapper
export interface WidgetData<T = unknown> {
  widget: Widget;
  data: T;
}

// Specific widget data types (for forms/editors)
export interface LinkWidgetData {
  title: string;
  url: string;
  description?: string;
  icon?: string;
}

export interface AgentsWidgetData {
  title: string;
  agentIds: string[];
  displayStyle: 'card' | 'list' | 'bubble';
}

export interface GalleryWidgetData {
  title?: string;
  products: string[];
  showPrice: boolean;
  showDescription: boolean;
  columns: number;
}

export interface YouTubeWidgetData {
  videoUrl: string;
  title?: string;
  autoplay: boolean;
  showControls: boolean;
}

export interface MapsWidgetData {
  address: string;
  latitude?: number;
  longitude?: number;
  zoomLevel: number;
  mapStyle: string;
}

export interface SpotifyWidgetData {
  spotifyUrl: string;
  embedType: 'track' | 'playlist' | 'album' | 'artist';
  height: number;
  theme: 'dark' | 'light';
}

export interface CalendarWidgetData {
  calendlyUrl: string;
  title: string;
  hideEventDetails: boolean;
  hideCookieBanner: boolean;
}

export interface SeparatorWidgetData {
  style: 'solid' | 'dashed' | 'dotted';
  thickness: number;
  color: string;
  marginTop: number;
  marginBottom: number;
}

export interface TitleWidgetData {
  text: string;
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
}

// Union type for all widget data
export type AnyWidgetData = 
  | LinkWidgetData
  | AgentsWidgetData
  | GalleryWidgetData
  | YouTubeWidgetData
  | MapsWidgetData
  | SpotifyWidgetData
  | CalendarWidgetData
  | SeparatorWidgetData
  | TitleWidgetData;

// Widget configuration
export interface WidgetConfig<T = unknown> {
  type: WidgetType;
  label: string;
  description: string;
  icon: IconComponent;
  defaultData: T;
  validator: (data: T) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Widget component props
export interface WidgetComponentProps<T = unknown> {
  widget: Widget;
  data: T;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onUpdate?: (data: T) => Promise<void>;
}

export interface WidgetEditorProps<T = unknown> {
  data?: T;
  onSave: (data: T) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Drag and drop types
export interface DraggableWidgetProps {
  widget: Widget;
  children: React.ReactNode;
  disabled?: boolean;
}

export interface DroppableWidgetAreaProps {
  widgets: Widget[];
  onReorder: (widgets: Widget[]) => Promise<void>;
  children: React.ReactNode;
}

// Type guards
export function isLinkWidget(data: AnyWidgetData): data is LinkWidgetData {
  return 'url' in data && 'title' in data;
}

export function isAgentsWidget(data: AnyWidgetData): data is AgentsWidgetData {
  return 'agentIds' in data && 'displayStyle' in data;
}

export function isGalleryWidget(data: AnyWidgetData): data is GalleryWidgetData {
  return 'products' in data && 'columns' in data;
}

export function isYouTubeWidget(data: AnyWidgetData): data is YouTubeWidgetData {
  return 'videoUrl' in data && 'autoplay' in data;
}

export function isMapsWidget(data: AnyWidgetData): data is MapsWidgetData {
  return 'address' in data && 'zoomLevel' in data;
}

export function isSpotifyWidget(data: AnyWidgetData): data is SpotifyWidgetData {
  return 'spotifyUrl' in data && 'embedType' in data;
}

export function isCalendarWidget(data: AnyWidgetData): data is CalendarWidgetData {
  return 'calendlyUrl' in data && 'hideEventDetails' in data;
}

export function isSeparatorWidget(data: AnyWidgetData): data is SeparatorWidgetData {
  return 'style' in data && 'thickness' in data && 'marginTop' in data;
}

export function isTitleWidget(data: AnyWidgetData): data is TitleWidgetData {
  return 'text' in data && 'fontSize' in data && 'textAlign' in data;
}