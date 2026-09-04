export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar?: string;
  email_verified: boolean;
  workspaces?: Workspace[];
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
  timezone: string;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer';
  status: string;
  joined_at: string;
}

export interface BrandProfile {
  id: string;
  workspace_id: string;
  brand_name: string;
  description: string;
  audience: string;
  niche: string;
  language: string;
  tone: string;
  preferred_terms: string;
  avoided_terms: string;
  content_goals: string;
  sample_content: string;
}

export interface Campaign {
  id: string;
  name: string;
  source_type: 'text' | 'transcript' | 'video' | 'audio' | 'document' | 'url';
  source_text?: string;
  status: 'draft' | 'uploading' | 'extracting' | 'transcribing' | 'analysing' | 'generating' | 'completed' | 'failed';
  target_platforms: string[];
  tone?: string;
  target_audience?: string;
  assets_count?: number;
  created_at: string;
  transcript?: Transcript;
  processing_job?: ProcessingJob;
  assets?: GeneratedAsset[];
}

export interface Transcript {
  id: string;
  text: string;
  original_text?: string;
  edited_text?: string;
  segments?: Array<{ start: number; end: number; text: string }>;
}

export interface ProcessingJob {
  id: string;
  status: string;
  progress: number;
  current_stage: string;
  error_message?: string;
}

export interface GeneratedAsset {
  id: string;
  campaign_id?: string;
  campaign_name?: string;
  platform: 'youtube' | 'instagram' | 'linkedin' | 'twitter' | 'blog' | 'shorts';
  asset_type: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  status: 'draft' | 'approved' | 'rejected';
  current_version: number;
  character_count?: number;
  seo_score?: number;
  versions?: AssetVersion[];
  seo_analysis?: SEOAnalysis;
  updated_at?: string;
}

export interface AssetVersion {
  id: string;
  version_number: number;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SEOCheck {
  rule: string;
  score: number;
  max_score: number;
  status: 'pass' | 'warning' | 'fail';
  message: string;
}

export interface SEOAnalysis {
  overall_score: number;
  checks: SEOCheck[];
  recommendations: string[];
}

export interface Schedule {
  id: string;
  asset_id: string;
  asset_title: string;
  platform: string;
  scheduled_for: string;
  timezone: string;
  status: 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  external_post_id?: string;
  failure_reason?: string;
}

export interface PlatformIntegration {
  id: string | null;
  provider: 'youtube' | 'instagram' | 'linkedin' | 'twitter';
  display_name: string;
  status: 'connected' | 'disconnected' | 'expired' | 'error';
  connected_at: string | null;
  configured: boolean;
}

export interface NotificationItem {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  actor: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  action: string;
  supporting_metric: string;
}
