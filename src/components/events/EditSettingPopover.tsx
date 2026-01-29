'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Check } from 'lucide-react';
import type { GameType } from '@/types';

type SettingType = 'date' | 'dateRange' | 'number' | 'select' | 'gameType';

interface EditSettingPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: unknown) => Promise<void>;
  type: SettingType;
  label: string;
  currentValue: unknown;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

const GAME_TYPE_OPTIONS = [
  { value: 'match_play', label: 'Match Play' },
  { value: 'nassau', label: 'Nassau' },
  { value: 'skins', label: 'Skins' },
];

const HOLES_OPTIONS = [
  { value: '9', label: '9 Holes' },
  { value: '18', label: '18 Holes' },
];

export function EditSettingPopover({
  isOpen,
  onClose,
  onSave,
  type,
  label,
  currentValue,
  options,
  min = 1,
  max = 10,
}: EditSettingPopoverProps) {
  const [value, setValue] = useState<string>(String(currentValue || ''));
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let parsedValue: unknown = value;

      if (type === 'number') {
        parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue as number)) {
          parsedValue = currentValue;
        }
      }

      await onSave(parsedValue);
      onClose();
    } catch (error) {
      console.error('Failed to save setting:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const renderInput = () => {
    switch (type) {
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
            autoFocus
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            className="w-full"
            autoFocus
          />
        );

      case 'select':
      case 'gameType':
        const selectOptions = type === 'gameType' ? GAME_TYPE_OPTIONS : options || [];
        return (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          >
            {selectOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
            autoFocus
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Edit {label}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {renderInput()}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Named exports for common edit dialogs
export function EditDatePopover(props: Omit<EditSettingPopoverProps, 'type'>) {
  return <EditSettingPopover {...props} type="date" />;
}

export function EditNumberPopover(props: Omit<EditSettingPopoverProps, 'type'>) {
  return <EditSettingPopover {...props} type="number" />;
}

export function EditGameTypePopover(props: Omit<EditSettingPopoverProps, 'type' | 'options'>) {
  return <EditSettingPopover {...props} type="gameType" />;
}
