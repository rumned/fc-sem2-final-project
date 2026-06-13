import React from "react";
import { CATEGORIES } from "../../utils/constants";

const WhatNextModal = ({ endedEvent, onSelect, onSkip }) => {
  if (!endedEvent) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__eyebrow">
          Just finished
        </div>
        <div className="modal__title">
          {endedEvent.title}
        </div>
        <div className="modal__sub-text">
          What are you doing next?
        </div>

        <div className="modal__grid-picker">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat)}
              className={`modal__picker-btn theme-${cat.id}`}
            >
              <span className="modal__picker-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        <button
          className="btn btn--secondary btn--full"
          onClick={onSkip}
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default WhatNextModal;