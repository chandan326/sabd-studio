type DemoState = {
  campaigns: any[];
  assets: any[];
  schedules: any[];
  integrations: any[];
  brand: any;
};

const STORE_KEY = 'sabd_studio_demo_v2';
const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

function createAsset(id: string, campaignId: string, campaignName: string, platform: string) {
  const label = platform === 'twitter' ? 'X thread' : `${platform[0].toUpperCase()}${platform.slice(1)} post`;
  return {
    id,
    campaign: campaignId,
    campaign_name: campaignName,
    platform,
    title: `${campaignName}: a practical creator workflow`,
    content: `${label} generated from your source.\n\nTurn one strong idea into useful, platform-ready content without repeating manual work. Start with the audience problem, share three clear takeaways, and finish with one focused call to action.`,
    status: 'draft',
    current_version: 1,
    created_at: now(),
    updated_at: now(),
    metadata: { hashtags: ['#ContentStrategy', '#CreatorTools', '#SabdStudio'], timestamps: ['00:00 Introduction', '00:24 Key idea', '01:12 Action plan'] },
    seo_analysis: {
      overall_score: 86,
      checks: [
        { rule: 'title_length', status: 'pass', score: 20, max_score: 20, message: 'Title length is clear and searchable.' },
        { rule: 'keyword_placement', status: 'pass', score: 18, max_score: 20, message: 'Primary topic appears early in the copy.' },
        { rule: 'readability', status: 'pass', score: 18, max_score: 20, message: 'Copy uses short, readable sentences.' },
      ],
      recommendations: ['Add one audience-specific proof point.', 'Test a second headline with a stronger benefit.'],
    },
    versions: [{ id: `${id}_v1`, version_number: 1, content: `${label} generated from your source.`, created_at: now() }],
  };
}

function seedState(): DemoState {
  const campaignId = 'campaign_demo';
  const name = 'Creator Workflow Launch';
  const platforms = ['youtube', 'instagram', 'linkedin', 'twitter', 'blog', 'shorts'];
  const assets = platforms.map((platform, index) => createAsset(`asset_demo_${index + 1}`, campaignId, name, platform));
  assets[0].status = 'approved';
  return {
    campaigns: [{ id: campaignId, name, title: name, status: 'completed', input_type: 'topic', assets_count: assets.length, created_at: now(), updated_at: now() }],
    assets,
    schedules: [{ id: 'schedule_demo', asset_id: assets[0].id, asset_title: assets[0].title, platform: assets[0].platform, scheduled_for: new Date(Date.now() + 86400000).toISOString(), timezone: 'UTC', status: 'scheduled' }],
    integrations: ['youtube', 'instagram', 'linkedin', 'twitter'].map((provider) => ({ id: `integration_${provider}`, provider, display_name: `${provider[0].toUpperCase()}${provider.slice(1)} publishing`, status: 'disconnected' })),
    brand: { brand_name: 'Sabd Studio', voice_tone: 'clear, practical, confident', target_audience: 'creators and marketing teams', primary_color: '#1a73e8', keywords: 'creator workflow, content automation, publishing' },
  };
}

function readState(): DemoState {
  if (typeof window === 'undefined') return seedState();
  try {
    const value = localStorage.getItem(STORE_KEY);
    return value ? JSON.parse(value) : seedState();
  } catch {
    return seedState();
  }
}

function saveState(state: DemoState) {
  if (typeof window !== 'undefined') localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function body(options: RequestInit) {
  try { return options.body ? JSON.parse(options.body as string) : {}; } catch { return {}; }
}

export async function demoApiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const state = readState();
  const method = (options.method || 'GET').toUpperCase();
  const input = body(options);
  const path = endpoint.split('?')[0];
  const segments = path.split('/').filter(Boolean);

  if (path.startsWith('/auth/')) return { access_token: 'sabd-demo-token', user: { id: 'demo_user', name: input.name || 'Demo Creator', email: input.email || 'demo@sabd.studio' } };
  if (path === '/users/me') return { id: 'demo_user', name: 'Demo Creator', email: 'demo@sabd.studio' };
  if (path === '/workspaces' && method === 'GET') return [{ id: 'workspace_demo', name: 'Sabd Studio Workspace', role: 'owner' }];
  if (path === '/workspaces' && method === 'POST') return { id: uid('workspace'), name: input.name, role: 'owner' };
  if (path.includes('/members') && method === 'GET') return [{ id: 'demo_user', name: 'Demo Creator', email: 'demo@sabd.studio', role: 'owner' }];
  if (path.includes('/members') && method === 'POST') return { id: uid('member'), email: input.email, role: input.role || 'editor', status: 'invited' };
  if (path === '/brand-profile' && method === 'GET') return state.brand;
  if (path === '/brand-profile' && method === 'PUT') { state.brand = { ...state.brand, ...input }; saveState(state); return state.brand; }

  if (path === '/campaigns' && method === 'GET') return state.campaigns;
  if (path === '/campaigns' && method === 'POST') {
    const id = uid('campaign');
    const name = input.name || input.title || 'Untitled Campaign';
    const platforms = input.platforms?.length ? input.platforms : ['youtube', 'instagram', 'linkedin', 'twitter', 'blog', 'shorts'];
    const generated = platforms.map((platform: string, index: number) => createAsset(`${id}_asset_${index + 1}`, id, name, platform));
    const campaign = { id, name, title: name, status: 'completed', input_type: input.input_type || 'topic', assets_count: generated.length, created_at: now(), updated_at: now() };
    state.campaigns.unshift(campaign); state.assets.unshift(...generated); saveState(state); return campaign;
  }
  if (segments[0] === 'campaigns' && segments.length === 2 && method === 'GET') {
    const campaign = state.campaigns.find((item) => item.id === segments[1]);
    return campaign ? { ...campaign, assets: state.assets.filter((asset) => asset.campaign === campaign.id), transcript: { original_text: 'Demo source transcript.', edited_text: 'Demo source transcript.' } } : null;
  }
  if (segments[0] === 'campaigns' && segments.length === 2 && method === 'DELETE') {
    state.campaigns = state.campaigns.filter((item) => item.id !== segments[1]);
    state.assets = state.assets.filter((item) => item.campaign !== segments[1]); saveState(state); return { deleted: true };
  }
  if (segments[0] === 'campaigns' && segments[2] === 'process') return { status: 'completed' };
  if (segments[0] === 'campaigns' && segments[2] === 'status') return { status: 'completed', progress: 100 };
  if (segments[0] === 'campaigns' && segments[2] === 'transcript') return method === 'PUT' ? input : { original_text: 'Demo source transcript.', edited_text: 'Demo source transcript.' };

  if (path === '/assets' || path === '/assets/') {
    const platform = new URLSearchParams(endpoint.split('?')[1] || '').get('platform');
    return platform ? state.assets.filter((asset) => asset.platform === platform) : state.assets;
  }
  if (segments[0] === 'assets' && segments.length === 2) {
    const asset = state.assets.find((item) => item.id === segments[1]);
    if (!asset) return null;
    if (method === 'PUT') { Object.assign(asset, input, { current_version: asset.current_version + 1, updated_at: now() }); asset.versions.push({ id: uid('version'), version_number: asset.current_version, content: asset.content, created_at: now() }); saveState(state); }
    return asset;
  }
  if (segments[0] === 'assets' && segments[2] === 'approve') { const asset = state.assets.find((item) => item.id === segments[1]); if (asset) asset.status = input.status; saveState(state); return asset; }
  if (segments[0] === 'assets' && segments[2] === 'regenerate') { const asset = state.assets.find((item) => item.id === segments[1]); if (asset) { asset.content += '\n\nRefined variation: lead with the outcome, then support it with a concrete example.'; asset.current_version += 1; } saveState(state); return asset; }
  if (segments[0] === 'assets' && segments[2] === 'versions') return state.assets.find((item) => item.id === segments[1])?.versions || [];

  if (path === '/seo/analyse') {
    const score = Math.min(96, 58 + Math.floor(((input.title?.length || 0) + (input.content?.length || 0)) / 20));
    return { overall_score: score, checks: [{ rule: 'title_length', status: input.title?.length >= 25 ? 'pass' : 'warning', score: input.title?.length >= 25 ? 20 : 10, max_score: 20, message: 'Use a clear 25–60 character title.' }, { rule: 'content_depth', status: input.content?.length >= 120 ? 'pass' : 'warning', score: input.content?.length >= 120 ? 20 : 10, max_score: 20, message: 'Add practical detail for stronger search value.' }], recommendations: ['Place the primary keyword in the title.', 'Add a specific benefit in the opening paragraph.'] };
  }
  if (path === '/thumbnails/generate') return { id: uid('thumbnail'), title: input.title, image_url: `https://placehold.co/1280x720/1a73e8/ffffff?text=${encodeURIComponent(input.title || 'Sabd Studio')}`, prompt: input.prompt, status: 'generated' };

  if (path === '/schedules' && method === 'GET') return state.schedules;
  if (path === '/schedules' && method === 'POST') { const asset = state.assets.find((item) => item.id === input.asset_id); const schedule = { id: uid('schedule'), ...input, asset_title: asset?.title || 'Content asset', platform: asset?.platform || 'social', status: 'scheduled' }; state.schedules.unshift(schedule); saveState(state); return schedule; }
  if (segments[0] === 'schedules' && segments[2] === 'cancel') { state.schedules = state.schedules.filter((item) => item.id !== segments[1]); saveState(state); return { cancelled: true }; }
  if (segments[0] === 'schedules' && segments.length === 2 && method === 'PUT') { const item = state.schedules.find((entry) => entry.id === segments[1]); Object.assign(item || {}, input); saveState(state); return item; }

  if (path === '/integrations') return state.integrations;
  if (segments[0] === 'integrations' && segments[2] === 'connect') { const item = state.integrations.find((entry) => entry.provider === segments[1]); if (item) item.status = 'connected'; saveState(state); return item; }
  if (segments[0] === 'integrations' && segments[2] === 'disconnect') { const item = state.integrations.find((entry) => entry.id === segments[1]); if (item) item.status = 'disconnected'; saveState(state); return item; }

  if (path === '/analytics/overview') return { summary: { total_views: 128400, total_impressions: 346700, total_likes: 8420, total_shares: 2160, avg_engagement_rate: 4.8 }, chart_data: Array.from({ length: 14 }, (_, i) => ({ date: `Day ${i + 1}`, views: 4200 + i * 380 + (i % 3) * 700 })), platform_comparison: [{ platform: 'YouTube', views: 48200 }, { platform: 'Instagram', views: 35600 }, { platform: 'LinkedIn', views: 24800 }, { platform: 'X', views: 19800 }] };
  if (path === '/recommendations') return [{ id: 'rec_1', category: 'SEO', title: 'Lead with searchable outcomes', description: 'Benefit-led titles are easier for viewers and search engines to understand.', action: 'Rewrite the next three titles with the outcome in the first 45 characters.', supporting_metric: '+18% discovery' }, { id: 'rec_2', category: 'Publishing', title: 'Reuse your strongest opening', description: 'Your highest-performing posts introduce the problem in the first sentence.', action: 'Use the top opening as a template for this week’s campaign.', supporting_metric: '+11% retention' }];
  if (path === '/notifications') return [];
  if (path === '/audit-logs') return [{ id: 'log_1', action: 'campaign.created', actor_email: 'demo@sabd.studio', created_at: now(), details: { source: 'demo mode' } }];
  return {};
}

export function demoExport(campaignId: string) {
  const state = readState();
  const campaign = state.campaigns.find((item) => item.id === campaignId);
  const assets = state.assets.filter((item) => item.campaign === campaignId);
  const text = [`# ${campaign?.name || 'Sabd Studio Campaign'}`, '', ...assets.flatMap((asset) => [`## ${asset.platform}: ${asset.title}`, asset.content, ''])].join('\n');
  return new Blob([text], { type: 'text/markdown' });
}
