import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { playSfx } from '../sound/sfx_engine';
import { triggerHaptic } from '../sound/haptic_hack';
import { BadgeIcon, ChestIcon, FlameIcon, GearIcon, HeadphonesIcon, TimerIcon } from './icons';
import { SketchBadgeIcon, SketchChestIcon, SketchFlameIcon, SketchGearIcon, SketchHeadphonesIcon, SketchTimerIcon } from './sketch_icons';
import { useArtStyle } from '../stores/active_theme';
import { SPRING_PRESS, SPRING_SLIDE } from './motion_presets';
import { getPressableProps } from './pressable';
import { HapticOverlay } from './haptic_overlay';
import { useT } from '../i18n/use_t';
import type { StringKey } from '../i18n/strings';
import styles from './tab_bar.module.css';

// Tab bar with 4 fixed tabs. More screens never add tabs: a tab can have
// sub-pages. Tapping such a tab while it is active makes its other pages pop
// up from it as a stack of tab-sized tiles; a tap on a tile goes there, a tap
// anywhere else folds the stack back. The page being shown never gets a tile:
// it is in the bar already, because the tab itself takes that page's icon and
// name (a sub-page "replaces" the tab until another tab is picked). A small
// chevron in the tab's corner hints at the stack.

export type TabId = 'streak' | 'focus' | 'rewards' | 'settings';
export type SubPageId = 'collection' | 'sound_room';

interface PageButton
{
    label_key: StringKey;
    icon: ReactNode;
    sketch_icon: ReactNode;           // doodled version for the sketch theme
}

interface SubPageDefinition extends PageButton
{
    id: SubPageId;
}

interface TabDefinition extends PageButton
{
    id: TabId;
    sub_pages?: SubPageDefinition[];
}

export const TABS: TabDefinition[] = [
    { id: 'streak', label_key: 'tab_journey', icon: <FlameIcon />, sketch_icon: <SketchFlameIcon /> },
    {
        id: 'focus',
        label_key: 'tab_focus',
        icon: <TimerIcon />,
        sketch_icon: <SketchTimerIcon />,
        sub_pages: [{ id: 'sound_room', label_key: 'sound_room_tab', icon: <HeadphonesIcon />, sketch_icon: <SketchHeadphonesIcon /> }],
    },
    {
        id: 'rewards',
        label_key: 'tab_rewards',
        icon: <ChestIcon />,
        sketch_icon: <SketchChestIcon />,
        sub_pages: [{ id: 'collection', label_key: 'collection_title', icon: <BadgeIcon />, sketch_icon: <SketchBadgeIcon /> }],
    },
    { id: 'settings', label_key: 'tab_settings', icon: <GearIcon />, sketch_icon: <SketchGearIcon /> },
];

// The hint mark in a tab with sub-pages: a small chevron pointing up
// (flips down while the stack is open); a wobbly one in the sketch theme
const HINT_PATH = 'M2 6.5 L6 2.5 L10 6.5';
const SKETCH_HINT_PATH = 'M1.8 6.6 L6.2 2.3 L10.3 6.2';

// The page tiles lift off the active tab: each starts over the tab
// (lane gap 10 + bar padding 8 + tile 58, plus 58 + 8 per tile below it)
// and springs up to its place (index 0 = lowest tile)
const TILE_START_PX = 76;
const TILE_STEP_PX = 66;
const TILE_STAGGER_S = 0.05;
const TILE_TILT_DEG = [-5, 4, -3, 3];

interface TabBarProps
{
    active_tab: TabId;
    sub_page: SubPageId | null;               // sub-page shown over the active tab's page
    onChange: (tab: TabId) => void;
    onSelectPage: (sub_page: SubPageId | null) => void;   // null = the tab's own page
    accessory?: ReactNode;                    // shown just above the bar (the mini player); hidden while the stack is open
}

export function TabBar(props: TabBarProps)
{
    const t = useT();
    const is_sketch = useArtStyle() === 'sketch';
    const [is_stack_open, setIsStackOpen] = useState(false);

    const active_index = TABS.findIndex((tab) => tab.id === props.active_tab);
    const active_definition = TABS[active_index];
    const active_sub_pages = active_definition.sub_pages ?? [];

    function selectTab(tab: TabDefinition): void
    {
        if (tab.id === props.active_tab)
        {
            if (!tab.sub_pages)
            {
                return;
            }
            playSfx(is_stack_open ? 'release' : 'toggle');
            triggerHaptic();
            setIsStackOpen(!is_stack_open);
            return;
        }
        playSfx('tab');
        triggerHaptic();
        setIsStackOpen(false);
        props.onChange(tab.id);
    }

    function selectPage(sub_page: SubPageId | null): void
    {
        playSfx('tab');
        triggerHaptic();
        setIsStackOpen(false);
        if (sub_page !== props.sub_page)
        {
            props.onSelectPage(sub_page);
        }
    }

    // The stack: every page of the tab except the one shown (its own page first, lowest)
    const stack_pages: { id: SubPageId | null; button: PageButton }[] = [
        { id: null, button: active_definition },
        ...active_sub_pages.map((page) => ({ id: page.id, button: page })),
    ].filter((page) => page.id !== props.sub_page);

    return (
        <div className={styles.dock}>
            {/* Taps outside the open stack fold it back */}
            {is_stack_open && <div className={styles.backdrop} onClick={() => setIsStackOpen(false)} />}

            {/* Page tiles, in front of the bar, lifting off the active tab */}
            <div className={styles.stack_lane}>
                <div className={styles.stack} style={{ gridColumn: active_index + 1 }}>
                    <AnimatePresence>
                        {is_stack_open && stack_pages.map((page, index) =>
                        {
                            const tilt = TILE_TILT_DEG[index % TILE_TILT_DEG.length];
                            const start_y = TILE_START_PX + index * TILE_STEP_PX;
                            return (
                                <motion.div
                                    key={`${props.active_tab}-${page.id ?? 'main'}`}
                                    {...getPressableProps(() => selectPage(page.id))}
                                    className={`${styles.tile} sk-frame`}
                                    initial={{ y: start_y, rotate: tilt, scale: 0.8, opacity: 0 }}
                                    animate={{ y: 0, rotate: 0, scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 480, damping: 22, delay: index * TILE_STAGGER_S, opacity: { duration: 0.1, delay: index * TILE_STAGGER_S } } }}
                                    exit={{ y: start_y, rotate: tilt, scale: 0.8, opacity: 0, transition: { duration: 0.16, ease: 'easeIn', delay: (stack_pages.length - 1 - index) * 0.03 } }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <span className={styles.icon}>{is_sketch ? page.button.sketch_icon : page.button.icon}</span>
                                    <span className={styles.label}>{t(page.button.label_key)}</span>
                                    <HapticOverlay />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {props.accessory && (
                <div className={is_stack_open ? `${styles.accessory} ${styles.accessory_hidden}` : styles.accessory}>
                    {props.accessory}
                </div>
            )}

            <nav className={`${styles.bar} sk-frame`}>
                {TABS.map((tab) =>
                {
                    const is_active = tab.id === props.active_tab;
                    const has_pages = is_active && tab.sub_pages !== undefined;
                    // An active tab shows the page it is on
                    const current_page = is_active ? tab.sub_pages?.find((page) => page.id === props.sub_page) : undefined;
                    const shown: PageButton = current_page ?? tab;
                    return (
                        <motion.div
                            key={tab.id}
                            {...getPressableProps(() => selectTab(tab))}
                            className={is_active ? `${styles.tab} ${styles.active}` : styles.tab}
                            whileTap={{ scale: 0.86 }}
                            transition={SPRING_PRESS}
                            aria-current={is_active ? 'page' : undefined}
                            aria-expanded={has_pages ? is_stack_open : undefined}
                        >
                            {is_active && (
                                // Shared layoutId makes the pill slide between tabs
                                <motion.span layoutId="tab-pill" className={`${styles.pill} sk-frame sk-flat sk-abs`} transition={SPRING_SLIDE} />
                            )}
                            {has_pages && (
                                <motion.svg
                                    className={styles.hint}
                                    viewBox="0 0 12 9"
                                    initial={{ opacity: 0, y: 3 }}
                                    animate={{ opacity: 1, y: 0, rotate: is_stack_open ? 180 : 0 }}
                                    transition={SPRING_SLIDE}
                                    aria-hidden="true"
                                >
                                    <path d={is_sketch ? SKETCH_HINT_PATH : HINT_PATH} />
                                </motion.svg>
                            )}
                            <span className={styles.icon}>{is_sketch ? shown.sketch_icon : shown.icon}</span>
                            <span className={styles.label}>{t(shown.label_key)}</span>
                            <HapticOverlay />
                        </motion.div>
                    );
                })}
            </nav>
        </div>
    );
}
