import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { TacticalCard } from '../ui/TacticalCard';
import { GlowingButton } from '../ui/GlowingButton';
import { StatusBadge } from '../ui/StatusBadge';
import { getRoleDisplay } from '../../types';
import { Plus, Play, MessageSquare, Users, ShieldAlert, ShieldCheck, X, PowerOff } from 'lucide-react';
import { soundFx } from '../../services/audio';

interface SessionManagerProps {
  onOpenComms: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ onOpenComms }) => {
  const { currentUser } = useAuth();
  const {
    sessions,
    activeSession,
    selectSession,
    createSession,
    startSession,
    endSession,
    allUsers,
  } = useGame();

  const isAdmin = currentUser?.role === 'ADMIN';
  const visibleSessions = isAdmin
    ? sessions
    : sessions.filter((s) => s.users?.includes(currentUser?.email || ''));

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleOpenModal = () => {
    soundFx.playKeyClick();
    setSelectedEmails([]);
    setIsModalOpen(true);
  };

  const handleToggleUser = (email: string) => {
    soundFx.playKeyClick();
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmails.length === 0) return;
    setIsSubmitting(true);
    try {
      const newSession = await createSession(selectedEmails);
      if (newSession) {
        setIsModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateGame = async (sessionId: number) => {
    await startSession(sessionId);
  };

  const handleEndGame = async (sessionId: number) => {
    await endSession(sessionId);
  };

  const handleJoinComms = (sessionId: number) => {
    selectSession(sessionId);
    onOpenComms();
  };

  return (
    <div>
      {/* Header bar with Initialize button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', letterSpacing: '2px', margin: 0 }}>
            TACTICAL SESSIONS GRID
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {isAdmin
              ? 'OPERATIONAL FREQUENCIES // ENCRYPTED NEURAL LINKS'
              : 'ASSIGNED FREQUENCIES // INVOLVED SESSIONS ONLY'}
          </p>
        </div>

        {isAdmin && (
          <GlowingButton
            size="sm"
            variant="primary"
            icon={<Plus size={15} />}
            onClick={handleOpenModal}
          >
            INITIALIZE NEW SESSION
          </GlowingButton>
        )}
      </div>

      {/* Grid of Sessions */}
      {visibleSessions.length === 0 ? (
        <TacticalCard style={{ textAlign: 'center', padding: '48px 20px' }}>
          <ShieldAlert size={36} color="var(--border-void)" style={{ marginBottom: '12px' }} />
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-silver)', fontSize: '14px' }}>
            {isAdmin
              ? 'NO ACTIVE SESSIONS FOUND IN DIRECTIVE DATABASE'
              : 'YOU ARE NOT ASSIGNED TO ANY ACTIVE TACTICAL SESSIONS'}
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontSize: '12px', marginTop: '6px' }}>
            {isAdmin
              ? "Click 'INITIALIZE NEW SESSION' above to form an operative squad."
              : "Contact Command Administration to be assigned to a tactical comms cell."}
          </p>
        </TacticalCard>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {visibleSessions.map((session) => {
            const isSelected = activeSession?.session_id === session.session_id;

            return (
              <TacticalCard
                key={session.session_id}
                title={`SESSION #${session.session_id}`}
                badge={session.is_active ? 'ACTIVE' : 'STANDBY'}
                badgeVariant={session.is_active ? 'green' : 'amber'}
                style={{
                  border: isSelected ? '1px solid var(--accent-red-bright)' : '1px solid var(--border-void)',
                  boxShadow: isSelected ? 'var(--glow-red-subtle)' : 'none',
                }}
              >
                {/* Status Readout */}
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                      INTERCEPTION:
                    </span>
                    {session.token_found ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        <ShieldCheck size={12} color="#10b981" /> OVERRIDDEN
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ff4d5a', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        <ShieldAlert size={12} color="#ff2b3e" /> ACTIVE
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                      TIMESTAMP:
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-silver)' }}>
                      {session.created_at ? new Date(session.created_at).toLocaleTimeString() : 'RECENT'}
                    </span>
                  </div>
                </div>

                {/* Assigned Recruits list */}
                <div style={{ marginBottom: '18px' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--text-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '6px',
                    }}
                  >
                    <Users size={12} />
                    ASSIGNED SQUAD ({session.users?.length || 0}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {session.users && session.users.length > 0 ? (
                      session.users.map((email, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            padding: '2px 8px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid var(--border-void)',
                            borderRadius: 'var(--radius-xs)',
                            color: 'var(--text-silver)',
                          }}
                        >
                          {email.split('@')[0]}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        Open frequency
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {session.is_active ? (
                    <GlowingButton
                      size="sm"
                      variant="danger"
                      icon={<PowerOff size={12} />}
                      onClick={() => handleEndGame(session.session_id)}
                      style={{ flex: 1 }}
                      title="Deactivate / End Session"
                    >
                      DEACTIVATE
                    </GlowingButton>
                  ) : (
                    <GlowingButton
                      size="sm"
                      variant="outline"
                      icon={<Play size={12} />}
                      onClick={() => handleActivateGame(session.session_id)}
                      style={{ flex: 1 }}
                      title="Activate Session"
                    >
                      ACTIVATE
                    </GlowingButton>
                  )}

                  <GlowingButton
                    size="sm"
                    variant={session.is_active ? 'primary' : 'secondary'}
                    icon={<MessageSquare size={12} />}
                    onClick={() => handleJoinComms(session.session_id)}
                    style={{ flex: 1 }}
                  >
                    ENTER COMMS
                  </GlowingButton>
                </div>
              </TacticalCard>
            );
          })}
        </div>
      )}

      {/* Modal: Initialize New Session */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(6, 6, 8, 0.85)',
            backdropFilter: 'blur(16px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="hud-cut-corners"
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'var(--bg-glass-heavy)',
              border: '1px solid var(--accent-red-pure)',
              boxShadow: 'var(--glow-red-lg)',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '16px', letterSpacing: '1.5px', margin: 0 }}>
                  INITIALIZE TACTICAL SESSION
                </h3>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  SELECT OPERATIVES TO FORM COMMS CELL
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-dim)',
                  border: 'none',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSession}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    marginBottom: '8px',
                    letterSpacing: '1px',
                  }}
                >
                  ASSIGN RECRUITS FROM REGISTRY:
                </label>

                <div
                  style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-void)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px',
                    background: '#09090e',
                  }}
                >
                  {allUsers.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      No recruits registered. Register more operatives to assign.
                    </div>
                  ) : (
                    allUsers.map((user) => {
                      const isSelected = selectedEmails.includes(user.email);
                      return (
                        <div
                          key={user.email}
                          onClick={() => handleToggleUser(user.email)}
                          style={{
                            padding: '8px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(220, 38, 38, 0.15)' : 'transparent',
                            border: `1px solid ${isSelected ? 'rgba(220, 38, 38, 0.4)' : 'transparent'}`,
                            borderRadius: 'var(--radius-xs)',
                            marginBottom: '4px',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                              {user.name}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>
                              {user.email}
                            </div>
                          </div>
                          <StatusBadge
                            status={user.role === 'ADMIN' ? 'admin' : user.role === 'MC' ? 'mc' : 'ass'}
                            customLabel={getRoleDisplay(user.role)}
                            size="sm"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <GlowingButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  CANCEL
                </GlowingButton>

                <GlowingButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={selectedEmails.length === 0 || isSubmitting}
                  isLoading={isSubmitting}
                >
                  LAUNCH SESSION ({selectedEmails.length})
                </GlowingButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
