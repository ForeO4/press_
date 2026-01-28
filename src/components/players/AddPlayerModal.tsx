'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { User, Mail, Phone, Hash } from 'lucide-react';
import type { CreatePlayerInput } from '@/types';

interface AddPlayerModalProps {
  onSubmit: (input: CreatePlayerInput) => Promise<void>;
  onClose: () => void;
}

export function AddPlayerModal({ onSubmit, onClose }: AddPlayerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ghinNumber, setGhinNumber] = useState('');
  const [handicapIndex, setHandicapIndex] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validate required fields
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate handicap index if provided
    const handicapValue = handicapIndex ? parseFloat(handicapIndex) : undefined;
    if (handicapValue !== undefined) {
      if (isNaN(handicapValue) || handicapValue < 0 || handicapValue > 54) {
        setError('Handicap index must be between 0 and 54');
        return;
      }
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        ghinNumber: ghinNumber.trim() || undefined,
        handicapIndex: handicapValue,
      });
    } catch (err) {
      setError('Failed to add player. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md mx-4 border-border/50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/90"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Player
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name - Required */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Email - Optional */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
              <span className="text-xs text-muted-foreground">(for account linking)</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Phone - Optional */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Handicap Section */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Handicap Information</h3>

            {/* GHIN Number - Optional */}
            <div className="space-y-2">
              <label htmlFor="ghin" className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                GHIN Number
              </label>
              <Input
                id="ghin"
                type="text"
                placeholder="1234567"
                value={ghinNumber}
                onChange={(e) => setGhinNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                For future GHIN API integration. Enter now to be ready when auto-lookup is available.
              </p>
            </div>

            {/* Handicap Index - Optional */}
            <div className="space-y-2 mt-4">
              <label htmlFor="handicap" className="text-sm font-medium flex items-center gap-2">
                Handicap Index
                <span className="text-xs text-muted-foreground">(0-54)</span>
              </label>
              <Input
                id="handicap"
                type="number"
                step="0.1"
                min="0"
                max="54"
                placeholder="12.5"
                value={handicapIndex}
                onChange={(e) => setHandicapIndex(e.target.value)}
              />
              {handicapIndex && !isNaN(parseFloat(handicapIndex)) && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                  <span className="font-medium">Course Handicap Preview:</span>
                  <br />
                  • Standard (113 slope): {Math.round(parseFloat(handicapIndex) * (113 / 113))}
                  <br />
                  • Difficult (131 slope): {Math.round(parseFloat(handicapIndex) * (131 / 113))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Player'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
