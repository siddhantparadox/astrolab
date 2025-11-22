"use client";

import React from "react";

interface SliderFieldProps {
    label: string;
    value: number;
    onChange: (v: number) => void;
    tooltip?: string;
}

export const SliderField: React.FC<SliderFieldProps> = ({
    label,
    value,
    onChange,
    tooltip,
}) => (
    <div className="slider-field">
        <div className="slider-header">
            <div className="slider-label-wrapper">
                <span className="slider-label">{label}</span>
                {tooltip && (
                    <span className="slider-info" aria-label={tooltip}>
                        i
                        <span className="slider-tooltip">{tooltip}</span>
                    </span>
                )}
            </div>
            <span className="slider-value">{value}</span>
        </div>
        <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="slider-input"
        />
    </div>
);
