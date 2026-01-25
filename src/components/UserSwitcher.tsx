'use client';

import { useAppStore } from '@/stores';
import { mockUsers } from '@/lib/mock/users';
import { isMockMode } from '@/lib/env/public';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * User switcher for mock mode development
 * Only visible when running without backend
 */
export function UserSwitcher() {
  const { mockUser, setMockUser } = useAppStore();

  // Only show in mock mode
  if (!isMockMode) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-amber-50 p-2">
      <span className="text-xs font-medium text-amber-800">Mock User:</span>
      <div className="flex gap-1">
        {mockUsers.map((user) => (
          <Button
            key={user.id}
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 text-xs',
              mockUser?.id === user.id && 'bg-amber-200'
            )}
            onClick={() => setMockUser(user)}
          >
            {user.name.split(' ')[0]}
            <span className="ml-1 text-[10px] text-muted-foreground">
              ({user.role})
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
