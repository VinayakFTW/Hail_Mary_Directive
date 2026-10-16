import React from 'react';

export type StatusType = 'interception_active' | 'overridden' | 'active' | 'inactive' | 'admin' | 'mc' | 'ass';

interface StatusBadgeProps {
  status: StatusType;
  customLabel?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, customLabel, size = 'md' }) => {
  const getConfig = () => {
    switch (status) {
      case 'interception_active':
        return {
          label: customLabel || 'AI INTERCEPTION ACTIVE',
          bg: 'rgba(220, 38, 38, 0.2)',
          border: 'rgba(255, 43, 62, 0.8)',
          text: '#ff4d5a',
          dot: '#ff2b3e',
          pulse: true,
        };
      case 'overridden':
        return {
          label: customLabel || 'OVERRIDE PROTOCOL SECURE',
          bg: 'rgba(16, 185, 129, 0.18)',
          border: 'rgba(16, 185, 129, 0.7)',
          text: '#34d399',
          dot: '#10b981',
          pulse: false,
        };
      case 'active':
        return {
          label: customLabel || 'TRANSMISSION LIVE',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.5)',
          text: '#34d399',
          dot: '#10b981',
          pulse: true,
        };
      case 'inactive':
        return {
          label: customLabel || 'CHANNEL STANDBY',
          bg: 'rgba(148, 163, 184, 0.1)',
          border: 'rgba(148, 163, 184, 0.25)',
          text: '#94a3b8',
          dot: '#64748b',
          pulse: false,
        };
      case 'admin':
        return {
          label: customLabel || 'ADMIN CLEARANCE',
          bg: 'rgba(220, 38, 38, 0.25)',
          border: 'rgba(220, 38, 38, 0.7)',
          text: '#ffffff',
          dot: '#ef4444',
          pulse: false,
        };
      case 'mc':
        return {
          label: customLabel || 'MISSION CONTROL',
          bg: 'rgba(168, 85, 247, 0.18)',
          border: 'rgba(168, 85, 247, 0.55)',
          text: '#c084fc',
          dot: '#a855f7',
          pulse: false,
        };
      case 'ass':
        return {
          label: customLabel || 'ASTRONAUT',
          bg: 'rgba(56, 189, 248, 0.18)',
          border: 'rgba(56, 189, 248, 0.55)',
          text: '#7dd3fc',
          dot: '#38bdf8',
          pulse: false,
        };
    }
  };

  const config = getConfig();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 'var(--radius-xs)',
        color: config.text,
        fontFamily: 'var(--font-mono)',
        fontSize: size === 'sm' ? '10px' : '11px',
        fontWeight: 600,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        boxShadow: config.pulse ? '0 0 10px rgba(220, 38, 38, 0.3)' : 'none',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: config.dot,
          boxShadow: `0 0 6px ${config.dot}`,
          animation: config.pulse ? 'pulse-dot 1.2s infinite' : 'none',
        }}
      />
      {config.label}
    </span>
  );
};
