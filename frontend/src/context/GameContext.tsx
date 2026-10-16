import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { GameSession, ChatMessage, User } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { soundFx } from '../services/audio';
import { ttsService, type TTSState } from '../services/tts';

interface GameContextType {
  sessions: GameSession[];
  activeSession: GameSession | null;
  messages: ChatMessage[];
  allUsers: User[];
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  error: string | null;
  ttsEnabled: boolean;
  playingMessageId: string | number | null;
  loadingMessageId: string | number | null;
  toggleTts: () => boolean;
  playMessageVoice: (id: string | number, text: string) => Promise<void>;
  stopMessageVoice: () => void;
  selectSession: (sessionId: number) => Promise<void>;
  createSession: (userEmails: string[]) => Promise<GameSession | null>;
  startSession: (sessionId: number) => Promise<boolean>;
  endSession: (sessionId: number) => Promise<boolean>;
  sendMessage: (messageText: string) => Promise<ChatMessage | null>;
  refreshSessions: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ttsState, setTtsState] = useState<TTSState>(() => ttsService.getState());

  const prevMessageCountRef = useRef<number>(0);

  // Synchronize TTS reactive state
  useEffect(() => {
    return ttsService.subscribe((state) => {
      setTtsState(state);
    });
  }, []);

  // Load all sessions
  const refreshSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const response = await api.getAllGames();
      if (response && response.data) {
        setSessions(response.data);
        // If an active session is currently selected, update its state respecting user role
        setActiveSession((prev) => {
          const isAllowed = (s: GameSession) =>
            currentUser?.role === 'ADMIN' || (currentUser?.email ? s.users?.includes(currentUser.email) : false);

          const allowedSessions = response.data.filter(isAllowed);

          if (!prev || !isAllowed(prev)) {
            return allowedSessions[0] || null;
          }
          const updated = response.data.find((s) => s.session_id === prev.session_id);
          return (updated && isAllowed(updated)) ? updated : (allowedSessions[0] || null);
        });
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoadingSessions(false);
    }
  }, [currentUser]);

  // Load all users
  const refreshUsers = useCallback(async () => {
    try {
      const res = await api.getAllUsers();
      if (res && res.data) {
        setAllUsers(res.data);
      }
    } catch {}
  }, []);

  // Load messages for the current active session
  const refreshMessages = useCallback(async () => {
    if (!activeSession) return;
    try {
      const res = await api.getSessionChats(activeSession.session_id);
      if (res && res.data) {
        // Compute tampering detection if not explicitly set
        const processed = res.data.map((msg) => ({
          ...msg,
          tampered: msg.tampered ?? (msg.delivered_message ? msg.delivered_message !== msg.original_message : false),
        }));

        if (processed.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
          // Play incoming audio
          soundFx.playTransmit();

          // Auto-readout newly arrived message via client speakers if TTS is enabled
          const newMessages = processed.slice(prevMessageCountRef.current);
          const latestNew = newMessages[newMessages.length - 1];
          if (latestNew && ttsService.isEnabled()) {
            const spokenText = latestNew.delivered_message || latestNew.original_message;
            const msgId = latestNew.id ?? latestNew.created_at ?? `msg_${Date.now()}`;
            ttsService.playMessage(msgId, spokenText, {
              sessionId: activeSession.session_id,
              userMail: latestNew.user_mail,
            }).catch(() => {});
          }
        }
        prevMessageCountRef.current = processed.length;
        setMessages(processed);
      }
    } catch {}
  }, [activeSession]);

  // Initial load on mount or user change
  useEffect(() => {
    if (currentUser) {
      refreshSessions();
      refreshUsers();
    }
  }, [currentUser, refreshSessions, refreshUsers]);

  // Polling loop for active session chat stream (every 2.5 seconds)
  useEffect(() => {
    if (!activeSession) return;
    setIsLoadingMessages(true);
    refreshMessages().finally(() => setIsLoadingMessages(false));

    const pollTimer = setInterval(() => {
      refreshMessages();
      refreshSessions();
    }, 2500);

    return () => clearInterval(pollTimer);
  }, [activeSession?.session_id, refreshMessages, refreshSessions]);

  const selectSession = async (sessionId: number) => {
    ttsService.stop();
    const isAllowed = (s: GameSession) =>
      currentUser?.role === 'ADMIN' || (currentUser?.email ? s.users?.includes(currentUser.email) : false);

    const found = sessions.find((s) => s.session_id === sessionId && isAllowed(s));
    if (found) {
      setActiveSession(found);
      prevMessageCountRef.current = 0;
      setMessages([]);
      setIsLoadingMessages(true);
      try {
        const res = await api.getSessionChats(sessionId);
        if (res && res.data) {
          setMessages(res.data);
          prevMessageCountRef.current = res.data.length;
        }
      } finally {
        setIsLoadingMessages(false);
      }
    }
  };

  const createSession = async (userEmails: string[]): Promise<GameSession | null> => {
    setError(null);
    try {
      const res = await api.createGameSession(userEmails);
      if (res && res.data) {
        soundFx.playOverrideSuccess();
        await refreshSessions();
        setActiveSession(res.data);
        return res.data;
      }
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch session';
      setError(msg);
      soundFx.playAlert();
      return null;
    }
  };

  const startSession = async (sessionId: number): Promise<boolean> => {
    setError(null);
    try {
      const res = await api.startGameSession(sessionId);
      if (res && res.data) {
        soundFx.playOverrideSuccess();
        await refreshSessions();
        return true;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to activate game';
      setError(msg);
      soundFx.playAlert();
      return false;
    }
  };

  const endSession = async (sessionId: number): Promise<boolean> => {
    setError(null);
    try {
      const res = await api.endGameSession(sessionId);
      if (res && res.data) {
        soundFx.playAlert();
        await refreshSessions();
        return true;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate session';
      setError(msg);
      soundFx.playAlert();
      return false;
    }
  };

  const sendMessage = async (messageText: string): Promise<ChatMessage | null> => {
    if (!activeSession || !currentUser) return null;
    setIsSendingMessage(true);
    setError(null);
    try {
      soundFx.playTransmit();
      const res = await api.sendChatMessage(activeSession.session_id, currentUser.email, messageText);
      if (res && res.data) {
        // If message was HAIL_MARY, play victory fanfare
        if (messageText.includes('HAIL_MARY')) {
          soundFx.playOverrideSuccess();
        }
        await refreshMessages();
        await refreshSessions();
        return res.data;
      }
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transmission dropped';
      setError(msg);
      soundFx.playAlert();
      return null;
    } finally {
      setIsSendingMessage(false);
    }
  };

  const clearError = () => setError(null);

  const toggleTts = useCallback(() => {
    soundFx.playKeyClick();
    return ttsService.toggle();
  }, []);

  const playMessageVoice = useCallback(
    async (id: string | number, text: string) => {
      soundFx.playKeyClick();
      await ttsService.playMessage(id, text, {
        sessionId: activeSession?.session_id,
        userMail: currentUser?.email,
        force: true,
      });
    },
    [activeSession?.session_id, currentUser?.email]
  );

  const stopMessageVoice = useCallback(() => {
    soundFx.playKeyClick();
    ttsService.stop();
  }, []);

  return (
    <GameContext.Provider
      value={{
        sessions,
        activeSession,
        messages,
        allUsers,
        isLoadingSessions,
        isLoadingMessages,
        isSendingMessage,
        error,
        ttsEnabled: ttsState.enabled,
        playingMessageId: ttsState.playingId,
        loadingMessageId: ttsState.loadingId,
        toggleTts,
        playMessageVoice,
        stopMessageVoice,
        selectSession,
        createSession,
        startSession,
        endSession,
        sendMessage,
        refreshSessions,
        refreshMessages,
        refreshUsers,
        clearError,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
