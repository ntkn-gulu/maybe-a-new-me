import { useEffect, type RefObject } from 'react';

// iPhone Safari (WebKit) can keep the old scrollable size of a scroll area
// whose content changed while parts of it were moving with transforms (cards
// flying in, a sheet sliding up). The page then refuses to scroll until
// something forces a new layout, like opening and closing a modal.
// This hook re-arms scrolling once the animations have settled: whenever
// `refresh_key` changes or the content's size changes, it switches the
// nearest scroll area's overflow off and back on (a full relayout, the
// scroll position is kept).
// Scroll areas mark themselves with the SCROLL_AREA_ATTRIBUTE attribute.

export const SCROLL_AREA_ATTRIBUTE = 'data-scroll-area';

const SETTLE_MS = 900;                // after the slowest card stagger + spring

function refreshScrollArea(scroll_area: HTMLElement): void
{
    scroll_area.style.overflowY = 'hidden';
    void scroll_area.offsetHeight;    // reading layout forces it to happen now
    scroll_area.style.overflowY = '';
}

export function useScrollRefresh(anchor_ref: RefObject<HTMLElement>, refresh_key: unknown): void
{
    useEffect(() =>
    {
        const anchor = anchor_ref.current;
        const scroll_area = anchor?.closest<HTMLElement>(`[${SCROLL_AREA_ATTRIBUTE}]`);
        if (!anchor || !scroll_area)
        {
            return;
        }
        const area: HTMLElement = scroll_area;

        let timer = 0;
        function scheduleRefresh(): void
        {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => refreshScrollArea(area), SETTLE_MS);
        }

        // Fires once right away (covers this key change) and on every later size change
        const observer = new ResizeObserver(scheduleRefresh);
        observer.observe(anchor);
        return () =>
        {
            observer.disconnect();
            window.clearTimeout(timer);
        };
    }, [anchor_ref, refresh_key]);
}
