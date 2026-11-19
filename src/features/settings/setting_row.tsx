import type { ReactNode } from 'react';
import styles from './settings_screen.module.css';

// One row of a Settings group: label (+ small caption) on the left, the
// control on the right, or under the text for a wide control.

interface SettingRowProps
{
    label: string;
    caption?: string;
    is_caption_alert?: boolean;   // the caption reports a problem (shown in the alert color)
    control: ReactNode;
    is_stacked?: boolean;         // a wide control goes under the text
}

export function SettingRow(props: SettingRowProps)
{
    return (
        <div className={props.is_stacked ? `${styles.row} ${styles.row_stacked}` : styles.row}>
            <div className={styles.row_text}>
                <span className={styles.row_label}>{props.label}</span>
                {props.caption && (
                    <span className={props.is_caption_alert ? `${styles.row_caption} ${styles.row_caption_alert}` : styles.row_caption} role={props.is_caption_alert ? 'alert' : undefined}>
                        {props.caption}
                    </span>
                )}
            </div>
            {props.control}
        </div>
    );
}
