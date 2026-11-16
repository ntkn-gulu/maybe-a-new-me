import type { ReactNode } from 'react';
import { Screen } from '../../ui/screen';
import { TactileButton } from '../../ui/tactile_button';
import { ToggleSwitch } from '../../ui/toggle_switch';
import { useSettingsStore } from '../../stores/settings_store';
import { playSfx, type SfxName } from '../../sound/sfx_engine';
import styles from './settings_screen.module.css';

// Settings tab. Phase 0: sound + haptic preferences and a sound tester.
// Goal, sport days, backup and credits arrive in later phases.

const PREVIEW_SOUNDS: { name: SfxName; label: string }[] = [
    { name: 'tab', label: 'Tab' },
    { name: 'toggle', label: 'Gạt' },
    { name: 'sparkle', label: 'Lấp lánh' },
    { name: 'whoosh', label: 'Vút' },
    { name: 'chime', label: 'Chuông' },
];

const APP_VERSION = '0.1.0';

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
    const is_sound_enabled = useSettingsStore((state) => state.is_sound_enabled);
    const sfx_volume = useSettingsStore((state) => state.sfx_volume);
    const is_haptic_enabled = useSettingsStore((state) => state.is_haptic_enabled);
    const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
    const setSfxVolume = useSettingsStore((state) => state.setSfxVolume);
    const setHapticEnabled = useSettingsStore((state) => state.setHapticEnabled);

    return (
        <Screen kicker="Tùy chỉnh" title="Cài đặt">
            <h2 className={`mono_label ${styles.group_title}`}>Âm thanh & rung</h2>
            <div className={styles.group}>
                <SettingRow
                    label="Âm thanh"
                    control={<ToggleSwitch is_on={is_sound_enabled} onChange={setSoundEnabled} aria_label="Bật tắt âm thanh" />}
                />
                <SettingRow
                    label="Âm lượng"
                    control={
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={sfx_volume}
                            className={styles.slider}
                            aria-label="Âm lượng"
                            onChange={(event) => setSfxVolume(Number(event.target.value))}
                            onPointerUp={() => playSfx('tab')}
                        />
                    }
                />
                <SettingRow
                    label="Rung khi bấm"
                    caption="Thử nghiệm · iPhone iOS 18+"
                    control={<ToggleSwitch is_on={is_haptic_enabled} onChange={setHapticEnabled} aria_label="Bật tắt rung" />}
                />
            </div>

            <h2 className={`mono_label ${styles.group_title}`}>Nghe thử</h2>
            <div className={styles.preview_row}>
                {PREVIEW_SOUNDS.map((sound) => (
                    <TactileButton key={sound.name} size="sm" onClick={() => playSfx(sound.name)}>
                        {sound.label}
                    </TactileButton>
                ))}
            </div>

            <p className={`mono_label ${styles.footer}`}>Maybe A New Me · v{APP_VERSION}</p>
        </Screen>
    );
}
