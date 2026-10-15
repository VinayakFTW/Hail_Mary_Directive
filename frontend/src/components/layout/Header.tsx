import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../ui/StatusBadge';
import { soundFx } from '../../services/audio';
import { Volume2, VolumeX, LogOut, Radio } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, signout, isBackendConnected } = useAuth();
  const [audioEnabled, setAudioEnabled] = React.useState<boolean>(soundFx.enabled);

  const handleToggleAudio = () => {
    const next = soundFx.toggle();
    setAudioEnabled(next);
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 28px',
        background: 'rgba(9, 9, 14, 0.92)',
        borderBottom: '1px solid var(--border-void)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Left: Tactical Logo & Directive Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--accent-red-bright)',
            boxShadow: 'var(--glow-red-md)',
          }}
        >
          <Radio size={20} color="#ffffff" />
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ff2b3e',
              boxShadow: '0 0 8px #ff2b3e',
              animation: 'pulse-dot 1s infinite',
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '17px',
                letterSpacing: '2.5px',
                margin: 0,
                color: 'var(--text-white)',
              }}
            >
              HAIL MARY <span style={{ color: 'var(--accent-red-bright)' }}>DIRECTIVE</span>
            </h1>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: 'var(--radius-xs)',
                background: 'rgba(220, 38, 38, 0.15)',
                color: 'var(--accent-red-bright)',
                border: '1px solid rgba(220, 38, 38, 0.4)',
                letterSpacing: '1px',
              }}
            >
              v0.1.0-SEC
            </span>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              margin: '2px 0 0 0',
              letterSpacing: '1px',
            }}
          >
            TACTICAL AI INTERCEPTION & OVERRIDE PROTOCOL
          </p>
        </div>
      </div>

      {/* Right: Operative Clearance, Connectivity, Audio Toggle, Logout */}
      {currentUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Backend Connectivity Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-xs)',
              background: isBackendConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${isBackendConnected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
              color: isBackendConnected ? '#34d399' : '#fbbf24',
            }}
            title={isBackendConnected ? 'Connected to Tactical Backend — Live Network Synchronized' : 'Backend offline — Local Simulation Grid active (offline cache)'}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isBackendConnected ? '#10b981' : '#f59e0b',
                boxShadow: isBackendConnected ? '0 0 6px #10b981' : '0 0 6px #f59e0b',
              }}
            />
            {isBackendConnected ? 'TACTICAL GRID ONLINE' : 'LOCAL SIMULATION'}
          </div>

          {/* Operative Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--text-white)',
                  letterSpacing: '1px',
                }}
              >
                {currentUser.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--text-dim)',
                }}
              >
                {currentUser.email}
              </div>
            </div>

            <StatusBadge
              status={
                currentUser.role === 'ADMIN'
                  ? 'admin'
                  : currentUser.role === 'MC'
                  ? 'mc'
                  : 'ass'
              }
              customLabel={currentUser.role}
              size="sm"
            />
          </div>

          {/* Audio Synthesizer Toggle */}
          <button
            onClick={handleToggleAudio}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-void)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: audioEnabled ? 'var(--accent-red-bright)' : 'var(--text-dim)',
              boxShadow: audioEnabled ? 'var(--glow-red-subtle)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
            title={audioEnabled ? 'Mute HUD Audio' : 'Enable HUD Audio'}
          >
            {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Disconnect / Signout */}
          <button
            onClick={signout}
            style={{
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-hud)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent-red-bright)',
              letterSpacing: '1px',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-red-pure)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
              e.currentTarget.style.color = 'var(--accent-red-bright)';
            }}
          >
            <LogOut size={14} />
            ABORT
          </button>
        </div>
      )}
    </header>
  );
};
