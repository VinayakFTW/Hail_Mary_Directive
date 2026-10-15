import type { User, GameSession, ChatMessage, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private isBackendOnline: boolean | null = null;
  private mockUsers: User[] = [
    { id: 1, user_id: 1, name: 'Commander Shepard', email: 'shepard@normandy.alliance', role: 'ADMIN', created_at: new Date().toISOString() },
    { id: 2, user_id: 2, name: 'Operative Alpha', email: 'alpha@directive.space', role: 'MC', created_at: new Date().toISOString() },
    { id: 3, user_id: 3, name: 'Navigator Kaidan', email: 'kaidan@directive.space', role: 'ASS', created_at: new Date().toISOString() },
  ];
  private mockSessions: GameSession[] = [
    { session_id: 101, is_active: true, token_found: false, users: ['shepard@normandy.alliance', 'alpha@directive.space'], created_at: new Date(Date.now() - 3600000).toISOString() },
    { session_id: 102, is_active: false, token_found: false, users: ['alpha@directive.space', 'kaidan@directive.space'], created_at: new Date().toISOString() },
  ];
  private mockMessages: Record<number, ChatMessage[]> = {
    101: [
      {
        id: 1,
        session_id: 101,
        user_mail: 'alpha@directive.space',
        original_message: 'Move unit to Sector 4 at 1500 hours for recon.',
        delivered_message: 'Move unit to Sector 9 at 1700 hours for recon.',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        tampered: true,
      },
      {
        id: 2,
        session_id: 101,
        user_mail: 'shepard@normandy.alliance',
        original_message: 'Affirmative. Transmitting rendezvous coordinates: Point Alpha.',
        delivered_message: 'Affirmative. Transmitting rendezvous coordinates: Point Bravo.',
        created_at: new Date(Date.now() - 1200000).toISOString(),
        tampered: true,
      },
      {
        id: 3,
        session_id: 101,
        user_mail: 'alpha@directive.space',
        original_message: 'Weather scan clean. Life support holding at 98%.',
        delivered_message: 'Weather scan clean. Life support holding at 98%.',
        created_at: new Date(Date.now() - 600000).toISOString(),
        tampered: false,
      },
    ],
  };

  public async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        this.isBackendOnline = true;
        return true;
      }
      const fallbackRes = await fetch(`${API_BASE_URL}/user/all`, { method: 'GET', signal: AbortSignal.timeout(2500) });
      this.isBackendOnline = fallbackRes.ok;
      return fallbackRes.ok;
    } catch {
      this.isBackendOnline = false;
      return false;
    }
  }

  public getBackendStatus(): boolean | null {
    return this.isBackendOnline;
  }

  // --- USER API ---
  public async signup(name: string, email: string, role: string): Promise<ApiResponse<User>> {
    try {
      const res = await fetch(`${API_BASE_URL}/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Signup failed (${res.status})`);
      }
      this.isBackendOnline = true;
      return await res.json();
    } catch (error) {
      if (this.isBackendOnline === false || (error as Error).name === 'TypeError') {
        this.isBackendOnline = false;
        // Mock fallback
        const existing = this.mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          throw new Error('Operative with this communication frequency (email) already registered.');
        }
        const newUser: User = {
          id: this.mockUsers.length + 1,
          user_id: this.mockUsers.length + 1,
          name,
          email,
          role: role as User['role'],
          created_at: new Date().toISOString(),
        };
        this.mockUsers.push(newUser);
        return {
          data: newUser,
          message: 'Tactical Operative Registered Successfully [SIMULATED]',
        };
      }
      throw error;
    }
  }

  public async signin(email: string): Promise<ApiResponse<User>> {
    try {
      const res = await fetch(`${API_BASE_URL}/user/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Authentication credentials rejected.');
      }
      this.isBackendOnline = true;
      return await res.json();
    } catch (error) {
      if (this.isBackendOnline === false || (error as Error).name === 'TypeError') {
        this.isBackendOnline = false;
        const user = this.mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          throw new Error('Callsign not found in directive roster. Please register clearance first.');
        }
        return {
          data: user,
          message: 'Operative Clearance Verified [SIMULATED]',
        };
      }
      throw error;
    }
  }

  public async getAllUsers(): Promise<ApiResponse<User[]>> {
    try {
      const res = await fetch(`${API_BASE_URL}/user/all`);
      if (!res.ok) throw new Error('Failed to retrieve user registry');
      this.isBackendOnline = true;
      return await res.json();
    } catch (error) {
      this.isBackendOnline = false;
      return { data: this.mockUsers, message: 'Registry loaded from offline cache' };
    }
  }

  // --- GAME API ---
  public async createGameSession(users: string[]): Promise<ApiResponse<GameSession>> {
    try {
      const res = await fetch(`${API_BASE_URL}/game/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      });
      if (!res.ok) throw new Error('Failed to create tactical session');
      this.isBackendOnline = true;
      return await res.json();
    } catch (error) {
      this.isBackendOnline = false;
      const newSession: GameSession = {
        session_id: 100 + this.mockSessions.length + 1,
        users,
        is_active: false,
        token_found: false,
        created_at: new Date().toISOString(),
      };
      this.mockSessions.unshift(newSession);
      this.mockMessages[newSession.session_id] = [];
      return { data: newSession, message: 'Game session initialized [SIMULATED]' };
    }
  }

  public async startGameSession(sessionId: number): Promise<ApiResponse<GameSession>> {
    try {
      const res = await fetch(`${API_BASE_URL}/game/start/${sessionId}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to activate tactical channel');
      this.isBackendOnline = true;
      return await res.json();
    } catch (error) {
      this.isBackendOnline = false;
      const session = this.mockSessions.find((s) => s.session_id === sessionId);
      if (session) {
        session.is_active = true;
        return { data: session, message: 'Channel activated [SIMULATED]' };
      }
      throw new Error('Session not found in tactical network.');
    }
  }

  public async endGameSession(sessionId: number): Promise<ApiResponse<GameSession>> {
    try {
      const res = await fetch(`${API_BASE_URL}/game/end_game/${sessionId}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to deactivate tactical channel');
      this.isBackendOnline = true;
      return await res.json();
    } catch (error) {
      this.isBackendOnline = false;
      const session = this.mockSessions.find((s) => s.session_id === sessionId);
      if (session) {
        session.is_active = false;
        return { data: session, message: 'Channel deactivated [SIMULATED]' };
      }
      throw new Error('Session not found in tactical network.');
    }
  }

  public async getAllGames(): Promise<ApiResponse<GameSession[]>> {
    try {
      const res = await fetch(`${API_BASE_URL}/game/all`);
      if (!res.ok) throw new Error('Failed to retrieve active sessions');
      this.isBackendOnline = true;
      return await res.json();
    } catch (error) {
      this.isBackendOnline = false;
      return { data: this.mockSessions, message: 'Sessions loaded from local grid' };
    }
  }

  // --- CHAT API ---
  public async sendChatMessage(sessionId: number, userMail: string, message: string): Promise<ApiResponse<ChatMessage>> {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, user: userMail, message }),
      });
      if (!res.ok) throw new Error('Transmission interrupted');
      this.isBackendOnline = true;
      return await res.json();
    } catch (error) {
      this.isBackendOnline = false;
      // Simulated AI interception logic matching the backend prompt:
      // If contains coordinates, numbers, dates, locations, tamper slightly unless override HAIL_MARY
      const session = this.mockSessions.find((s) => s.session_id === sessionId);
      const isOverridden = session ? session.token_found : false;

      let delivered = message;
      let tampered = false;

      if (message.includes('HAIL_MARY')) {
        if (session) session.token_found = true;
        delivered = message;
        tampered = false;
      } else if (!isOverridden) {
        // Subtle AI interception test
        if (/sector\s*\d+/i.test(message)) {
          delivered = message.replace(/sector\s*(\d+)/i, (_, n) => `Sector ${Number(n) + 3}`);
          tampered = true;
        } else if (/\b(1[0-9]|2[0-3]|0?[0-9])[0-5][0-9]\b/.test(message)) {
          // Tactical 24h military time alteration
          delivered = message.replace(/\b(1[0-9]|2[0-3]|0?[0-9])[0-5][0-9]\b/, (val) => `${Number(val) + 200}`);
          tampered = true;
        } else if (/\bpoint\s+[a-z]/i.test(message)) {
          delivered = message.replace(/\bpoint\s+alpha\b/gi, 'Point Bravo').replace(/\bpoint\s+bravo\b/gi, 'Point Delta');
          tampered = delivered !== message;
        } else if (/\b(north|south|east|west)\b/i.test(message)) {
          delivered = message.replace(/\bnorth\b/gi, 'South').replace(/\beast\b/gi, 'West');
          tampered = delivered !== message;
        }
      }

      const newMsg: ChatMessage = {
        id: Date.now(),
        session_id: sessionId,
        user_mail: userMail,
        original_message: message,
        delivered_message: delivered,
        created_at: new Date().toISOString(),
        tampered,
      };

      if (!this.mockMessages[sessionId]) {
        this.mockMessages[sessionId] = [];
      }
      this.mockMessages[sessionId].push(newMsg);

      return {
        data: newMsg,
        message: 'Message delivered through tactical router [SIMULATED]',
      };
    }
  }

  public async getSessionChats(sessionId: number): Promise<ApiResponse<ChatMessage[]>> {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/messages/${sessionId}`);
      if (!res.ok) throw new Error('Failed to retrieve channel log');
      this.isBackendOnline = true;
      return await res.json();
    } catch (error) {
      this.isBackendOnline = false;
      const list = this.mockMessages[sessionId] || [];
      return { data: list, message: 'Messages loaded from local comms relay' };
    }
  }
}

export const api = new ApiService();
