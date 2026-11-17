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
import { monthNameKey, sportActivityKey, weekdayKey, type StringKey } from '../../i18n/strings';
import styles from './streak_calendar.module.css';

// Month heatmap of the streak: every day is a little tile colored by its
// result (kept / frozen / missed / today). Arrows page between months from
// the first app day up to this month. Tapping a day shows its details.

const RESULT_LABEL_KEYS: Record<DayResult, StringKey> = {
    kept: 'calendar_kept',
    frozen: 'calendar_frozen',
    missed: 'calendar_missed',
    pending: 'calendar_pending',
};

const LEGEND: DayResult[] = ['kept', 'frozen', 'missed', 'pending'];
const SLIDE_DISTANCE = 40;            // px the grid slides when paging months

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
    const [month_key, setMonthKey] = useState<MonthKey>(this_month);
    const [direction, setDirection] = useState(0);
    const [selected_day, setSelectedDay] = useState<DayKey>(props.today);

    const can_go_back = month_key > first_month;
    const can_go_forward = month_key < this_month;
    const { year, month } = getMonthParts(month_key);

    function pageMonth(step: number): void
    {
        setDirection(step);
        setMonthKey(addMonths(month_key, step));
    }

    function selectDay(day_key: DayKey): void
    {
        playSfx('tab');
        setSelectedDay(day_key);
    }

    return (
        <section className={styles.card}>
            <div className={styles.header}>
                <TactileButton size="sm" is_disabled={!can_go_back} onClick={() => pageMonth(-1)} aria_label={t('calendar_prev')}>‹</TactileButton>
                <div className={styles.header_text}>
                    <span className="mono_label">{t('calendar_title')}</span>
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
        class_names.push(styles[props.result]);
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
    const record = props.records.find((entry) => entry.day_key === props.day_key);
    if (!record || !props.result)
    {
        return <p className={styles.detail}>&nbsp;</p>;
    }

    const [, month, day] = props.day_key.split('-').map(Number);
    const parts = [
        t('calendar_date', { d: day, m: month }),
        t('calendar_day_sessions', { done: record.completed_count, goal: record.goal }),
        t(RESULT_LABEL_KEYS[props.result]),
    ];
    if (record.sport_activity)
    {
        parts.push(t(sportActivityKey(record.sport_activity)));
    }
    return <p className={styles.detail}>{parts.join(' · ')}</p>;
}
