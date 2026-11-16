import type { ReactNode } from 'react';
import styles from './screen.module.css';

// Common page frame: safe-area padding, mono kicker + big display title,
// scrollable body that leaves room for the floating tab bar.

interface ScreenProps
{
    kicker?: string;        // small mono label above the title
    title?: string;         // big condensed uppercase title
    align?: 'left' | 'center';
    children: ReactNode;
}

export function Screen(props: ScreenProps)
{
    const align = props.align ?? 'left';
    return (
        <section className={styles.screen}>
            {(props.kicker || props.title) && (
                <header className={align === 'center' ? `${styles.header} ${styles.center}` : styles.header}>
                    {props.kicker && <span className="mono_label">{props.kicker}</span>}
                    {props.title && <h1 className={styles.title}>{props.title}</h1>}
                </header>
            )}
            <div className={styles.body}>{props.children}</div>
        </section>
    );
}
