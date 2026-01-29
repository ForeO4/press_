'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, UserMinus, ChevronDown } from 'lucide-react';
import type { MembershipRole, PlayerProfile } from '@/types';

interface MemberWithRole extends PlayerProfile {
  role: MembershipRole;
  membershipId: string;
}

interface MemberRoleEditorProps {
  member: MemberWithRole;
  currentUserRole: MembershipRole;
  onRoleChange: (membershipId: string, newRole: MembershipRole) => Promise<void>;
  onRemove: (membershipId: string) => Promise<void>;
  isCurrentUser: boolean;
}

const roleOrder: MembershipRole[] = ['OWNER', 'ADMIN', 'PLAYER', 'VIEWER'];
const roleLabels: Record<MembershipRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  PLAYER: 'Player',
  VIEWER: 'Viewer',
};

const roleColors: Record<MembershipRole, string> = {
  OWNER: 'text-amber-500 bg-amber-500/20',
  ADMIN: 'text-blue-500 bg-blue-500/20',
  PLAYER: 'text-green-500 bg-green-500/20',
  VIEWER: 'text-gray-400 bg-gray-500/20',
};

export function MemberRoleEditor({
  member,
  currentUserRole,
  onRoleChange,
  onRemove,
  isCurrentUser,
}: MemberRoleEditorProps) {
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Determine what roles the current user can assign
  const canManageRoles = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const canRemoveMember = currentUserRole === 'OWNER' ||
    (currentUserRole === 'ADMIN' && member.role !== 'OWNER' && member.role !== 'ADMIN');

  // Available roles to assign (can only assign roles lower or equal to own)
  const availableRoles = roleOrder.filter((role) => {
    if (currentUserRole === 'OWNER') return role !== 'OWNER' || member.role === 'OWNER';
    if (currentUserRole === 'ADMIN') return role === 'PLAYER' || role === 'VIEWER';
    return false;
  });

  const handleRoleChange = async (newRole: MembershipRole) => {
    if (newRole === member.role) {
      setIsRoleDropdownOpen(false);
      return;
    }

    setIsChangingRole(true);
    try {
      await onRoleChange(member.membershipId, newRole);
    } finally {
      setIsChangingRole(false);
      setIsRoleDropdownOpen(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${member.name} from this clubhouse?`)) {
      return;
    }

    setIsRemoving(true);
    try {
      await onRemove(member.membershipId);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {member.name?.charAt(0) || '?'}
        </div>
        <div>
          <p className="font-medium text-foreground">
            {member.name}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
            )}
          </p>
          {member.email && (
            <p className="text-xs text-muted-foreground">{member.email}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Role selector */}
        <div className="relative">
          <button
            onClick={() => canManageRoles && !isCurrentUser && setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            disabled={!canManageRoles || isCurrentUser || isChangingRole}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              roleColors[member.role]
            } ${
              canManageRoles && !isCurrentUser
                ? 'cursor-pointer hover:opacity-80'
                : 'cursor-default'
            }`}
          >
            <Shield className="h-3 w-3" />
            {roleLabels[member.role]}
            {canManageRoles && !isCurrentUser && (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {/* Dropdown */}
          {isRoleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsRoleDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-32 rounded-md border bg-popover shadow-lg">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    disabled={isChangingRole}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md ${
                      role === member.role ? 'bg-muted' : ''
                    }`}
                  >
                    <span className={roleColors[role].split(' ')[0]}>
                      {roleLabels[role]}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Remove button */}
        {canRemoveMember && !isCurrentUser && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={isRemoving}
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
          >
            <UserMinus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
