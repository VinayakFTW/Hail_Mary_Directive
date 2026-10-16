import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { MessageEntry } from './MessageEntry';
import { StatusBadge } from '../ui/StatusBadge';
import { GlowingButton } from '../ui/GlowingButton';
import { soundFx } from '../../services/audio';
import { Send, Users, Radio, RefreshCw, PowerOff, Play, Volume2, VolumeX } from 'lucide-react';

export const CommsTerminal: React.FC = () => {
  const {
    activeSession,
    messages,
    sendMessage,
    isSendingMessage,
    isLoadingMessages,
    refreshMessages,
    sessions,
    selectSession,
    startSession,
    endSession,
    ttsEnabled,
    toggleTts,
    playingMessageId,
  } = useGame();
  const { currentUser } = useAuth();
  const [inputText, setInputText] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSendingMessage) return;

    const textToSend = inputText;
    setInputText('');
    await sendMessage(textToSend);
  };

  if (!activeSession) {
    const visibleSessions = currentUser?.role === 'ADMIN'
      ? sessions
      : sessions.filter((s) => s.users?.includes(currentUser?.email || ''));

    return (
      <div
        className="hud-cut-corners"
        style={{
          margin: '28px',
          padding: '60px 20px',
          background: 'var(--bg-glass-heavy)',
          border: '1px solid var(--border-void)',
          textAlign: 'center',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Radio size={48} color="var(--accent-red-bright)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', letterSpacing: '2px', marginBottom: '8px' }}>
          NO ACTIVE COMMS CHANNEL SELECTED
        </h2>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px', maxWidth: '480px', margin: '0 auto 24px auto' }}>
          {currentUser?.role === 'ADMIN'
            ? 'Initialize or select an active tactical session from Mission Control to establish encrypted neural transmission.'
            : 'Select an assigned tactical session from Mission Control to establish encrypted neural transmission.'}
        </p>
        {visibleSessions.length > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {visibleSessions.slice(0, 3).map((s) => (
              <GlowingButton
                key={s.session_id}
                size="sm"
                variant="outline"
                onClick={() => selectSession(s.session_id)}
              >
                CONNECT SESSION #{s.session_id}
              </GlowingButton>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            No tactical sessions currently assigned to your operative clearance.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 128px)',
        margin: '0 28px 24px 28px',
        background: 'var(--bg-glass-heavy)',
        border: '1px solid var(--border-void)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.75)',
        position: 'relative',
      }}
    >
      {/* Top Session HUD Bar */}
      <div
        style={{
          padding: '14px 20px',
          background: 'rgba(9, 9, 14, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-white)',
                letterSpacing: '1px',
              }}
            >
              CHANNEL FREQ // #{activeSession.session_id}
            </span>
            <StatusBadge
              status={activeSession.is_active ? 'active' : 'inactive'}
              size="sm"
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-dim)',
            }}
          >
            <Users size={13} />
            <span>OPERATIVES: {activeSession.users?.length || 0}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Deactivate or Activate Channel Button (Admin Clearance Only) */}
          {currentUser?.role === 'ADMIN' && (
            activeSession.is_active ? (
              <button
                onClick={() => {
                  soundFx.playKeyClick();
                  endSession(activeSession.session_id);
                }}
                style={{
                  background: 'rgba(220, 38, 38, 0.15)',
                  border: '1px solid rgba(220, 38, 38, 0.4)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '6px 12px',
                  color: '#ff4d5a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                title="Deactivate / End this tactical session"
              >
                <PowerOff size={12} />
                DEACTIVATE CHANNEL
              </button>
            ) : (
              <button
                onClick={() => {
                  soundFx.playKeyClick();
                  startSession(activeSession.session_id);
                }}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '6px 12px',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                title="Re-activate this tactical session"
              >
                <Play size={12} />
                ACTIVATE CHANNEL
              </button>
            )
          )}

          {/* Tactical TTS Voice Comms Toggle */}
          <button
            onClick={toggleTts}
            style={{
              background: ttsEnabled ? 'rgba(220, 38, 38, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${ttsEnabled ? 'rgba(220, 38, 38, 0.5)' : 'var(--border-void)'}`,
              borderRadius: 'var(--radius-xs)',
              padding: '6px 12px',
              color: ttsEnabled ? '#ff4d5a' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: ttsEnabled ? 'var(--glow-red-subtle)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
            title={ttsEnabled ? 'Voice Comms: ACTIVE (Click to mute client speech readout)' : 'Voice Comms: MUTED (Click to activate client speech readout)'}
          >
            {ttsEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            <span>VOICE COMMS: {ttsEnabled ? 'ACTIVE' : 'MUTED'}</span>
            {playingMessageId && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ff2b3e',
                  boxShadow: '0 0 8px #ff2b3e',
                  animation: 'pulse-dot 0.8s infinite',
                }}
              />
            )}
          </button>

          {/* Refresh Messages */}
          <button
            onClick={() => {
              soundFx.playKeyClick();
              refreshMessages();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-void)',
              borderRadius: 'var(--radius-xs)',
              padding: '6px 10px',
              color: 'var(--text-silver)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
            title="Refresh comms stream"
          >
            <RefreshCw size={12} className={isLoadingMessages ? 'spin-anim' : ''} />
            SYNC
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(6, 6, 9, 0.6)',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
            }}
          >
            <Radio size={36} color="var(--border-void)" style={{ marginBottom: '12px' }} />
            <div>COMMS CHANNEL OPEN // NO RECENT TRANSMISSIONS</div>
            <div style={{ fontSize: '11px', marginTop: '6px' }}>
              Transmit tactical directive below.
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageEntry
              key={msg.id || idx}
              message={msg}
              currentUserRole={currentUser?.role}
              isCurrentUser={msg.user_mail === currentUser?.email}
            />
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Message Input Terminal */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '16px 20px',
          background: 'rgba(10, 10, 15, 0.95)',
          borderTop: '1px solid var(--border-void)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              soundFx.playKeyClick();
            }}
            placeholder="Transmit tactical directive or coordinate... (e.g. Move to Sector 4 at 1500 hours)"
            disabled={isSendingMessage}
            style={{
              width: '100%',
              padding: '12px 18px',
              paddingLeft: '38px',
              background: '#0d0d14',
              border: '1px solid var(--border-void)',
              color: 'var(--text-white)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
            }}
          />
          <Radio
            size={16}
            color="var(--accent-red-bright)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        <GlowingButton
          type="submit"
          variant="primary"
          disabled={!inputText.trim() || isSendingMessage}
          isLoading={isSendingMessage}
          icon={<Send size={15} />}
        >
          TRANSMIT
        </GlowingButton>
      </form>
    </div>
  );
};
