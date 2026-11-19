// Music files for the music engine. A track is fetched whole, so the
// service worker keeps it and it plays offline next time (a streamed range
// request could not be kept), then played from a blob URL; the last few
// downloads stay in memory. Also a tiny silent WAV, played inside a tap to
// unlock the <audio> decks on iOS.

const KEPT_TRACKS = 3;              // downloaded tracks kept in memory as blobs

let silence_url: string | null = null;
const blob_urls = new Map<string, string>();                    // track url -> blob url, oldest first

export function isSilence(src: string): boolean
{
    return src === silence_url;
}

// A tenth of a second of silence as a tiny WAV file, for unlocking the decks
export function getSilenceUrl(): string
{
    if (!silence_url)
    {
        const samples = 800;                                    // 0.1 s at 8 kHz, 8-bit mono
        const view = new DataView(new ArrayBuffer(44 + samples));
        const text = (offset: number, value: string): void => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
        text(0, 'RIFF');
        view.setUint32(4, 36 + samples, true);
        text(8, 'WAVEfmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);                            // PCM
        view.setUint16(22, 1, true);                            // mono
        view.setUint32(24, 8000, true);
        view.setUint32(28, 8000, true);
        view.setUint16(32, 1, true);
        view.setUint16(34, 8, true);
        text(36, 'data');
        view.setUint32(40, samples, true);
        for (let i = 0; i < samples; i++)
        {
            view.setUint8(44 + i, 128);                         // 8-bit silence is the middle value
        }
        silence_url = URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }));
    }
    return silence_url;
}

// `is_in_use(track url)` keeps a download that a deck still plays
export async function getTrackBlobUrl(url: string, is_in_use: (track_url: string) => boolean): Promise<string>
{
    const kept = blob_urls.get(url);
    if (kept)
    {
        return kept;
    }
    const response = await fetch(url);
    if (!response.ok)
    {
        throw new Error(`music ${url}: ${response.status}`);
    }
    const blob_url = URL.createObjectURL(await response.blob());
    blob_urls.set(url, blob_url);
    // Forget the oldest downloads that no deck is using
    for (const [old_url, old_blob] of blob_urls)
    {
        if (blob_urls.size <= KEPT_TRACKS)
        {
            break;
        }
        if (!is_in_use(old_url))
        {
            URL.revokeObjectURL(old_blob);
            blob_urls.delete(old_url);
        }
    }
    return blob_url;
}
