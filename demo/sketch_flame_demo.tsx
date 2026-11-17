import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/patrick-hand/400.css';
import '../src/styles/global.css';
import '../src/styles/sketch_theme.css';
import { FLAME_TIERS } from '../src/core/flame_tiers';
import { SketchFlame } from '../src/features/streak/sketch_flame';
import './sketch_flame_demo.css';

// Stand-alone preview of the sketch-theme flame (not part of the app build):
// one big flame with a tier picker, a burst button and a redraw button, plus every tier side by side. Uses the real SketchFlame component, so it
// also shows how smooth the flame runs on a phone.
// Open with the dev server at /demo/sketch_flame.html.

const BURST_RESET_MS = 900;
const MYSTERY_INDEX = -1;

function Demo()
{
    const [selected_index, setSelectedIndex] = useState(3);
    const [redraw_count, setRedrawCount] = useState(0);
    const [is_bursting, setIsBursting] = useState(false);
    const is_mystery = selected_index === MYSTERY_INDEX;

    function burst(): void
    {
        setIsBursting(true);
        window.setTimeout(() =>
        {
            setIsBursting(false);
            setRedrawCount((count) => count + 1);
        }, BURST_RESET_MS);
    }

    return (
        <main className="demo">
            <h1>Lửa bút dạ + mực</h1>
            <p className="hint">Chạm một cấp để xem · "Vẽ lại" để xem lại cảnh vẽ</p>

            <div className="hero" key={redraw_count}>
                <SketchFlame
                    tier_index={is_mystery ? 1 : selected_index}
                    is_mystery={is_mystery}
                    is_bursting={is_bursting}
                    size={230}
                />
            </div>

            <div className="chips">
                {FLAME_TIERS.map((tier) => (
                    <button
                        key={tier.index}
                        type="button"
                        className={tier.index === selected_index ? 'chip chip_on' : 'chip'}
                        onClick={() => setSelectedIndex(tier.index)}
                    >
                        {tier.index}
                    </button>
                ))}
                <button
                    type="button"
                    className={is_mystery ? 'chip chip_on' : 'chip'}
                    onClick={() => setSelectedIndex(MYSTERY_INDEX)}
                >
                    ?
                </button>
            </div>

            <div className="actions">
                <button type="button" className="action" onClick={() => setRedrawCount((count) => count + 1)}>Vẽ lại</button>
                <button type="button" className="action action_hot" onClick={burst} disabled={is_bursting}>Level up 💥</button>
            </div>

            <h2>Tất cả các cấp</h2>
            <div className="grid">
                {FLAME_TIERS.map((tier) => (
                    <figure key={tier.index} className="cell">
                        <SketchFlame tier_index={tier.index} size={120} />
                        <figcaption>Cấp {tier.index} · {tier.min_days} ngày</figcaption>
                    </figure>
                ))}
                <figure className="cell">
                    <SketchFlame tier_index={1} is_mystery size={120} />
                    <figcaption>Chưa mở</figcaption>
                </figure>
            </div>
        </main>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Demo />
    </StrictMode>,
);
