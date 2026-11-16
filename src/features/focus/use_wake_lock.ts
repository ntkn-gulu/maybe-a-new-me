import { useEffect } from 'react';

// Keeps the screen on while `is_active` (strict mode needs the app visible).
// iOS drops the lock whenever the app is hidden, so it is requested again
// each time the page becomes visible.

export function useWakeLock(is_active: boolean): void
{
    useEffect(() =>
    {
        if (!is_active || !('wakeLock' in navigator))
        {
            return;
        }

        let sentinel: WakeLockSentinel | null = null;
        let is_cancelled = false;

        async function acquire(): Promise<void>
        {
            if (document.visibilityState !== 'visible' || (sentinel && !sentinel.released))
            {
                return;
            }
            try
            {
                const lock = await navigator.wakeLock.request('screen');
                if (is_cancelled)
                {
                    void lock.release();
                    return;
                }
                sentinel = lock;
            }
            catch
            {
                // Low battery mode or no permission: the session still works, the screen may dim
            }
        }

        function handleVisibility(): void
        {
            if (document.visibilityState === 'visible')
            {
                void acquire();
            }
        }

        void acquire();
        document.addEventListener('visibilitychange', handleVisibility);

        return () =>
        {
            is_cancelled = true;
            document.removeEventListener('visibilitychange', handleVisibility);
            if (sentinel && !sentinel.released)
            {
                void sentinel.release();
            }
        };
    }, [is_active]);
}
