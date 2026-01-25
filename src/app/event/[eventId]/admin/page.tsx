'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockEvent, mockEventSettings } from '@/lib/mock/data';
import { useAppStore } from '@/stores';
import { isMockMode } from '@/lib/env/public';

export default function AdminPage({
  params,
}: {
  params: { eventId: string };
}) {
  const mockUser = useAppStore((state) => state.mockUser);

  // In mock mode, use demo data
  const event = isMockMode ? mockEvent : null;
  const settings = isMockMode ? mockEventSettings : null;

  // Only admin/owner can access this page
  const isAdmin = mockUser?.role === 'OWNER' || mockUser?.role === 'ADMIN';

  const [isLocked, setIsLocked] = useState(event?.isLocked ?? false);
  const [allowSelfPress, setAllowSelfPress] = useState(
    settings?.allowSelfPress ?? true
  );

  if (!isAdmin) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  const handleToggleLock = () => {
    setIsLocked(!isLocked);
    alert(`Event ${!isLocked ? 'locked' : 'unlocked'}. This would update the database in a real app.`);
  };

  const handleToggleSelfPress = () => {
    setAllowSelfPress(!allowSelfPress);
    alert(`Self-press ${!allowSelfPress ? 'enabled' : 'disabled'}. This would update settings in a real app.`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Settings</h1>

      {/* Event Lock */}
      <Card>
        <CardHeader>
          <CardTitle>Event Lock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Event is {isLocked ? 'Locked' : 'Unlocked'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isLocked
                  ? 'Scores cannot be changed. Unlock to allow edits.'
                  : 'Scores can be changed. Lock when event is complete.'}
              </p>
            </div>
            <Button
              variant={isLocked ? 'destructive' : 'default'}
              onClick={handleToggleLock}
            >
              {isLocked ? 'Unlock Event' : 'Lock Event'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Press Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Press Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Self-Press: {allowSelfPress ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-sm text-muted-foreground">
                {allowSelfPress
                  ? 'Players can create their own presses'
                  : 'Only admins can create presses'}
              </p>
            </div>
            <Button variant="outline" onClick={handleToggleSelfPress}>
              {allowSelfPress ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Default Teeth */}
      <Card>
        <CardHeader>
          <CardTitle>Starting Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            New members start with {settings?.defaultTeeth ?? 100} Alligator
            Teeth
          </p>
        </CardContent>
      </Card>

      {/* Member Management */}
      <Card>
        <CardHeader>
          <CardTitle>Member Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Member management features coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
