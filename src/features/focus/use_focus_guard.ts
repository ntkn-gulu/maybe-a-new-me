import { useEffect } from 'react';
import { useFocusStore } from '../../stores/focus_store';

// While a session runs: tick once a second and report when the app is
// hidden or shown again. The rules themselves live in core/session_rules.

const TICK_INTERVAL_MS = 1000;

export function useFocusGuard(): void
{
    const is_running = useFocusStore((state) => state.session?.status === 'running');

    useEffect(() =>
    {
        if (!is_running)
        {
            return;
        }
        const { tick, appHidden, appVisible } = useFocusStore.getState();

        function handleVisibility(): void
        {
            if (document.visibilityState === 'hidden')
            {
                appHidden();
            }
            else
            {
                appVisible();
            }
        }

        // pagehide covers iOS cases where visibilitychange is skipped (app swiped away)
        function handlePageHide(): void
        {
            appHidden();
        }

        const interval_id = window.setInterval(tick, TICK_INTERVAL_MS);
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('pagehide', handlePageHide);
        tick();

        return () =>
        {
            window.clearInterval(interval_id);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [is_running]);
}
