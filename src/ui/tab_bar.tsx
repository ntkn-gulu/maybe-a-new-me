import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { playSfx } from '../sound/sfx_engine';
import { triggerHaptic } from '../sound/haptic_hack';
import { ChestIcon, FlameIcon, GearIcon, TimerIcon } from './icons';
import { SketchChestIcon, SketchFlameIcon, SketchGearIcon, SketchTimerIcon } from './sketch_icons';
import { useArtStyle } from '../stores/active_theme';
import { SPRING_PRESS, SPRING_SLIDE } from './motion_presets';
import { getPressableProps } from './pressable';
import { HapticOverlay } from './haptic_overlay';
import { useT } from '../i18n/use_t';
import type { StringKey } from '../i18n/strings';
import styles from './tab_bar.module.css';

export type TabId = 'streak' | 'focus' | 'rewards' | 'settings';

interface TabDefinition
{
    id: TabId;
    label_key: StringKey;
    icon: ReactNode;
    sketch_icon: ReactNode;       // doodled version for the sketch theme
    sub_page_key?: StringKey;     // name of the sub-page that tapping the active tab again opens
}

export const TABS: TabDefinition[] = [
    { id: 'streak', label_key: 'tab_journey', icon: <FlameIcon />, sketch_icon: <SketchFlameIcon /> },
    { id: 'focus', label_key: 'tab_focus', icon: <TimerIcon />, sketch_icon: <SketchTimerIcon /> },
    { id: 'rewards', label_key: 'tab_rewards', icon: <ChestIcon />, sketch_icon: <SketchChestIcon />, sub_page_key: 'collection_title' },
    { id: 'settings', label_key: 'tab_settings', icon: <GearIcon />, sketch_icon: <SketchGearIcon /> },
];

// The hint mark over a tab with a sub-page: a small chevron pointing up
// (flips down while the sub-page is open); a wobbly one in the sketch theme
const HINT_PATH = 'M2 6.5 L6 2.5 L10 6.5';
const SKETCH_HINT_PATH = 'M1.8 6.6 L6.2 2.3 L10.3 6.2';

interface TabBarProps
{
    active_tab: TabId;
    is_sub_page_open: boolean;
    onChange: (tab: TabId) => void;
    onToggleSubPage: () => void;      // the active tab was tapped again and has a sub-page
}

// Tab bar with 4 fixed tabs. More screens never add tabs: a tab can have a
// sub-page, shown by tapping it again while it is active (see TABS.sub_page_key).

export function TabBar(props: TabBarProps)
{
    const t = useT();
    const is_sketch = useArtStyle() === 'sketch';

    function selectTab(tab: TabDefinition): void
    {
        if (tab.id === props.active_tab && !tab.sub_page_key)
        {
            return;
        }
        playSfx('tab');
        triggerHaptic();
        if (tab.id === props.active_tab)
        {
            props.onToggleSubPage();
            return;
        }
        props.onChange(tab.id);
    }

    return (
        <nav className={`${styles.bar} sk-frame sk-fixed`}>
            {TABS.map((tab) =>
            {
                const is_active = tab.id === props.active_tab;
                const has_hint = is_active && tab.sub_page_key !== undefined;
                let label = t(tab.label_key);
                if (has_hint && tab.sub_page_key)
                {
                    const sub_page_name = t(tab.sub_page_key);
                    label = props.is_sub_page_open
                        ? t('tab_close_sub_page', { name: sub_page_name })
                        : t('tab_open_sub_page', { name: sub_page_name });
                }
                return (
                    <motion.div
                        key={tab.id}
                        {...getPressableProps(() => selectTab(tab))}
                        className={is_active ? `${styles.tab} ${styles.active}` : styles.tab}
                        whileTap={{ scale: 0.86 }}
                        transition={SPRING_PRESS}
                        aria-current={is_active ? 'page' : undefined}
                        aria-label={label}
                    >
                        {is_active && (
                            // Shared layoutId makes the pill slide between tabs
                            <motion.span layoutId="tab-pill" className={`${styles.pill} sk-frame sk-flat sk-abs`} transition={SPRING_SLIDE} />
                        )}
                        {has_hint && (
                            <motion.svg
                                className={styles.hint}
                                viewBox="0 0 12 9"
                                initial={{ opacity: 0, y: 3 }}
                                animate={{ opacity: 1, y: 0, rotate: props.is_sub_page_open ? 180 : 0 }}
                                transition={SPRING_SLIDE}
                                aria-hidden="true"
                            >
                                <path d={is_sketch ? SKETCH_HINT_PATH : HINT_PATH} />
                            </motion.svg>
                        )}
                        <span className={styles.icon}>{is_sketch ? tab.sketch_icon : tab.icon}</span>
                        <span className={styles.label}>{t(tab.label_key)}</span>
                        <HapticOverlay />
                    </motion.div>
                );
            })}
        </nav>
    );
}
