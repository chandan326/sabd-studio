import { demoApiFetch, demoExport } from './demo-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const DEMO_FALLBACK = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE !== 'false';
const HAS_LIVE_API = Boolean(process.env.NEXT_PUBLIC_API_URL);

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('creatorflow_token');
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('creatorflow_token', token);
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('creatorflow_token');
  }
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (DEMO_FALLBACK && !HAS_LIVE_API && !endpoint.startsWith('http')) {
    return demoApiFetch(endpoint, options) as Promise<T>;
  }
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      const errorMsg = data.error?.message || `HTTP Error ${res.status}`;
      throw new Error(errorMsg);
    }

    return data.data;
  } catch (err: any) {
    if (DEMO_FALLBACK && !endpoint.startsWith('http')) {
      console.warn(`Live API unavailable for ${endpoint}; using local demo data.`);
      return demoApiFetch(endpoint, options) as Promise<T>;
    }
    throw err;
  }
}

export const api = {
  // Auth
  register: (payload: any) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  googleLogin: (credential: string) => apiFetch('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  getMe: () => apiFetch('/users/me'),

  // Workspaces & Brand
  getWorkspaces: () => apiFetch('/workspaces'),
  createWorkspace: (payload: any) => apiFetch('/workspaces', { method: 'POST', body: JSON.stringify(payload) }),
  getWorkspaceMembers: (workspaceId: string) => apiFetch(`/workspaces/${workspaceId}/members`),
  inviteMember: (workspaceId: string, payload: any) => apiFetch(`/workspaces/${workspaceId}/members`, { method: 'POST', body: JSON.stringify(payload) }),
  getBrandProfile: (workspaceId?: string) => apiFetch(workspaceId ? `/brand-profile?workspace_id=${workspaceId}` : '/brand-profile'),
  updateBrandProfile: (payload: any) => apiFetch('/brand-profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // Campaigns & Ingestion
  getCampaigns: (workspaceId?: string) => apiFetch(workspaceId ? `/campaigns?workspace_id=${workspaceId}` : '/campaigns'),
  createCampaign: (payload: any) => apiFetch('/campaigns', { method: 'POST', body: JSON.stringify(payload) }),
  getCampaign: (id: string) => apiFetch(`/campaigns/${id}`),
  deleteCampaign: (id: string) => apiFetch(`/campaigns/${id}`, { method: 'DELETE' }),
  uploadCampaignFile: async (campaignId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();
    try {
      if (DEMO_FALLBACK && !HAS_LIVE_API) return { id: `demo_upload_${Date.now()}`, campaign_id: campaignId, filename: file.name, status: 'ready' };
      const res = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/upload`, { method: 'POST', headers: token ? { 'Authorization': `Bearer ${token}` } : {}, body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'File upload failed');
      return data.data;
    } catch (error) {
      if (DEMO_FALLBACK) return { campaign_id: campaignId, filename: file.name, status: 'ready' };
      throw error;
    }
  },
  processCampaign: (id: string) => apiFetch(`/campaigns/${id}/process`, { method: 'POST' }),
  getCampaignStatus: (id: string) => apiFetch(`/campaigns/${id}/status`),
  getTranscript: (campaignId: string) => apiFetch(`/campaigns/${campaignId}/transcript`),
  updateTranscript: (campaignId: string, payload: any) => apiFetch(`/campaigns/${campaignId}/transcript`, { method: 'PUT', body: JSON.stringify(payload) }),
  exportCampaignPackage: async (campaignId: string, format = 'zip') => {
    if (DEMO_FALLBACK && !HAS_LIVE_API) return demoExport(campaignId);
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ format })
    });
    if (!res.ok) {
      if (DEMO_FALLBACK) return demoExport(campaignId);
      throw new Error('Export download failed');
    }
    return await res.blob();
  },
  getCampaignMedia: (campaignId: string) => apiFetch(`/campaigns/${campaignId}/media`),
  renderCampaignMedia: (campaignId: string, payload: any) => apiFetch(`/campaigns/${campaignId}/media`, { method: 'POST', body: JSON.stringify(payload) }),

  // Assets & Studio
  getAssets: (params: string = '') => apiFetch(`/assets?${params}`),
  getAsset: (id: string) => apiFetch(`/assets/${id}`),
  updateAsset: (id: string, payload: any) => apiFetch(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  approveAsset: (id: string, status: string = 'approved') => apiFetch(`/assets/${id}/approve`, { method: 'POST', body: JSON.stringify({ status }) }),
  regenerateAsset: (id: string) => apiFetch(`/assets/${id}/regenerate`, { method: 'POST' }),
  getAssetVersions: (id: string) => apiFetch(`/assets/${id}/versions`),
  generateThumbnail: (payload: any) => apiFetch('/thumbnails/generate', { method: 'POST', body: JSON.stringify(payload) }),

  // SEO
  analyseSEO: (payload: any) => apiFetch('/seo/analyse', { method: 'POST', body: JSON.stringify(payload) }),

  // Schedules & Calendar
  getSchedules: (params: string = '') => apiFetch(`/schedules?${params}`),
  createSchedule: (payload: any) => apiFetch('/schedules', { method: 'POST', body: JSON.stringify(payload) }),
  updateSchedule: (id: string, payload: any) => apiFetch(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  cancelSchedule: (id: string) => apiFetch(`/schedules/${id}/cancel`, { method: 'DELETE' }),

  // Integrations & Analytics
  getIntegrations: () => apiFetch('/integrations'),
  connectIntegration: (provider: string) => apiFetch(`/integrations/${provider}/connect`, { method: 'POST' }),
  disconnectIntegration: (id: string) => apiFetch(`/integrations/${id}/disconnect`, { method: 'DELETE' }),
  getAnalyticsOverview: () => apiFetch('/analytics/overview'),
  getRecommendations: () => apiFetch('/recommendations'),

  // Notifications & Audit Logs
  getNotifications: () => apiFetch('/notifications'),
  markNotificationsRead: () => apiFetch('/notifications', { method: 'POST' }),
  getAuditLogs: () => apiFetch('/audit-logs'),
};
