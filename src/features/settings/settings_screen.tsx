import type { ReactNode } from 'react';
import { Screen } from '../../ui/screen';
import { TactileButton } from '../../ui/tactile_button';
import { ToggleSwitch } from '../../ui/toggle_switch';
import { SegmentedSwitch, type SegmentOption } from '../../ui/segmented_switch';
import { useSettingsStore } from '../../stores/settings_store';
import { playSfx, type SfxName } from '../../sound/sfx_engine';
import { useT } from '../../i18n/use_t';
import type { Language, StringKey } from '../../i18n/strings';
import styles from './settings_screen.module.css';

// Settings tab: language, sound + haptic preferences and a sound tester.
// Goal, sport days, backup and credits arrive in later phases.

const PREVIEW_SOUNDS: { name: SfxName; label_key: StringKey }[] = [
    { name: 'tab', label_key: 'sfx_tab' },
    { name: 'toggle', label_key: 'sfx_toggle' },
    { name: 'sparkle', label_key: 'sfx_sparkle' },
    { name: 'whoosh', label_key: 'sfx_whoosh' },
    { name: 'chime', label_key: 'sfx_chime' },
];

// Language names are written in their own language, never translated
const LANGUAGE_OPTIONS: SegmentOption<Language>[] = [
    { value: 'vi', label: 'VI' },
    { value: 'en', label: 'EN' },
];

const APP_VERSION = '0.1.0';

// Safari 17.4+ renders <input type="checkbox" switch> as an iOS switch.
// React 18 types don't know the attribute yet, so it is passed through a spread.
const NATIVE_SWITCH_ATTRIBUTE = { switch: '' } as Record<string, string>;

interface SettingRowProps
{
    label: string;
    caption?: string;
    control: ReactNode;
}

function SettingRow(props: SettingRowProps)
{
    return (
        <div className={styles.row}>
            <div className={styles.row_text}>
                <span className={styles.row_label}>{props.label}</span>
                {props.caption && <span className={styles.row_caption}>{props.caption}</span>}
            </div>
            {props.control}
        </div>
    );
}

export function SettingsScreen()
{
    const t = useT();
    const language = useSettingsStore((state) => state.language);
    const is_sound_enabled = useSettingsStore((state) => state.is_sound_enabled);
    const sfx_volume = useSettingsStore((state) => state.sfx_volume);
    const is_haptic_enabled = useSettingsStore((state) => state.is_haptic_enabled);
    const setLanguage = useSettingsStore((state) => state.setLanguage);
    const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
    const setSfxVolume = useSettingsStore((state) => state.setSfxVolume);
    const setHapticEnabled = useSettingsStore((state) => state.setHapticEnabled);

    return (
        <Screen kicker={t('settings_kicker')} title={t('settings_title')}>
            <h2 className={`mono_label ${styles.group_title}`}>{t('settings_group_general')}</h2>
            <div className={styles.group}>
                <SettingRow
                    label={t('settings_language')}
                    caption="Tiếng Việt · English"
                    control={
                        <SegmentedSwitch
                            options={LANGUAGE_OPTIONS}
                            value={language}
                            onChange={setLanguage}
                            aria_label={t('settings_language')}
                        />
                    }
                />
            </div>

            <h2 className={`mono_label ${styles.group_title}`}>{t('settings_group_sound')}</h2>
            <div className={styles.group}>
                <SettingRow
                    label={t('settings_sound')}
                    control={<ToggleSwitch is_on={is_sound_enabled} onChange={setSoundEnabled} aria_label={t('settings_sound')} />}
                />
                <SettingRow
                    label={t('settings_volume')}
                    control={
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={sfx_volume}
                            className={styles.slider}
                            aria-label={t('settings_volume')}
                            onChange={(event) => setSfxVolume(Number(event.target.value))}
                            onPointerUp={() => playSfx('tab')}
                        />
                    }
                />
                <SettingRow
                    label={t('settings_haptic')}
                    caption={t('settings_haptic_caption')}
                    control={<ToggleSwitch is_on={is_haptic_enabled} onChange={setHapticEnabled} aria_label={t('settings_haptic')} />}
                />
                <SettingRow
                    label={t('settings_native_switch')}
                    caption={t('settings_native_switch_caption')}
                    control={
                        // Diagnostic: the browser's own switch. If flipping this one by hand does
                        // not buzz, iOS gives no web haptics on this device and our trick can't either.
                        <input type="checkbox" {...NATIVE_SWITCH_ATTRIBUTE} className={styles.native_switch} aria-label={t('settings_native_switch')} />
                    }
                />
            </div>

            <h2 className={`mono_label ${styles.group_title}`}>{t('settings_group_preview')}</h2>
            <div className={styles.preview_row}>
                {PREVIEW_SOUNDS.map((sound) => (
                    <TactileButton key={sound.name} size="sm" onClick={() => playSfx(sound.name)}>
                        {t(sound.label_key)}
                    </TactileButton>
                ))}
                {/* Every tactile button already buzzes on click; this one only buzzes */}
                <TactileButton size="sm" variant="ink">
                    {t('haptic_test')}
                </TactileButton>
            </div>

            <p className={`mono_label ${styles.footer}`}>Maybe A New Me · v{APP_VERSION}</p>
        </Screen>
    );
}
