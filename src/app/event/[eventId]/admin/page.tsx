'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockEvent } from '@/lib/mock/data';
import { useAppStore } from '@/stores';
import { isMockMode } from '@/lib/env/public';
import {
  getSettings,
  setAutoPressEnabled,
  setAutoPressThreshold,
  setMaxPresses,
  setAllowSelfPress,
} from '@/lib/services/eventSettings';
import { InviteModal } from '@/components/events/InviteModal';
import type { EventSettings, AutoPressConfig } from '@/types';

export default function AdminPage({
  params,
}: {
  params: { eventId: string };
}) {
  const mockUser = useAppStore((state) => state.mockUser);

  // In mock mode, use demo data
  const event = isMockMode ? mockEvent : null;

  // Only admin/owner can access this page
  const isAdmin = mockUser?.role === 'OWNER' || mockUser?.role === 'ADMIN';

  const [isLocked, setIsLocked] = useState(event?.isLocked ?? false);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [autoPressConfig, setAutoPressConfig] = useState<AutoPressConfig | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      if (isMockMode) {
        const loaded = await getSettings(params.eventId);
        setSettings(loaded);
        setAutoPressConfig(loaded.pressRules);
      }
    };
    loadSettings();
  }, [params.eventId]);

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

  const handleToggleSelfPress = async () => {
    if (!settings) return;
    const updated = await setAllowSelfPress(params.eventId, !settings.allowSelfPress);
    setSettings(updated);
  };

  const handleToggleAutoPress = async () => {
    if (!autoPressConfig) return;
    const updated = await setAutoPressEnabled(params.eventId, !autoPressConfig.enabled);
    setSettings(updated);
    setAutoPressConfig(updated.pressRules);
  };

  const handleThresholdChange = async (value: number) => {
    if (!autoPressConfig) return;
    const updated = await setAutoPressThreshold(params.eventId, value);
    setSettings(updated);
    setAutoPressConfig(updated.pressRules);
  };

  const handleMaxPressesChange = async (value: number) => {
    if (!autoPressConfig) return;
    const updated = await setMaxPresses(params.eventId, value);
    setSettings(updated);
    setAutoPressConfig(updated.pressRules);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Settings</h1>

      {/* Invite Players */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Share invite links</p>
              <p className="text-sm text-muted-foreground">
                Create and manage invite links to let players join this event.
              </p>
            </div>
            <Button onClick={() => setIsInviteModalOpen(true)}>
              Manage Invites
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {/* Auto-Press Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Press Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable/Disable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Auto-Press: {autoPressConfig?.enabled ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-sm text-muted-foreground">
                {autoPressConfig?.enabled
                  ? 'Presses are created automatically when a player is down'
                  : 'Players must manually create presses'}
              </p>
            </div>
            <Button variant="outline" onClick={handleToggleAutoPress}>
              {autoPressConfig?.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>

          {/* Threshold setting */}
          {autoPressConfig?.enabled && (
            <>
              <div className="border-t border-border/30 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Trigger Threshold</p>
                    <p className="text-sm text-muted-foreground">
                      Auto-press when {autoPressConfig.trigger} holes down
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleThresholdChange(autoPressConfig.trigger - 1)}
                      disabled={autoPressConfig.trigger <= 1}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-bold">{autoPressConfig.trigger}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleThresholdChange(autoPressConfig.trigger + 1)}
                      disabled={autoPressConfig.trigger >= 9}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Max presses setting */}
              <div className="border-t border-border/30 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Max Presses Per Game</p>
                    <p className="text-sm text-muted-foreground">
                      Limit of {autoPressConfig.maxPresses} auto-presses per game
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMaxPressesChange(autoPressConfig.maxPresses - 1)}
                      disabled={autoPressConfig.maxPresses <= 1}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-bold">{autoPressConfig.maxPresses}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMaxPressesChange(autoPressConfig.maxPresses + 1)}
                      disabled={autoPressConfig.maxPresses >= 10}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Manual Press Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Press Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Self-Press: {settings?.allowSelfPress ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-sm text-muted-foreground">
                {settings?.allowSelfPress
                  ? 'Players can create their own presses'
                  : 'Only admins can create presses'}
              </p>
            </div>
            <Button variant="outline" onClick={handleToggleSelfPress}>
              {settings?.allowSelfPress ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Default Bucks */}
      <Card>
        <CardHeader>
          <CardTitle>Starting Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            New members start with {settings?.defaultBucks ?? 100} Gator
            Bucks
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

      {/* Invite Modal */}
      <InviteModal
        eventId={params.eventId}
        eventName={event?.name ?? 'Event'}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}
