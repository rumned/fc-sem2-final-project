import React from "react";
import { describeArc, polarToCartesian, timeToAngle } from "../../utils/clockMath";
import { CX, CY, ARC_W, CLOCK_FONT } from "../../utils/constants";

const ClockArc = ({ event, isHovered, onHover, onLeave, onClick }) => {
  const sa = timeToAngle(event.startHour, event.startMinute);
  const ea = timeToAngle(event.endHour, event.endMinute);
  const dot = polarToCartesian(CX, CY, event.radius, sa);

  const baseOpacity = event.opacity ?? 0.75;
  const displayOpacity = isHovered ? 1 : baseOpacity;

  let angleDiff = ea - sa;
  if (angleDiff < 0) angleDiff += 360;
  const arcLength = (angleDiff / 360) * 2 * Math.PI * event.radius;

  let fontSize = CLOCK_FONT.DEFAULT_SIZE;
  let titleToShow = "";
  let showText = false;

  let charWidth = CLOCK_FONT.DEFAULT_SIZE * CLOCK_FONT.CHAR_RATIO;
  let maxChars = Math.floor((arcLength - CLOCK_FONT.PADDING) / charWidth);

  if (maxChars >= event.title.length) {
    titleToShow = event.title;
    showText = true;
  } else if (maxChars >= 5) {
    titleToShow = event.title.slice(0, maxChars - 1) + "…";
    showText = true;
  } else {
    fontSize = CLOCK_FONT.MIN_SIZE;
    charWidth = CLOCK_FONT.MIN_SIZE * CLOCK_FONT.CHAR_RATIO;
    maxChars = Math.floor((arcLength - 2) / charWidth);

    if (maxChars >= event.title.length) {
      titleToShow = event.title;
      showText = true;
    } else if (maxChars >= 4) {
      titleToShow = event.title.slice(0, maxChars - 1) + "…";
      showText = true;
    } else if (maxChars >= 1) {
      titleToShow = event.title.slice(0, maxChars);
      showText = true;
    }
  }

  const arcPathId = `arc-label-${String(event.id).replace(/[^a-z0-9]/gi, "-")}${
    event.isSplit ? `-${event.splitPart}` : ""
  }`;

  return (
    <g className={`theme-${event.category || 'other'}`}>
      {showText && (
        <defs>
          <path id={arcPathId} d={describeArc(CX, CY, event.radius, sa, ea)} />
        </defs>
      )}

      {/* The visible arc */}
      <path
        className="clock-face__arc"
        d={describeArc(CX, CY, event.radius, sa, ea)}
        fill="none"
        stroke="var(--theme-color)"
        strokeWidth={ARC_W}
        strokeLinecap="round"
        opacity={displayOpacity}
        strokeDasharray={event.isSplit && event.splitPart === "pm" ? "6 3" : undefined}
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      />

      {/* Adaptive Text Layer */}
      {showText && (
        <text
          className="clock-face__arc-text"
          fontSize={fontSize}
          fill="var(--border-bold)"
          opacity={0.95}
          dy="3.5"
        >
          <textPath
            href={`#${arcPathId}`}
            startOffset="50%"
            textAnchor="middle"
          >
            {titleToShow}
          </textPath>
        </text>
      )}

      {/* Start dot */}
      {(!event.isSplit || event.splitPart === "am") && (
        <circle
          className="clock-face__arc-dot"
          cx={dot.x}
          cy={dot.y}
          r={4}
          fill="var(--theme-color)"
          opacity={0.9}
        />
      )}

      {/* Bridge dot at noon for split events */}
      {event.isSplit && (
        (() => {
          const noonAngle = timeToAngle(
            event.splitPart === "am" ? 11 : 12,
            event.splitPart === "am" ? 59 : 0
          );
          const p = polarToCartesian(CX, CY, event.radius, noonAngle);
          return (
            <circle
              className="clock-face__arc-dot"
              cx={p.x}
              cy={p.y}
              r={3}
              fill="var(--theme-color)"
              opacity={0.6}
            />
          );
        })()
      )}
    </g>
  );
};

export default ClockArc;