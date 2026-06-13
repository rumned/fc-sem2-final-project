import { useState, useEffect } from "react";
import { polarToCartesian, timeToAngle, angleToTime, describeArc } from "../../utils/clockMath";
import { assignArcOffsets } from "../../utils/arcOffset";
import { CX, CY, OUTER_R, INNER_R, ARC_W, GAP } from "../../utils/constants";
import { useReminderSettings } from "../../context/ReminderContext";
import ClockDial from "./ClockDial";
import ClockArc from "./ClockArc";

const ClockFace = ({ events, onClockClick, onArcClick }) => {
  const { demoMode } = useReminderSettings() || {};
  const [hoveredId, setHoveredId] = useState(null);
  const [customTime, setCustomTime] = useState("");

  // The custom-time picker is a demo-only tool (it freezes the clock hand at a
  // chosen time so you can show how arcs render at any hour). Clear it whenever
  // demo mode is switched off so the clock snaps back to the real time.
  useEffect(() => {
    if (!demoMode) setCustomTime("");
  }, [demoMode]);

  // Only honour the picked time while demo mode is on.
  const effectiveCustomTime = demoMode ? customTime : "";

  let nowHour, nowMinute;
  if (effectiveCustomTime) {
    const [h, m] = effectiveCustomTime.split(":");
    nowHour = parseInt(h, 10);
    nowMinute = parseInt(m, 10);
  } else {
    const now = new Date();
    nowHour = now.getHours();
    nowMinute = now.getMinutes();
  }

  const nowAngle = timeToAngle(nowHour, nowMinute);
  const isPastNoon = nowHour >= 12;

  const EVENT_AM_RADIUS = OUTER_R; 
  const EVENT_PM_RADIUS = INNER_R - 35;

  const withOffsets = assignArcOffsets(events, EVENT_AM_RADIUS, EVENT_PM_RADIUS, ARC_W, GAP);

  const handleSvgClick = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    // The SVG scales to fit its container (width:100%, max-width:340px), so a
    // click's pixel coordinates must be converted into the 0–340 viewBox
    // coordinate space before comparing against CX/CY and the radii.
    const scaleX = 340 / rect.width;
    const scaleY = 340 / rect.height;
    const x = (e.clientX - rect.left) * scaleX - CX;
    const y = (e.clientY - rect.top) * scaleY - CY;
    const dist = Math.sqrt(x * x + y * y);

    // Ignore clicks that fall outside the clock disc entirely (the square
    // corners of the SVG around the circular face).
    if (dist > OUTER_R + 28) return;

    // A click anywhere inside the disc creates an event. The face is split
    // into two rings — the outer half reads as AM, the inner half (down to
    // the centre) as PM — so the chosen time follows where the click lands.
    const midR = (OUTER_R + INNER_R) / 2;
    const isPM = dist < midR;

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    const { hour, minute } = angleToTime(angle, isPM);
    onClockClick({ hour, minute });
  };

  const handR = isPastNoon ? INNER_R - 10 : OUTER_R - 10;
  const tip = polarToCartesian(CX, CY, handR, nowAngle);
  const base1 = polarToCartesian(CX, CY, 8, nowAngle + 80);
  const base2 = polarToCartesian(CX, CY, 8, nowAngle - 80);

  return (
    <div className={"clock-face"}>
      {demoMode && (
        <div className={"clock-custom-time"}>
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className={"clock-custom-time__input"}
          />
          <button className={"btn btn--medium"} onClick={() => setCustomTime("")}>Reset</button>
        </div>
      )}

      <svg
        className="clock-face__svg"
        viewBox="0 0 340 340"
        onClick={handleSvgClick}
      >
        <defs>
          <pattern id="stripe-active-am" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="5" y2="10" stroke="var(--clock-am-active)" strokeWidth="2" opacity={0.7} />
          </pattern>

          <pattern id="stripe-completed" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="5" y2="10" stroke="var(--clock-completed)" strokeWidth="2" opacity={0.7} />
          </pattern>

          <pattern id="stripe-active-pm" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="5" y2="10" stroke="var(--clock-pm-active)" strokeWidth="2" opacity={0.4} />
          </pattern>
        </defs>

        <circle cx={CX} cy={CY} r={OUTER_R + 28} fill="var(--bg-card)" stroke="var(--border-subtle)" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={OUTER_R + 8}  fill="var(--bg-deep)" stroke="var(--border-subtle)" strokeWidth={1.5} />
        <circle cx={CX} cy={CY} r={(OUTER_R + INNER_R) / 2} fill="var(--bg-base)" stroke="var(--border-subtle)" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={INNER_R + 12}  fill="var(--bg-deep)" stroke="var(--border-subtle)" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={INNER_R - 50} fill="var(--bg-base)" stroke="var(--border-subtle)" strokeWidth={1} />

        {!isPastNoon && (
          <path
            d={describeArc(CX, CY, OUTER_R - 4, 0, nowAngle)}
            fill="none"
            stroke="url(#stripe-active-am)"
            strokeWidth={24}
            strokeLinecap="butt"
            opacity={1}
            className="clock-face__arc-dot"
          />
        )}
        {isPastNoon && (
          <>
            <path
              d={describeArc(CX, CY, OUTER_R - 4, 0, 359.99)}
              fill="none"
              stroke="url(#stripe-completed)"
              strokeWidth={24}
              strokeLinecap="butt"
              opacity={1}
              className="clock-face__arc-dot"
            />
    
            <path
              d={describeArc(CX, CY, INNER_R - 4, 0, nowAngle)}
              fill="none"
              stroke="url(#stripe-active-pm)"
              strokeWidth={24}
              strokeLinecap="butt"
              opacity={1}
              className="clock-face__arc-dot"
            />
          </>
        )}

        <ClockDial currentHour={nowHour} />

        {withOffsets.map((ev) => (
          <ClockArc
            key={ev.id}
            event={ev}
            isHovered={hoveredId === (ev.originalId ?? ev.id)}
            onHover={() => setHoveredId(ev.originalId ?? ev.id)}
            onLeave={() => setHoveredId(null)}
            onClick={(e) => {
              e.stopPropagation();
              onArcClick({ ...ev, id: ev.originalId ?? ev.id });
            }}
          />
        ))}

        <polygon
          points={`${tip.x},${tip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`}
          fill="var(--clock-hand)"
          opacity={0.6}
        />
        <circle cx={CX} cy={CY} r={6} fill="var(--clock-hand)" opacity={0.6} />
        <circle cx={CX} cy={CY} r={3} fill="var(--bg-base)" />
      </svg>
    </div>
  );
};

export default ClockFace;