// The one Web Audio context of the app and its life on iOS: created inside a
// tap (iOS keeps audio locked until then), resumed or rebuilt after the app
// was in the background, and released when the app is left so iOS stops
// listing it as a media player. Everything played goes through the master
// gain (getMasterGain), whose level is the user's volume.

interface AudioSessionLike
{
    type: string;
}

const NOISE_BUFFER_SECONDS = 0.5;

// If the context is still not running this long after resume(), treat it as stuck
const RESUME_TIMEOUT_MS = 400;

let audio_context: AudioContext | null = null;
let master_gain: GainNode | null = null;
let noise_buffer: AudioBuffer | null = null;
let current_volume = 0.8;
let needs_rebuild = false;     // set when resume() failed: next tap builds a fresh context
const background_players = new Set<string>();   // who is playing (ambient, music): keep audio alive in the background
const context_listeners = new Set<() => void>();

// Safari 17+ exposes navigator.audioSession.
// "playback" lets sounds play even when the iPhone silent switch is on (needed
// for focus alarms), but it also makes iOS treat the app as a media player.
// "auto" is the default and gives that status back.
function setAudioSessionType(type: 'playback' | 'auto'): void
{
    const audio_session = (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession;
    if (audio_session && audio_session.type !== type)
    {
        audio_session.type = type;
    }
}

export function getContext(): AudioContext
{
    if (!audio_context)
    {
        setAudioSessionType('playback');
        audio_context = new AudioContext();
        master_gain = audio_context.createGain();
        master_gain.gain.value = current_volume;
        master_gain.connect(audio_context.destination);
    }
    return audio_context;
}

// Half a second of white noise, made once per context (noise-based sounds reuse it)
export function getNoiseBuffer(context: AudioContext): AudioBuffer
{
    if (!noise_buffer)
    {
        const frame_count = Math.floor(context.sampleRate * NOISE_BUFFER_SECONDS);
        noise_buffer = context.createBuffer(1, frame_count, context.sampleRate);
        const samples = noise_buffer.getChannelData(0);
        for (let i = 0; i < frame_count; i++)
        {
            samples[i] = Math.random() * 2 - 1;
        }
    }
    return noise_buffer;
}

// Throw away the current context and start a new one. Must run inside a
// user tap so iOS lets the new context start in the "running" state.
function rebuildContext(): void
{
    if (audio_context && audio_context.state !== 'closed')
    {
        void audio_context.close();
    }
    audio_context = null;
    master_gain = null;
    noise_buffer = null;
    needs_rebuild = false;
    getContext();
    notifyContextChanged();
}

// Long-running sound (ambient layers) lives on one context: it is told when
// that context is replaced or released so it can rebuild itself
export function onContextChanged(listener: () => void): () => void
{
    context_listeners.add(listener);
    return () => context_listeners.delete(listener);
}

function notifyContextChanged(): void
{
    context_listeners.forEach((listener) => listener());
}

// Ask a non-running context to start again. iOS Safari also has an
// "interrupted" state (screenshot shutter, phone call, another app's audio),
// so anything other than "running" gets a resume. If that does not work
// in time, the next tap rebuilds the context.
function tryResume(context: AudioContext): void
{
    void context.resume().catch(() =>
    {
        needs_rebuild = true;
    });
    window.setTimeout(() =>
    {
        if (audio_context === context && context.state !== 'running')
        {
            needs_rebuild = true;
        }
    }, RESUME_TIMEOUT_MS);
    // Note: a successful resume does NOT clear needs_rebuild, because iOS can
    // report "running" while silent. Only a rebuild inside a tap clears it.
}

// True while handling a real tap/click. A brand-new context only starts
// "running" on iOS when it is created inside one. Browsers without the
// UserActivation API are assumed to be in a gesture (sounds come from taps).
function isInUserGesture(): boolean
{
    const user_activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
    return user_activation ? user_activation.isActive : true;
}

// iOS keeps audio locked until a user gesture: call this from a tap.
export function unlockAudio(): void
{
    const wants_rebuild = needs_rebuild || audio_context?.state === 'closed';
    if (wants_rebuild && isInUserGesture())
    {
        rebuildContext();
    }
    const context = getContext();
    if (context.state !== 'running')
    {
        tryResume(context);
    }
}

// True when sound may be silent until the next tap (after the app was in the background)
export function isAudioStale(): boolean
{
    return needs_rebuild;
}

// Ambient sound and music each call this while they play (`player` names
// them), so leaving the app keeps the audio session alive instead of
// releasing it. It is released only once no player is left.
export function setBackgroundPlaybackActive(player: string, active: boolean): void
{
    if (active)
    {
        background_players.add(player);
    }
    else
    {
        background_players.delete(player);
    }
}

export function isBackgroundPlaybackActive(): boolean
{
    return background_players.size > 0;
}

// Leaving the app with nothing playing: close the context and hand the audio
// session back to iOS. An open "playback" session keeps the app listed as
// playing audio (the Dynamic Island / Control Center player) even when silent.
function releaseAudio(): void
{
    if (isBackgroundPlaybackActive())
    {
        return;
    }
    if (audio_context && audio_context.state !== 'closed')
    {
        void audio_context.close();
    }
    audio_context = null;
    master_gain = null;
    noise_buffer = null;
    needs_rebuild = true;           // the next tap builds a fresh context
    setAudioSessionType('auto');
    notifyContextChanged();
}

// Coming back: the context was released (next tap rebuilds it), or it was kept
// for background playback. A kept context can hit a known iOS bug where it
// reports "running" yet plays nothing, so it is marked stale too; the next tap
// builds a fresh one. Meanwhile we still try a resume in case it is fine.
document.addEventListener('visibilitychange', () =>
{
    if (document.visibilityState === 'hidden')
    {
        releaseAudio();
        return;
    }
    if (audio_context)
    {
        needs_rebuild = true;
        tryResume(audio_context);
    }
});

// iOS can skip visibilitychange when the app is swiped away
window.addEventListener('pagehide', releaseAudio);

// The master gain, created together with the context
export function getMasterGain(): GainNode
{
    getContext();
    return master_gain as GainNode;
}

// Master volume of everything played through the context (0..1)
export function setMasterVolume(volume: number): void
{
    current_volume = Math.min(1, Math.max(0, volume));
    if (master_gain)
    {
        master_gain.gain.value = current_volume;
    }
}
