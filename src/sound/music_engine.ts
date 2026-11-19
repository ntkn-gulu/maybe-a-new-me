import { getContext, onContextChanged, setBackgroundPlaybackActive } from './audio_context';
import { getSilenceUrl, getTrackBlobUrl, isSilence } from './music_files';

// Plays the music channel. Tracks play in <audio> elements, but their
// sound goes through Web Audio: iOS ignores an <audio> element's own
// volume, so fades and the music volume are gain nodes. Two decks take
// turns, so the next track crossfades in while the last one fades out.
// A track is fetched whole and played from a blob URL (music_files.ts).
// Inside the tap that starts playback both decks
// play a moment of silence: iOS then lets them start later on their own
// (after a download, or for the crossfade into the next track).
// The store hands over the wanted state; the engine moves there.

export interface MusicTarget
{
    url: string | null;             // the track to play (null: music off)
    is_playing: boolean;
    volume: number;                 // 0..1
    crossfade_seconds: number;      // how long a change of track blends (long when a track ends, short on a skip)
}

interface Deck
{
    element: HTMLAudioElement;
    gain: GainNode;
    url: string | null;             // the track this deck plays (or is loading)
    load_token: number;             // a newer load wins over an older one still downloading
    is_unlocked: boolean;
}

// The next track starts this long before the current one ends (with the crossfade)
export const MUSIC_TRACK_OVERLAP_SECONDS = 4;
const FADE_SECONDS = 0.6;

let target: MusicTarget = { url: null, is_playing: false, volume: 0.7, crossfade_seconds: 0 };
let decks: Deck[] = [];
let deck_context: AudioContext | null = null;
let bus: GainNode | null = null;
let active_deck = 0;
let ending_listener: (() => void) | null = null;
let has_called_ending = false;
let resume_at: { url: string; time: number } | null = null;     // where to pick up after a context rebuild

// Called once the playing track is about to end (the store moves to the next one)
export function onMusicTrackEnding(listener: () => void): void
{
    ending_listener = listener;
}

function toGain(level: number): number
{
    return level * level;
}

function glide(param: AudioParam, value: number, seconds: number): void
{
    const now = (deck_context as AudioContext).currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + Math.max(0.01, seconds));
}

function watchEnding(deck: Deck): void
{
    const callEnding = (): void =>
    {
        if (decks[active_deck] === deck && !has_called_ending)
        {
            has_called_ending = true;
            ending_listener?.();
        }
    };
    deck.element.addEventListener('timeupdate', () =>
    {
        const left = deck.element.duration - deck.element.currentTime;
        if (Number.isFinite(left) && left < MUSIC_TRACK_OVERLAP_SECONDS && deck.element.currentTime > 0)
        {
            callEnding();
        }
    });
    deck.element.addEventListener('ended', callEnding);       // a very short track still moves the queue on
}

// Media element sources belong to one context for good: a new context needs new decks
function getDecks(context: AudioContext): Deck[]
{
    if (deck_context !== context || decks.length === 0)
    {
        decks.forEach((deck) => deck.element.pause());
        bus = context.createGain();
        bus.gain.value = toGain(target.volume);
        bus.connect(context.destination);
        decks = [0, 1].map(() =>
        {
            const element = new Audio();
            const gain = context.createGain();
            gain.gain.value = 0;
            context.createMediaElementSource(element).connect(gain).connect(bus as GainNode);
            const deck: Deck = { element, gain, url: null, load_token: 0, is_unlocked: false };
            watchEnding(deck);
            return deck;
        });
        deck_context = context;
        active_deck = 0;
    }
    return decks;
}

// Must run inside the tap: a deck that has played once may play later without one
function unlockDecks(): void
{
    for (const deck of decks)
    {
        if (deck.is_unlocked || deck.url !== null)
        {
            continue;
        }
        deck.is_unlocked = true;
        deck.element.src = getSilenceUrl();
        const element = deck.element;
        void element.play()
            .then(() =>
            {
                if (isSilence(element.src))
                {
                    element.pause();                    // a real track may already have taken over
                }
            })
            .catch(() => undefined);
    }
}

// Download a track into a deck, then play it in with a fade
function startDeck(deck: Deck, url: string, fade_seconds: number, from_time: number): void
{
    deck.url = url;
    const token = ++deck.load_token;
    has_called_ending = false;
    void getTrackBlobUrl(url, (track_url) => decks.some((deck) => deck.url === track_url))
        .then((blob_url) =>
        {
            if (deck.load_token !== token || deck.url !== url)
            {
                return;
            }
            const element = deck.element;
            element.src = blob_url;
            if (from_time > 0)
            {
                element.addEventListener('loadedmetadata', () => { element.currentTime = from_time; }, { once: true });
            }
            deck.gain.gain.value = 0;
            const should_play = target.is_playing && target.url === url && decks[active_deck] === deck;
            if (should_play)
            {
                void element.play().catch(() => undefined);
                glide(deck.gain.gain, 1, fade_seconds);
            }
        })
        .catch(() => undefined);
}

function fadeOutAndPause(deck: Deck, seconds: number): void
{
    glide(deck.gain.gain, 0, seconds);
    window.setTimeout(() =>
    {
        // Unless this deck was asked to play again meanwhile
        const should_play = target.is_playing && target.url !== null && decks[active_deck] === deck;
        if (!should_play)
        {
            deck.element.pause();
        }
    }, seconds * 1000 + 50);
}

function reconcile(): void
{
    if (!target.url || !target.is_playing)
    {
        if (deck_context)
        {
            decks.forEach((deck) => fadeOutAndPause(deck, FADE_SECONDS));
        }
        setBackgroundPlaybackActive('music', false);
        return;
    }
    setBackgroundPlaybackActive('music', true);
    const context = getContext();
    getDecks(context);
    unlockDecks();
    glide((bus as GainNode).gain, toGain(target.volume), 0.12);
    const current = decks[active_deck];
    const other = decks[1 - active_deck];
    if (current.url === target.url)
    {
        // Same track: resume it (if it is still downloading, it starts when ready)
        if (current.element.src.startsWith('blob:') && !isSilence(current.element.src))
        {
            void current.element.play().catch(() => undefined);
            glide(current.gain.gain, 1, FADE_SECONDS);
        }
        return;
    }
    if (current.url === null)
    {
        const from_time = resume_at?.url === target.url ? resume_at.time : 0;
        resume_at = null;
        startDeck(current, target.url, FADE_SECONDS, from_time);
        return;
    }
    // A new track: the other deck takes it and the two cross over
    active_deck = 1 - active_deck;
    startDeck(other, target.url, target.crossfade_seconds, 0);
    fadeOutAndPause(current, target.crossfade_seconds);
}

// Where the playing track is (seconds), for a progress bar; null before a track has loaded
export function getMusicPosition(): { time: number; duration: number } | null
{
    const deck = decks[active_deck];
    const duration = deck?.element.duration ?? NaN;
    if (!deck?.url || !Number.isFinite(duration) || duration <= 0)
    {
        return null;
    }
    return { time: deck.element.currentTime, duration };
}

// Jump within the playing track (a tap on the progress bar)
export function seekMusic(seconds: number): void
{
    const deck = decks[active_deck];
    if (!deck?.url || !Number.isFinite(deck.element.duration))
    {
        return;
    }
    deck.element.currentTime = Math.min(Math.max(0, seconds), deck.element.duration - 0.5);
    has_called_ending = false;
}

export function setMusicTarget(next: MusicTarget): void
{
    const is_same_track = next.url === target.url && next.is_playing === target.is_playing;
    const is_volume_change = next.volume !== target.volume;
    target = next;
    if (!is_same_track)
    {
        reconcile();
    }
    else if (is_volume_change && bus)
    {
        glide(bus.gain, toGain(next.volume), 0.12);       // only the volume: leave any crossfade alone
    }
}

// iOS replaced or released the context: the decks are tied to the old one.
// Remember where the music was, so new decks pick up from there.
onContextChanged(() =>
{
    const deck = decks[active_deck];
    if (deck?.url)
    {
        resume_at = { url: deck.url, time: deck.element.currentTime };
    }
    decks.forEach((old) => old.element.pause());
    decks = [];
    deck_context = null;
    bus = null;
    if (target.is_playing && target.url && document.visibilityState === 'visible')
    {
        reconcile();
    }
});
