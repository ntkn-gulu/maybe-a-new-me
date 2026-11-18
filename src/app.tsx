import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TabBar, type SubPageId, type TabId } from './ui/tab_bar';
import { FocusScreen } from './features/focus/focus_screen';
import { StreakScreen } from './features/streak/streak_screen';
import { ChestScreen } from './features/rewards/chest_screen';
import { CollectionScreen } from './features/rewards/collection_screen';
import { SettingsScreen } from './features/settings/settings_screen';
import { FocusSessionLayer } from './features/focus/focus_session_layer';
import { LevelUpGate } from './features/streak/level_up_gate';
import { RewardGate } from './features/rewards/reward_gate';
import { SPRING_SLIDE } from './ui/motion_presets';
import styles from './app.module.css';

// App shell: one active screen + the bottom tab bar.
// No router on purpose: 4 fixed tabs only need a piece of state.
// A tab can have sub-pages (Rewards -> Collection), picked from the page
// stack the tab bar pops up when the active tab is tapped again. A sub-page
// slides up as a sheet over the tab's screen; going back to the tab's own
// page or switching tabs slides it away.

const DEFAULT_TAB: TabId = 'focus';

function renderScreen(tab: TabId)
{
    switch (tab)
    {
        case 'streak':
            return <StreakScreen />;
        case 'focus':
            return <FocusScreen />;
        case 'rewards':
            return <ChestScreen />;
        case 'settings':
            return <SettingsScreen />;
    }
}

// Sub-pages listed under a tab's sub_pages in TABS
function renderSubPage(sub_page: SubPageId)
{
    switch (sub_page)
    {
        case 'collection':
            return <CollectionScreen />;
    }
}

export function App()
{
    const [active_tab, setActiveTab] = useState<TabId>(DEFAULT_TAB);
    const [sub_page, setSubPage] = useState<SubPageId | null>(null);

    function changeTab(tab: TabId): void
    {
        setActiveTab(tab);
        setSubPage(null);
    }

    return (
        <div className={styles.app}>
            <AnimatePresence mode="wait" initial={false}>
                <motion.main
                    key={active_tab}
                    className={styles.main}
                    initial={{ opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                >
                    {renderScreen(active_tab)}
                </motion.main>
            </AnimatePresence>
            <AnimatePresence>
                {sub_page && (
                    <motion.section
                        key={sub_page}
                        className={styles.sub_page}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={SPRING_SLIDE}
                    >
                        {renderSubPage(sub_page)}
                    </motion.section>
                )}
            </AnimatePresence>
            <TabBar
                active_tab={active_tab}
                sub_page={sub_page}
                onChange={changeTab}
                onSelectPage={setSubPage}
            />
            <FocusSessionLayer />
            <LevelUpGate />
            <RewardGate />
        </div>
    );
}
