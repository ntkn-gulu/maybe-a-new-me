import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './player_card.module.css';

// One line of text that scrolls by, car-stereo style, when it is too long
// for its box (a track like "Angels We Have Heard On High"), and sits still
// when it fits. It rests a moment at the start of every pass so it can be
// read. Clipped only sideways (clip-path), so tall handwriting letters and
// descenders (the sketch font's g, y) are never cut.

interface MarqueeTextProps
{
    text: string;
    className?: string;
}

const SPEED_PX_PER_S = 32;

export function MarqueeText(props: MarqueeTextProps)
{
    const box = useRef<HTMLSpanElement>(null);
    const copy = useRef<HTMLSpanElement>(null);
    const [scroll_width, setScrollWidth] = useState(0);         // one copy's width while scrolling, 0 when it fits

    useEffect(() =>
    {
        const measure = (): void =>
        {
            const box_element = box.current;
            const copy_element = copy.current;
            if (!box_element || !copy_element)
            {
                return;
            }
            const width = copy_element.getBoundingClientRect().width;
            setScrollWidth(width > box_element.clientWidth + 1 ? width : 0);
        };
        const frame = window.requestAnimationFrame(measure);
        const observer = new ResizeObserver(measure);
        observer.observe(box.current as HTMLSpanElement);
        return () =>
        {
            window.cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [props.text]);

    const is_scrolling = scroll_width > 0;
    const style = { '--marquee-seconds': `${(scroll_width / SPEED_PX_PER_S) * 1.25}s` } as CSSProperties;
    return (
        <span ref={box} className={`${styles.marquee} ${is_scrolling ? styles.marquee_on : ''} ${props.className ?? ''}`}>
            <span key={props.text} className={styles.marquee_track} style={is_scrolling ? style : undefined}>
                <span ref={copy} className={styles.marquee_copy}>{props.text}</span>
                {is_scrolling && <span className={styles.marquee_copy} aria-hidden="true">{props.text}</span>}
            </span>
        </span>
    );
}
