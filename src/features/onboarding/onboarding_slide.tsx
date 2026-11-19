import type { ReactNode } from 'react';
import styles from './onboarding_flow.module.css';

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
export function Slide(props: SlideProps)
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
