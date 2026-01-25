'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockEvent, mockMemberships, mockTeethBalances } from '@/lib/mock/data';
import { mockUsers } from '@/lib/mock/users';
import { formatDate, formatTeeth } from '@/lib/utils';
import { isMockMode } from '@/lib/env/public';

export default function EventPage({
  params,
}: {
  params: { eventId: string };
}) {
  // In mock mode, use demo data
  const event = isMockMode ? mockEvent : null;
  const memberships = isMockMode ? mockMemberships : [];

  if (!event) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Event Header */}
      <div>
        <h1 className="text-3xl font-bold">{event.name}</h1>
        <p className="text-muted-foreground">{formatDate(event.date)}</p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              event.visibility === 'PUBLIC'
                ? 'bg-green-100 text-green-800'
                : event.visibility === 'UNLISTED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {event.visibility}
          </span>
          {event.isLocked && (
            <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">
              Locked
            </span>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{memberships.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {event.isLocked ? 'Complete' : 'In Progress'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Teeth in Play
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatTeeth(
                mockTeethBalances.reduce((sum, b) => sum + b.balanceInt, 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {memberships
              .filter((m) => m.role === 'PLAYER' || m.role === 'OWNER' || m.role === 'ADMIN')
              .map((m, index) => {
                const user = mockUsers.find((u) => u.id === m.userId);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-md bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <span>{user?.name ?? 'Unknown'}</span>
                    </div>
                    <span className="font-mono">Thru 9</span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {memberships.map((m) => {
              const user = mockUsers.find((u) => u.id === m.userId);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span>{user?.name ?? 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">{m.role}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
