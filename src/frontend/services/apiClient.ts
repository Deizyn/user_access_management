/**
 * Frontend HTTP API Client for communicating with Backend Server API routes (/api/*)
 */

export interface SystemHealthResponse {
  status: string;
  service: string;
  engine: string;
  timestamp: string;
}

export interface SystemStatsResponse {
  totalUsers: number;
  activeVpn: number;
  levelAUsers: number;
  totalGroups: number;
  sqliteStatus: string;
  timestamp: string;
}

export const apiClient = {
  async checkHealth(): Promise<SystemHealthResponse> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Backend server unresponsive');
    return res.json();
  },

  async getStats(): Promise<SystemStatsResponse> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getSchemaSpec() {
    const res = await fetch('/api/sqlite/schema');
    if (!res.ok) throw new Error('Failed to fetch SQLite schema');
    return res.json();
  },

  async triggerSync(mode: string, configData?: any) {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, ...configData }),
    });
    if (!res.ok) throw new Error('Failed to execute sync pipeline');
    return res.json();
  },
};
