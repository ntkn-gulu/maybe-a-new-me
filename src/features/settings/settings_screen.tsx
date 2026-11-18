import type { ReactNode } from 'react';
import { Screen } from '../../ui/screen';
import { TactileButton } from '../../ui/tactile_button';
import { ToggleSwitch } from '../../ui/toggle_switch';
import { SegmentedSwitch, type SegmentOption } from '../../ui/segmented_switch';
import { useSettingsStore } from '../../stores/settings_store';
import type { AppTheme } from '../../stores/active_theme';
import { useInventoryStore } from '../../stores/inventory_store';
import { MAX_DAILY_GOAL, MIN_DAILY_GOAL, useGoalSetting, useProgressStore, useSportWeekdaySetting } from '../../stores/progress_store';
import { WeekdayPicker } from '../../ui/weekday_picker';
import { getTodayKey } from '../../stores/clock';
import { playSfx, type SfxName } from '../../sound/sfx_engine';
import { useT } from '../../i18n/use_t';
import type { Language, StringKey } from '../../i18n/strings';
import type { DateFormat } from '../../i18n/date_format';
import styles from './settings_screen.module.css';

// Settings tab: daily goal and sport days (both apply from tomorrow),
// language, date format, sound + haptic preferences, replaying the intro.
// Dev mode adds a theme preview (any theme, owned or not), "try every item",
// the sound tester and a "+10 chests" button. Backup arrives in a later phase.

// Theme preview choices; "equipped" means no preview (the equipped theme item shows)
type ThemePreview = AppTheme | 'equipped';
const DEV_CHEST_GIFT = 10;

const PREVIEW_SOUNDS: { name: SfxName; label_key: StringKey }[] = [
    { name: 'tab', label_key: 'sfx_tab' },
    { name: 'toggle', label_key: 'sfx_toggle' },
    { name: 'sparkle', label_key: 'sfx_sparkle' },
    { name: 'whoosh', label_key: 'sfx_whoosh' },
    { name: 'chime', label_key: 'sfx_chime' },
    { name: 'rise', label_key: 'sfx_rise' },
    { name: 'burst', label_key: 'sfx_burst' },
];

// Language names are written in their own language, never translated
const LANGUAGE_OPTIONS: SegmentOption<Language>[] = [
    { value: 'vi', label: 'VI' },
    { value: 'en', label: 'EN' },
];

// Written the same in every language, like the VI / EN labels
const DATE_FORMAT_OPTIONS: SegmentOption<DateFormat>[] = [
    { value: 'day_first', label: 'DD/MM' },
    { value: 'month_first', label: 'MM/DD' },
];

const APP_VERSION = '0.1.0';


interface SettingRowProps
{
    label: string;
    caption?: string;
    control: ReactNode;
    is_stacked?: boolean;         // a wide control goes under the text
}

function SettingRow(props: SettingRowProps)
{
    return (
        <div className={props.is_stacked ? `${styles.row} ${styles.row_stacked}` : styles.row}>
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
    const date_format = useSettingsStore((state) => state.date_format);
    const setDateFormat = useSettingsStore((state) => state.setDateFormat);
    const is_dev_mode = useSettingsStore((state) => state.is_dev_mode);
    const dev_theme = useSettingsStore((state) => state.dev_theme);
    const setDevTheme = useSettingsStore((state) => state.setDevTheme);
    const is_dev_unlock_all = useSettingsStore((state) => state.is_dev_unlock_all);
    const toggleDevUnlockAll = useSettingsStore((state) => state.toggleDevUnlockAll);
    const addChests = useInventoryStore((state) => state.addChests);
    const theme_options: SegmentOption<ThemePreview>[] = [
        { value: 'equipped', label: t('theme_equipped') },
        { value: 'classic_3d', label: t('theme_3d') },
        { value: 'sketch', label: t('theme_sketch') },
    ];
    const goal = useGoalSetting();
    const setDailyGoal = useProgressStore((state) => state.setDailyGoal);
    const sport_days = useSportWeekdaySetting();
    const setSportWeekdays = useProgressStore((state) => state.setSportWeekdays);
    const replayOnboarding = useSettingsStore((state) => state.replayOnboarding);

    // Edits the value for tomorrow (today's goal can never be lowered)
    function changeGoal(step: number): void
    {
        setDailyGoal(goal.tomorrow_goal + step, getTodayKey());
    }

    return (
        <Screen kicker={t('settings_kicker')} title={t('settings_title')}>
            <h2 className={`mono_label ${styles.group_title}`}>{t('settings_group_goal')}</h2>
            <div className={`${styles.group} sk-frame`}>
                <SettingRow
                    label={t('settings_goal')}
                    caption={goal.tomorrow_goal !== goal.today_goal
                        ? t('settings_goal_pending', { today: goal.today_goal, tomorrow: goal.tomorrow_goal })
                        : t('settings_goal_caption')}
                    control={
                        <div className={styles.stepper}>
                            <TactileButton size="sm" is_disabled={goal.tomorrow_goal <= MIN_DAILY_GOAL} onClick={() => changeGoal(-1)} aria_label="-1">−</TactileButton>
                            <span className={styles.stepper_value}>{goal.tomorrow_goal}</span>
                            <TactileButton size="sm" is_disabled={goal.tomorrow_goal >= MAX_DAILY_GOAL} onClick={() => changeGoal(1)} aria_label="+1">+</TactileButton>
                        </div>
                    }
                />
                <SettingRow
                    label={t('settings_sport_days')}
                    caption={t('settings_sport_caption')}
                    is_stacked
                    control={
                        <WeekdayPicker
                            value={sport_days.tomorrow_weekdays}
                            onChange={(weekdays) => setSportWeekdays(weekdays, getTodayKey())}
                            aria_label={t('settings_sport_days')}
                        />
                    }
                />
            </div>

            <h2 className={`mono_label ${styles.group_title}`}>{t('settings_group_general')}</h2>
            <div className={`${styles.group} sk-frame`}>
                {/* Dev mode: preview any theme without owning it */}
                {is_dev_mode && (
                    <SettingRow
                        label={t('settings_theme')}
                        caption={t('settings_theme_caption')}
                        control={
                            <SegmentedSwitch
                                options={theme_options}
                                value={dev_theme ?? 'equipped'}
                                onChange={(value) => setDevTheme(value === 'equipped' ? null : value)}
                                aria_label={t('settings_theme')}
                            />
                        }
                    />
                )}
                {/* Dev mode: equip any item in the Collection without owning it */}
                {is_dev_mode && (
                    <SettingRow
                        label={t('settings_dev_unlock_all')}
                        caption={t('settings_dev_unlock_all_caption')}
                        control={<ToggleSwitch is_on={is_dev_unlock_all} onChange={toggleDevUnlockAll} aria_label={t('settings_dev_unlock_all')} />}
                    />
                )}
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
                <SettingRow
                    label={t('settings_replay_onboarding')}
                    caption={t('settings_replay_caption')}
                    control={<TactileButton size="sm" onClick={replayOnboarding}>{t('settings_replay_button')}</TactileButton>}
                />
                <SettingRow
                    label={t('settings_date_format')}
                    caption={t('settings_date_format_caption')}
                    control={
                        <SegmentedSwitch
                            options={DATE_FORMAT_OPTIONS}
                            value={date_format}
                            onChange={setDateFormat}
                            aria_label={t('settings_date_format')}
                        />
                    }
                />
            </div>

            <h2 className={`mono_label ${styles.group_title}`}>{t('settings_group_sound')}</h2>
            <div className={`${styles.group} sk-frame`}>
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
            </div>

            {is_dev_mode && (
                <>
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
                        <TactileButton size="sm" variant="ink" onClick={() => addChests(Array(DEV_CHEST_GIFT).fill('daily'))}>
                            {t('dev_add_chests', { n: DEV_CHEST_GIFT })}
                        </TactileButton>
                    </div>
                </>
            )}

            <p className={`mono_label ${styles.footer}`}>Maybe A New Me · v{APP_VERSION} · {__BUILD_TIME__} UTC</p>
        </Screen>
    );
}
