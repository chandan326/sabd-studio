'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Users, UserPlus, Shield, Trash2, CheckCircle2 } from 'lucide-react';

export default function TeamManagementPage() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Editor');

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.getWorkspaces(),
  });

  const activeWs = workspaces[0];

  const { data: members = [], refetch } = useQuery({
    queryKey: ['workspace-members', activeWs?.id],
    queryFn: () => (activeWs ? api.getWorkspaceMembers(activeWs.id) : []),
    enabled: !!activeWs,
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWs || !inviteEmail) return;

    try {
      await api.inviteMember(activeWs.id, { email: inviteEmail, role: inviteRole });
      alert(`Invited ${inviteEmail} as ${inviteRole}!`);
      setInviteEmail('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Invitation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold">Team & Workspace Management</h1>
        <p className="text-xs text-muted-foreground">Manage workspace roles (Owner, Admin, Editor, Viewer) and invite team members.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Active Team Members
            </h3>

            <div className="divide-y divide-border">
              {members.map((m: any) => (
                <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold text-xs block">{m.full_name || m.email}</span>
                    <span className="text-[11px] text-muted-foreground">{m.email}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-secondary border border-border px-2.5 py-0.5 rounded font-mono font-semibold text-primary">
                      {m.role}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Invite Member Form */}
        <div>
          <form onSubmit={handleInvite} className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" /> Invite New Member
            </h3>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="colleague@company.com"
                className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Assigned Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Admin">Admin (Full Control)</option>
                <option value="Editor">Editor (Create & Edit)</option>
                <option value="Viewer">Viewer (Read-Only)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-primary/25"
            >
              Send Workspace Invite
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
