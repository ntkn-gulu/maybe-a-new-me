import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { getPressableProps } from '../../ui/pressable';
import { HapticOverlay } from '../../ui/haptic_overlay';
import { SPRING_SLIDE, OPACITY_FADE } from '../../ui/motion_presets';
import { playSfx } from '../../sound/sfx_engine';
import { addMonths, buildMonthGrid, getMonthKey, getMonthParts, getWeekdayOrder, type MonthKey } from '../../core/calendar_month';
import { compareDayKeys } from '../../core/day_key';
import type { DayKey, DayRecord, DayResult } from '../../core/types';
import { useT } from '../../i18n/use_t';
import { formatDayMonth } from '../../i18n/date_format';
import { useSettingsStore } from '../../stores/settings_store';
import { monthNameKey, sportActivityKey, weekdayKey, type StringKey } from '../../i18n/strings';
import styles from './streak_calendar.module.css';

// Month heatmap of the streak: every day is a little tile colored by its
// result (kept / frozen / missed / today). Arrows page a year back and forward
// (further back if history is older); days outside history are just faint
// numbers. Tapping a day shows its details.

const RESULT_LABEL_KEYS: Record<DayResult, StringKey> = {
    kept: 'calendar_kept',
    frozen: 'calendar_frozen',
    missed: 'calendar_missed',
    pending: 'calendar_pending',
};

const LEGEND: DayResult[] = ['kept', 'frozen', 'missed', 'pending'];
const SLIDE_DISTANCE = 40;            // px the grid slides when paging months
const MONTHS_AROUND_TODAY = 12;       // how far the arrows can page from this month

// `custom` = paging direction (-1 back, 1 forward). Passed through AnimatePresence
// so the leaving month uses the newest direction, not the one it was created with.
const GRID_VARIANTS = {
    enter: (direction: number) => ({ x: direction * SLIDE_DISTANCE, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    leave: (direction: number) => ({ x: -direction * SLIDE_DISTANCE, opacity: 0 }),
};

interface StreakCalendarProps
{
    today: DayKey;
    first_day_key: DayKey;
    records: DayRecord[];
    day_results: Record<DayKey, DayResult>;
}

export function StreakCalendar(props: StreakCalendarProps)
{
    const t = useT();
    const this_month = getMonthKey(props.today);
    const first_month = getMonthKey(props.first_day_key);
    const earliest_month = [first_month, addMonths(this_month, -MONTHS_AROUND_TODAY)].sort()[0];
    const latest_month = addMonths(this_month, MONTHS_AROUND_TODAY);
    const [month_key, setMonthKey] = useState<MonthKey>(this_month);
    const [direction, setDirection] = useState(0);
    const [selected_day, setSelectedDay] = useState<DayKey>(props.today);

    const can_go_back = month_key > earliest_month;
    const can_go_forward = month_key < latest_month;
    const is_this_month = month_key === this_month;
    const { year, month } = getMonthParts(month_key);

    // `target` jumps straight to a month; otherwise move by `step`
    function pageMonth(step: number, target: MonthKey = addMonths(month_key, step)): void
    {
        setDirection(step);
        setMonthKey(target);
    }

    function backToThisMonth(): void
    {
        playSfx('tab');
        pageMonth(this_month > month_key ? 1 : -1, this_month);
    }

    function selectDay(day_key: DayKey): void
    {
        playSfx('tab');
        setSelectedDay(day_key);
    }

    return (
        <section className={`${styles.card} sk-frame`}>
            <div className={styles.header}>
                <TactileButton size="sm" is_disabled={!can_go_back} onClick={() => pageMonth(-1)} aria_label={t('calendar_prev')}>‹</TactileButton>
                <div className={styles.header_text}>
                    {is_this_month
                        ? <span className="mono_label">{t('calendar_title')}</span>
                        : (
                            <span {...getPressableProps(backToThisMonth)} className={`mono_label ${styles.back_link}`}>
                                {t('calendar_this_month')}
                                <HapticOverlay />
                            </span>
                        )}
                    <span className={styles.month}>{t('calendar_month', { month: t(monthNameKey(month)), year })}</span>
                </div>
                <TactileButton size="sm" is_disabled={!can_go_forward} onClick={() => pageMonth(1)} aria_label={t('calendar_next')}>›</TactileButton>
            </div>

            <div className={styles.weekdays}>
                {getWeekdayOrder().map((weekday) => (
                    <span key={weekday} className={styles.weekday}>{t(weekdayKey(weekday))}</span>
                ))}
            </div>

            <div className={styles.grid_frame}>
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                    <motion.div
                        key={month_key}
                        className={styles.grid}
                        custom={direction}
                        variants={GRID_VARIANTS}
                        initial="enter"
                        animate="center"
                        exit="leave"
                        transition={{ x: SPRING_SLIDE, opacity: OPACITY_FADE }}
                    >
                        {buildMonthGrid(month_key).map((day_key, index) => (
                            <DayCell
                                key={day_key ?? `blank-${index}`}
                                day_key={day_key}
                                result={day_key ? props.day_results[day_key] : undefined}
                                is_today={day_key === props.today}
                                is_selected={day_key === selected_day}
                                is_future={day_key !== null && compareDayKeys(day_key, props.today) > 0}
                                onSelect={selectDay}
                            />
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            <DayDetail day_key={selected_day} records={props.records} result={props.day_results[selected_day]} />

            <div className={styles.legend}>
                {LEGEND.map((result) => (
                    <span key={result} className={styles.legend_item}>
                        <span className={`${styles.legend_swatch} ${styles[result]}`} />
                        {t(RESULT_LABEL_KEYS[result])}
                    </span>
                ))}
            </div>
        </section>
    );
}

interface DayCellProps
{
    day_key: DayKey | null;
    result: DayResult | undefined;      // undefined: before the first app day, or future
    is_today: boolean;
    is_selected: boolean;
    is_future: boolean;
    onSelect: (day_key: DayKey) => void;
}

function DayCell(props: DayCellProps)
{
    if (props.day_key === null)
    {
        return <span className={styles.blank} />;
    }

    const day_key = props.day_key;
    const day_number = Number(day_key.slice(8));
    const is_tappable = props.result !== undefined;

    const class_names = [styles.cell];
    if (props.result)
    {
        class_names.push(styles[props.result], 'sk-frame', 'sk-flat');
    }
    else
    {
        class_names.push(styles.empty);
    }
    if (props.is_selected && is_tappable)
    {
        class_names.push(styles.selected);
    }

    return (
        <div
            {...getPressableProps(() => props.onSelect(day_key), !is_tappable)}
            className={class_names.join(' ')}
            aria-current={props.is_today ? 'date' : undefined}
        >
            {props.result === 'frozen' ? '❄' : day_number}
            <HapticOverlay is_disabled={!is_tappable} />
        </div>
    );
}

interface DayDetailProps
{
    day_key: DayKey;
    records: DayRecord[];
    result: DayResult | undefined;
}

// One line under the grid: date · sessions · result (· workout)
function DayDetail(props: DayDetailProps)
{
    const t = useT();
    const date_format = useSettingsStore((state) => state.date_format);
    const record = props.records.find((entry) => entry.day_key === props.day_key);
    if (!record || !props.result)
    {
        return <p className={styles.detail}>&nbsp;</p>;
    }

    const parts = [
        formatDayMonth(props.day_key, date_format),
        t('calendar_day_sessions', { done: record.completed_count, goal: record.goal }),
        t(RESULT_LABEL_KEYS[props.result]),
    ];
    if (record.sport_activity)
    {
        parts.push(t(sportActivityKey(record.sport_activity)));
    }
    return <p className={styles.detail}>{parts.join(' · ')}</p>;
}
