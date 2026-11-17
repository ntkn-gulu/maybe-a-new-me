import { TactileButton } from '../../ui/tactile_button';
import { getPressableProps } from '../../ui/pressable';
import { HapticOverlay } from '../../ui/haptic_overlay';
import { playSfx } from '../../sound/sfx_engine';
import { REWARD_CATALOG } from '../../core/reward_catalog';
import { useT } from '../../i18n/use_t';
import { itemNameKey } from '../../i18n/strings';
import { getFlameColors } from './flame_palettes';
import styles from './dev_journey_panel.module.css';

// Journey tools shown only in dev mode: fake a streak (0..400 days) to walk
// through every tier, replay the level-up screen, and try flame color items.
// Nothing here is saved; the real streak is untouched.

export const DEV_MAX_STREAK = 400;

// The default color plus every flame color that can drop from chests
const DEV_FLAME_COLOR_IDS = REWARD_CATALOG
    .filter((item) => item.slot === 'flame' && item.source !== 'milestone')
    .map((item) => item.id);

interface DevJourneyPanelProps
{
    streak: number;
    is_faked: boolean;
    tier_index: number;
    color_id: string | null;
    onStreakChange: (streak: number | null) => void;     // null = back to the real streak
    onColorChange: (color_id: string) => void;
    onPlayLevelUp: () => void;
}

export function DevJourneyPanel(props: DevJourneyPanelProps)
{
    const t = useT();

    return (
        <section className={styles.panel}>
            <span className={styles.chip}>{t('dev_panel_title')}</span>

            <label className={styles.label} htmlFor="dev-streak">{t('dev_streak', { n: props.streak })}</label>
            <input
                id="dev-streak"
                type="range"
                min={0}
                max={DEV_MAX_STREAK}
                step={1}
                value={props.streak}
                className={styles.slider}
                onChange={(event) => props.onStreakChange(Number(event.target.value))}
            />

            <span className={styles.label}>{t('dev_flame_color')}</span>
            <div className={styles.swatches}>
                {DEV_FLAME_COLOR_IDS.map((color_id) =>
                {
                    const colors = getFlameColors(props.tier_index, color_id);
                    const is_selected = color_id === (props.color_id ?? DEV_FLAME_COLOR_IDS[0]);
                    return (
                        <div
                            key={color_id}
                            {...getPressableProps(() =>
                            {
                                playSfx('tab');
                                props.onColorChange(color_id);
                            }, false, 'radio')}
                            aria-checked={is_selected}
                            aria-label={t(itemNameKey(color_id))}
                            className={is_selected ? `${styles.swatch} ${styles.swatch_selected}` : styles.swatch}
                            style={{ background: `linear-gradient(150deg, ${colors.shades[3]}, ${colors.shades[1]} 55%, ${colors.shades[0]})` }}
                        >
                            <HapticOverlay />
                        </div>
                    );
                })}
            </div>

            <div className={styles.actions}>
                <TactileButton size="sm" variant="ink" onClick={props.onPlayLevelUp}>{t('dev_level_up')}</TactileButton>
                <TactileButton size="sm" is_disabled={!props.is_faked} onClick={() => props.onStreakChange(null)}>
                    {t('dev_streak_real')}
                </TactileButton>
            </div>
        </section>
    );
}
