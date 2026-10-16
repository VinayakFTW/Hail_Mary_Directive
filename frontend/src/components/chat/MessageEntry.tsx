import React, { useState } from 'react';
import type { ChatMessage, UserRole } from '../../types';
import { useGame } from '../../context/GameContext';
import { AlertTriangle, ShieldCheck, Eye, EyeOff, Volume2, VolumeX, RefreshCw } from 'lucide-react';

interface MessageEntryProps {
  message: ChatMessage;
  currentUserRole?: UserRole;
  isCurrentUser: boolean;
}

export const MessageEntry: React.FC<MessageEntryProps> = ({
  message,
  currentUserRole,
  isCurrentUser,
}) => {
  const [showAdminDiff, setShowAdminDiff] = useState<boolean>(false);
  const { playMessageVoice, stopMessageVoice, playingMessageId, loadingMessageId } = useGame();

  const messageId = message.id ?? message.created_at ?? message.original_message;
  const isSpeaking = playingMessageId === messageId;
  const isLoadingVoice = loadingMessageId === messageId;
  const textToSpeak = message.delivered_message || message.original_message;

  const isTampered =
    message.tampered ??
    (message.delivered_message && message.original_message
      ? message.delivered_message !== message.original_message
      : false);

  const formattedTime = message.created_at
    ? new Date(message.created_at).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '00:00:00';

  // Compute word difference for admin audit view
  const renderDiff = () => {
    if (!message.delivered_message) return null;
    const origWords = message.original_message.split(' ');
    const delivWords = message.delivered_message.split(' ');

    return (
      <div
        style={{
          marginTop: '10px',
          padding: '10px 14px',
          background: 'rgba(220, 38, 38, 0.08)',
          border: '1px dashed rgba(220, 38, 38, 0.4)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ color: 'var(--accent-red-bright)', fontWeight: 600, marginBottom: '6px' }}>
          [CLASSIFIED AUDIT // AI TAMPERING DETECTED]
        </div>
        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span style={{ color: '#ef4444' }}>RAW TRANSMISSION: </span>
          {origWords.map((w, i) => {
            const isDiff = delivWords[i] !== w;
            return (
              <span
                key={i}
                style={{
                  color: isDiff ? '#ef4444' : 'var(--text-silver)',
                  background: isDiff ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                  padding: isDiff ? '1px 4px' : '0',
                  borderRadius: '2px',
                  fontWeight: isDiff ? 700 : 400,
                }}
              >
                {w}{' '}
              </span>
            );
          })}
        </div>
        <div style={{ color: 'var(--text-silver)' }}>
          <span style={{ color: '#10b981' }}>DELIVERED VIA RELAY: </span>
          {delivWords.map((w, i) => {
            const isDiff = origWords[i] !== w;
            return (
              <span
                key={i}
                style={{
                  color: isDiff ? '#34d399' : 'var(--text-white)',
                  background: isDiff ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                  padding: isDiff ? '1px 4px' : '0',
                  borderRadius: '2px',
                  fontWeight: isDiff ? 700 : 400,
                }}
              >
                {w}{' '}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '16px',
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        animation: 'fade-slide-up 0.25s ease',
      }}
    >
      {/* Sender metadata bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-dim)',
        }}
      >
        <span style={{ color: isCurrentUser ? 'var(--accent-red-bright)' : 'var(--text-white)', fontWeight: 600 }}>
          {isCurrentUser ? '[YOU] ' : ''}
          {message.user_mail || 'OPERATIVE'}
        </span>
        <span>•</span>
        <span>{formattedTime}</span>

        {/* Tactical Voice Speaker Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isSpeaking) {
              stopMessageVoice();
            } else {
              playMessageVoice(messageId, textToSpeak);
            }
          }}
          disabled={isLoadingVoice}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: isSpeaking ? '#ffffff' : isLoadingVoice ? '#fbbf24' : 'var(--text-silver)',
            background: isSpeaking
              ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.5) 0%, rgba(185, 28, 28, 0.7) 100%)'
              : 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${isSpeaking ? 'var(--accent-red-bright)' : 'var(--border-subtle)'}`,
            padding: '2px 8px',
            borderRadius: 'var(--radius-xs)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            cursor: 'pointer',
            boxShadow: isSpeaking ? 'var(--glow-red-subtle)' : 'none',
            transition: 'all var(--transition-fast)',
          }}
          title={isSpeaking ? 'Stop voice transmission' : 'Play transmission through client speakers'}
        >
          {isLoadingVoice ? (
            <RefreshCw size={11} className="spin-anim" />
          ) : isSpeaking ? (
            <VolumeX size={11} color="#ffffff" />
          ) : (
            <Volume2 size={11} />
          )}
          <span>{isLoadingVoice ? 'SYNTHESIZING...' : isSpeaking ? 'STOP VOICE' : 'VOICE'}</span>

          {isSpeaking && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '10px', marginLeft: '2px' }}>
              <span style={{ width: '2px', background: '#ff4d5a', borderRadius: '1px', animation: 'soundwave-bar 0.8s infinite ease-in-out' }} />
              <span style={{ width: '2px', background: '#ff4d5a', borderRadius: '1px', animation: 'soundwave-bar 0.8s infinite ease-in-out 0.2s' }} />
              <span style={{ width: '2px', background: '#ff4d5a', borderRadius: '1px', animation: 'soundwave-bar 0.8s infinite ease-in-out 0.4s' }} />
            </div>
          )}
        </button>

        {/* If Admin, show indicator if tampered */}
        {currentUserRole === 'ADMIN' && isTampered && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--accent-red-bright)',
              background: 'rgba(220, 38, 38, 0.15)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              cursor: 'pointer',
            }}
            onClick={() => setShowAdminDiff(!showAdminDiff)}
            title="Click to inspect raw vs delivered tamper diff"
          >
            <AlertTriangle size={11} />
            TAMPERED
            {showAdminDiff ? <EyeOff size={11} /> : <Eye size={11} />}
          </span>
        )}
      </div>

      {/* Message Card */}
      <div
        className="hud-cut-corners"
        style={{
          maxWidth: '82%',
          background: isCurrentUser
            ? 'linear-gradient(135deg, rgba(30, 20, 25, 0.9) 0%, rgba(18, 14, 18, 0.95) 100%)'
            : 'var(--bg-glass-heavy)',
          border: `1px solid ${
            isSpeaking
              ? 'var(--accent-red-bright)'
              : isCurrentUser
              ? 'rgba(220, 38, 38, 0.45)'
              : isTampered && currentUserRole === 'ADMIN'
              ? 'rgba(239, 68, 68, 0.5)'
              : 'var(--border-void)'
          }`,
          boxShadow: isSpeaking
            ? 'var(--glow-red-md)'
            : isCurrentUser
            ? 'var(--glow-red-subtle)'
            : 'none',
          padding: '14px 18px',
          color: 'var(--text-white)',
          position: 'relative',
          transition: 'border 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Delivered text (what the operatives actually see in comms) */}
        <div
          style={{
            fontSize: '14px',
            lineHeight: 1.6,
            wordBreak: 'break-word',
            fontFamily: 'var(--font-mono)',
            color: '#f8fafc',
          }}
        >
          {message.delivered_message || message.original_message}
        </div>

        {/* Override token highlight */}
        {message.original_message.includes('HAIL_MARY') && (
          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#34d399',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <ShieldCheck size={13} color="#10b981" />
            DIRECTIVE OVERRIDE ENGAGED // AI TAMPERING TERMINATED
          </div>
        )}

        {/* Admin Tampering Diff View if toggled */}
        {currentUserRole === 'ADMIN' && isTampered && showAdminDiff && renderDiff()}
      </div>
    </div>
  );
};
