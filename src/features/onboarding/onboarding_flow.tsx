import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { Ribbon } from '../../ui/ribbon';
import { WeekdayPicker } from '../../ui/weekday_picker';
import { getPressableProps } from '../../ui/pressable';
import { OPACITY_FADE, SPRING_POP, SPRING_SLIDE } from '../../ui/motion_presets';
import { playSfx } from '../../sound/sfx_engine';
import { useT } from '../../i18n/use_t';
import type { StringKey } from '../../i18n/strings';
import { FLAME_TIERS } from '../../core/flame_tiers';
import { FREEZE_EARN_EVERY_DAYS, SPORT_DAY_MIN_SESSIONS } from '../../core/streak_engine';
import { LEAVE_GRACE_SECONDS, MAX_AWAY_SECONDS_PER_25_MIN, PRESENCE_RESPONSE_SECONDS } from '../../core/session_rules';
import { useSettingsStore } from '../../stores/settings_store';
import { MAX_DAILY_GOAL, MIN_DAILY_GOAL, useGoalSetting, useProgressStore, useSportWeekdaySetting } from '../../stores/progress_store';
import { getTodayKey } from '../../stores/clock';
import { useArtStyle } from '../../stores/active_theme';
import { useInventoryStore } from '../../stores/inventory_store';
import { Flame } from '../streak/flame';
import { TierStrip } from '../streak/tier_strip';
import { ExtrudedChestArt } from '../rewards/extruded_chest_art';
import { SketchChestArt } from '../rewards/sketch_chest_art';
import { InstallStep } from './install_step';
import { getInstallPlatform } from './install_platform';
import styles from './onboarding_flow.module.css';

// First-run walkthrough, full screen above everything:
// (install) → welcome → the flame levels up → chests → daily goal →
// sport days → strict rules → "Let's go!".
// The install step only shows in a phone browser (not from the home screen).
// Intro slides can be skipped to the goal step. Finishing applies the goal
// and sport days (from today on a fresh install, else from tomorrow) and
// marks onboarding as seen; Settings can replay it.

type StepId = 'install' | 'welcome' | 'streak' | 'chests' | 'goal' | 'sport' | 'rules';

const INTRO_STEPS: StepId[] = ['welcome', 'streak', 'chests'];
const SETUP_STEPS: StepId[] = ['goal', 'sport', 'rules'];
const SLIDE_OFFSET_PX = 70;
const SHOWN_TIERS = 2;                // tiers colored on the streak slide; the rest stay a surprise
const ART_FLAME_SIZE = 170;
const ART_CHEST_SIZE = 190;

const RULES: { icon: string; key: StringKey }[] = [
    { icon: '📵', key: 'rule_leave' },
    { icon: '👀', key: 'rule_check' },
    { icon: '✋', key: 'rule_give_up' },
    { icon: '✍️', key: 'rule_note' },
];

export function OnboardingGate()
{
    const has_seen = useSettingsStore((state) => state.has_seen_onboarding);
    return createPortal(
        <AnimatePresence>
            {!has_seen && <OnboardingFlow key="onboarding" />}
        </AnimatePresence>,
        document.body,
    );
}

function OnboardingFlow()
{
    const t = useT();
    const art_style = useArtStyle();
    const finishOnboarding = useSettingsStore((state) => state.finishOnboarding);
    const applyStartingSetup = useProgressStore((state) => state.applyStartingSetup);
    const has_history = useProgressStore((state) => state.sessions.length > 0 || state.sport_check_ins.length > 0);
    const goal_setting = useGoalSetting();
    const sport_setting = useSportWeekdaySetting();
    const chests_waiting = useInventoryStore((state) => state.pending_chests.length);

    const [steps] = useState<StepId[]>(() => [...(getInstallPlatform() ? ['install' as const] : []), ...INTRO_STEPS, ...SETUP_STEPS]);
    const [step_index, setStepIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    // A fresh install starts with no sport days picked; a replay shows the current ones
    const [goal, setGoal] = useState(goal_setting.tomorrow_goal);
    const [weekdays, setWeekdays] = useState<number[]>(has_history ? sport_setting.tomorrow_weekdays : []);

    const step = steps[step_index];
    const is_last = step_index === steps.length - 1;
    const is_intro = INTRO_STEPS.includes(step);

    function goTo(next_index: number): void
    {
        setDirection(next_index > step_index ? 1 : -1);
        setStepIndex(next_index);
        playSfx('whoosh', 0.6);
    }

    function finish(): void
    {
        applyStartingSetup(goal, weekdays, getTodayKey());
        playSfx('sparkle');
        finishOnboarding();
    }

    function changeGoal(change: number): void
    {
        setGoal((current) => Math.min(MAX_DAILY_GOAL, Math.max(MIN_DAILY_GOAL, current + change)));
    }

    let slide: ReactNode;
    switch (step)
    {
        case 'install':
            slide = <InstallStep onSkip={() => goTo(step_index + 1)} />;
            break;
        case 'welcome':
            slide = (
                <Slide kicker={t('welcome_kicker')} title={t('welcome_title')} body={t('welcome_body')}>
                    <Flame tier_index={1} size={ART_FLAME_SIZE} />
                </Slide>
            );
            break;
        case 'streak':
            slide = (
                <Slide
                    kicker={t('streak_slide_kicker')}
                    title={t('streak_slide_title')}
                    body={t('streak_slide_body', {
                        a: FLAME_TIERS[1].min_days,
                        b: FLAME_TIERS[2].min_days,
                        c: FLAME_TIERS[3].min_days,
                        d: FLAME_TIERS[FLAME_TIERS.length - 1].min_days,
                        freeze: FREEZE_EARN_EVERY_DAYS,
                    })}
                >
                    <div className={styles.strip}>
                        <TierStrip reached_index={SHOWN_TIERS} selected_index={0} onSelect={() => undefined} />
                    </div>
                </Slide>
            );
            break;
        case 'chests':
            slide = (
                <Slide kicker={t('chests_slide_kicker')} title={t('chests_slide_title')} body={t('chests_slide_body')}>
                    <div className={styles.chest}>
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}>
                            {art_style === 'sketch' ? <SketchChestArt size={ART_CHEST_SIZE} /> : <ExtrudedChestArt size={ART_CHEST_SIZE} />}
                        </motion.div>
                        {chests_waiting > 0 && <Ribbon color="flame">{t('chests_slide_gift', { n: chests_waiting })}</Ribbon>}
                    </div>
                </Slide>
            );
            break;
        case 'goal':
            slide = (
                <Slide kicker={t('goal_slide_kicker')} title={t('goal_slide_title')} body={t('goal_slide_body')} is_form>
                    <div className={styles.goal}>
                        <TactileButton size="md" is_disabled={goal <= MIN_DAILY_GOAL} onClick={() => changeGoal(-1)} aria_label="-1"><span className={styles.goal_sign}>−</span></TactileButton>
                        <div className={styles.goal_value}>
                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.span
                                    key={goal}
                                    className={styles.goal_number}
                                    initial={{ y: 24, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -24, opacity: 0 }}
                                    transition={{ y: SPRING_POP, opacity: OPACITY_FADE }}
                                >
                                    {goal}
                                </motion.span>
                            </AnimatePresence>
                            <span className="mono_label">{t('goal_slide_unit')}</span>
                        </div>
                        <TactileButton size="md" is_disabled={goal >= MAX_DAILY_GOAL} onClick={() => changeGoal(1)} aria_label="+1"><span className={styles.goal_sign}>+</span></TactileButton>
                    </div>
                </Slide>
            );
            break;
        case 'sport':
            slide = (
                <Slide kicker={t('sport_slide_kicker')} title={t('sport_slide_title')} body={t('sport_slide_body', { n: SPORT_DAY_MIN_SESSIONS })} is_form>
                    <div className={styles.sport}>
                        <WeekdayPicker value={weekdays} onChange={setWeekdays} aria_label={t('sport_slide_title')} />
                        <span className="mono_label">
                            {weekdays.length === 0 ? t('sport_slide_none') : t('sport_slide_count', { n: weekdays.length })}
                        </span>
                    </div>
                </Slide>
            );
            break;
        case 'rules':
            slide = (
                <Slide kicker={t('rules_slide_kicker')} title={t('rules_slide_title')} is_form>
                    <ul className={styles.rules}>
                        {RULES.map((rule, index) => (
                            <motion.li
                                key={rule.key}
                                className={`${styles.rule} sk-frame sk-flat`}
                                initial={{ x: 30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ x: { ...SPRING_POP, delay: 0.1 + index * 0.07 }, opacity: { ...OPACITY_FADE, delay: 0.1 + index * 0.07 } }}
                            >
                                <span className={styles.rule_icon} aria-hidden="true">{rule.icon}</span>
                                <span>
                                    {t(rule.key, {
                                        grace: LEAVE_GRACE_SECONDS,
                                        away: MAX_AWAY_SECONDS_PER_25_MIN / 60,
                                        n: PRESENCE_RESPONSE_SECONDS,
                                    })}
                                </span>
                            </motion.li>
                        ))}
                    </ul>
                </Slide>
            );
            break;
    }

    return (
        <motion.div
            className={styles.layer}
            role="dialog"
            aria-modal="true"
            aria-label={t('onboarding_progress', { n: step_index + 1, total: steps.length })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
            <div className={styles.content}>
                <div className={styles.top}>
                    <div className={styles.dots} aria-hidden="true">
                        {steps.map((step_id, index) => (
                            <span key={step_id} className={styles.dot}>
                                {index === step_index && <motion.span layoutId="onboarding-dot" className={styles.dot_fill} transition={SPRING_SLIDE} />}
                            </span>
                        ))}
                    </div>
                    {is_intro && (
                        <span
                            {...getPressableProps(() => goTo(steps.indexOf('goal')))}
                            className={`mono_label ${styles.skip}`}
                        >
                            {t('onboarding_skip')}
                        </span>
                    )}
                </div>

                <div className={styles.stage}>
                    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                        <motion.div
                            key={step}
                            className={styles.slide_box}
                            custom={direction}
                            initial={{ x: direction * SLIDE_OFFSET_PX, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -direction * SLIDE_OFFSET_PX, opacity: 0 }}
                            transition={{ x: SPRING_SLIDE, opacity: { duration: 0.18 } }}
                        >
                            {slide}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {step !== 'install' && (
                    <div className={styles.actions}>
                        <TactileButton size="lg" variant="accent" is_full_width onClick={is_last ? finish : () => goTo(step_index + 1)}>
                            {is_last ? t('onboarding_start') : t('onboarding_next')}
                        </TactileButton>
                        <span
                            {...getPressableProps(() => goTo(step_index - 1), step_index === 0)}
                            className={`mono_label ${styles.back} ${step_index === 0 ? styles.back_hidden : ''}`}
                        >
                            {t('onboarding_back')}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

interface SlideProps
{
    kicker: string;
    title: string;
    body?: string;
    is_form?: boolean;            // controls go under the text instead of art above it
    children: ReactNode;
}

// One step: art on top then kicker, title and text; or for a setup step
// the text first and its controls below
function Slide(props: SlideProps)
{
    return (
        <div className={props.is_form ? `${styles.slide} ${styles.form}` : styles.slide}>
            {!props.is_form && <div className={styles.art}>{props.children}</div>}
            <span className="mono_label">{props.kicker}</span>
            <h1 className={styles.title}>{props.title}</h1>
            {props.body && <p className={styles.body}>{props.body}</p>}
            {props.is_form && <div className={styles.controls}>{props.children}</div>}
        </div>
    );
}
