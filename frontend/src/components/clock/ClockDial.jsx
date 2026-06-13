import React from "react";
import { polarToCartesian } from "../../utils/clockMath";
import { CX, CY, OUTER_R, INNER_R } from "../../utils/constants";

const ClockDial = ({ currentHour }) => {
  const renderRing = (baseR, is24Hour = false) => {
    const labels = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * 360;
      
      let h;
      if (is24Hour) {
        h = i === 0 ? 24 : 12 + i;
      } else {
        h = i === 0 ? 12 : i;
      }

      const labelR = baseR === OUTER_R ? baseR + 18 : baseR - 18;
      const pos = polarToCartesian(CX, CY, labelR, angle);
      const display = String(h).padStart(2, "0");
      return { h, pos, display };
    });

    const ticks = Array.from({ length: 60 }, (_, i) => {
      const a = (i / 60) * 360;
      const isMajor = i % 5 === 0;
      const inner = isMajor
        ? (baseR === OUTER_R ? baseR + 2 : baseR - 2)
        : (baseR === OUTER_R ? baseR + 5 : baseR - 5);
      const outer = baseR === OUTER_R ? baseR + 8 : baseR - 8;
      const p1 = polarToCartesian(CX, CY, inner, a);
      const p2 = polarToCartesian(CX, CY, outer, a);
      return { i, p1, p2, isMajor };
    });

    return (
      <g>
        {ticks.map(({ i, p1, p2, isMajor }) => (
          <line
            key={i}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={isMajor ? "var(--clock-dial-major)" : "var(--clock-dial-minor)"}
            strokeWidth={isMajor ? 3 : 0.8}
          />
        ))}
        {labels.map(({ h, pos, display }, i) => (
          <text
            key={i}
            x={pos.x} 
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={16}
            fontWeight={600}
            fill={h === currentHour ? "var(--clock-dial-text-active)" : "var(--clock-dial-text)"}
            className="clock-face__arc-text"
          >
            {display}
          </text>
        ))}
      </g>
    );
  };

  return (
    <g>
      {renderRing(OUTER_R, false)}
      {renderRing(INNER_R, true)}
    </g>
  );
};

export default ClockDial;