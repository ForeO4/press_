'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createShareLink,
  getEventShareLinks,
  deleteShareLink,
  isLinkValid,
  type ShareLink,
} from '@/lib/services/invites';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { appUrl } from '@/lib/env/public';

interface InviteModalProps {
  eventId: string;
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ eventId, eventName, isOpen, onClose }: InviteModalProps) {
  const user = useCurrentUser();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing links
  useEffect(() => {
    if (isOpen && eventId) {
      loadLinks();
    }
  }, [isOpen, eventId]);

  const loadLinks = async () => {
    setIsLoading(true);
    try {
      const data = await getEventShareLinks(eventId);
      setLinks(data);
    } catch (err) {
      setError('Failed to load invite links');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!user?.id) return;

    setIsCreating(true);
    setError(null);
    try {
      const link = await createShareLink(eventId, user.id, 7); // 7 days expiry
      setLinks([link, ...links]);
    } catch (err) {
      setError('Failed to create invite link');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteShareLink(linkId);
      setLinks(links.filter((l) => l.id !== linkId));
    } catch (err) {
      setError('Failed to delete link');
      console.error(err);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getInviteUrl = (link: ShareLink) => {
    return `${appUrl}/invite/${link.token}`;
  };

  if (!isOpen) return null;

  const activeLinks = links.filter(isLinkValid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-card-foreground">
            Invite Players
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Share an invite link or code to let players join <strong>{eventName}</strong>.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Create new link */}
        <Button
          onClick={handleCreateLink}
          disabled={isCreating}
          className="w-full mb-6"
        >
          {isCreating ? 'Creating...' : 'Create New Invite Link'}
        </Button>

        {/* Existing links */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">Loading...</p>
        ) : activeLinks.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No active invite links. Create one above.
          </p>
        ) : (
          <div className="space-y-4">
            {activeLinks.map((link) => (
              <div
                key={link.id}
                className="rounded-lg border p-4 space-y-3"
              >
                {/* Link URL */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Invite Link
                  </label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={getInviteUrl(link)}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(getInviteUrl(link), `link-${link.id}`)}
                    >
                      {copiedId === `link-${link.id}` ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Code */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Event Code
                  </label>
                  <div className="flex gap-2 mt-1 items-center">
                    <span className="font-mono text-2xl font-bold tracking-wider text-foreground">
                      {link.code}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(link.code, `code-${link.id}`)}
                    >
                      {copiedId === `code-${link.id}` ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Players can enter this code at {appUrl}/join
                  </p>
                </div>

                {/* Expiry and delete */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    {link.expiresAt
                      ? `Expires ${new Date(link.expiresAt).toLocaleDateString()}`
                      : 'Never expires'}
                  </span>
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Close button */}
        <div className="mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
