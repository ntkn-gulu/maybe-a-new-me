// "mm:ss" from a number of seconds (rounded up, so 0.2 s left still shows 00:01)
export function formatClock(total_seconds: number): string
{
    const seconds = Math.max(0, Math.ceil(total_seconds));
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
