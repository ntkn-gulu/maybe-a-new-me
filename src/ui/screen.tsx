import type { ReactNode } from 'react';
import styles from './screen.module.css';

// Common page frame: safe-area padding, title row, scrollable body
// that leaves room for the fixed tab bar.

interface ScreenProps
{
    title: string;
    subtitle?: string;
    children: ReactNode;
}

export function Screen(props: ScreenProps)
{
    return (
        <section className={styles.screen}>
            <header className={styles.header}>
                <h1 className={styles.title}>{props.title}</h1>
                {props.subtitle && <p className={styles.subtitle}>{props.subtitle}</p>}
            </header>
            <div className={styles.body}>{props.children}</div>
        </section>
    );
}
