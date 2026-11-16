import { getDayKey } from '../core/day_key';
import type { DayKey, Device } from '../core/types';

// Browser-side helpers that feed real time / device info into the pure core.

// App day for a moment, using this device's time zone at that moment
export function getDayKeyAt(epoch_ms: number): DayKey
{
    return getDayKey(epoch_ms, new Date(epoch_ms).getTimezoneOffset());
}

export function getTodayKey(): DayKey
{
    return getDayKeyAt(Date.now());
}

// Phones get the strict leave-the-app rule; desktops get extra presence checks
export function detectDevice(): Device
{
    const is_touch_first = window.matchMedia('(pointer: coarse)').matches;
    return is_touch_first ? 'phone' : 'desktop';
}

export function createId(): string
{
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
