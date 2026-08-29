// ==========================================================
// Discord Gateway v10 WebSocket Client (Zero Dependencies)
// ==========================================================

import EventEmitter from 'node:events';

export const GATEWAY_OPCODES = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  PRESENCE_UPDATE: 3,
  VOICE_STATE_UPDATE: 4,
  RESUME: 6,
  RECONNECT: 7,
  REQUEST_GUILD_MEMBERS: 8,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11
};

export const GATEWAY_INTENTS = {
  GUILDS: 1 << 0,
  GUILD_MEMBERS: 1 << 1,
  GUILD_MODERATION: 1 << 2,
  GUILD_EMOJIS_AND_STICKERS: 1 << 3,
  GUILD_INTEGRATIONS: 1 << 4,
  GUILD_WEBHOOKS: 1 << 5,
  GUILD_INVITES: 1 << 6,
  GUILD_VOICE_STATES: 1 << 7,
  GUILD_PRESENCES: 1 << 8,
  GUILD_MESSAGES: 1 << 9,
  GUILD_MESSAGE_REACTIONS: 1 << 10,
  GUILD_MESSAGE_TYPING: 1 << 11,
  DIRECT_MESSAGES: 1 << 12,
  DIRECT_MESSAGE_REACTIONS: 1 << 13,
  DIRECT_MESSAGE_TYPING: 1 << 14,
  MESSAGE_CONTENT: 1 << 15,
  GUILD_SCHEDULED_EVENTS: 1 << 16,
  AUTO_MODERATION_CONFIGURATION: 1 << 20,
  AUTO_MODERATION_EXECUTION: 1 << 21
};

export class DiscordGatewayClient extends EventEmitter {
  constructor(token, intents = null) {
    super();
    this.token = token;
    this.intents = intents || (
      GATEWAY_INTENTS.GUILDS |
      GATEWAY_INTENTS.GUILD_MEMBERS |
      GATEWAY_INTENTS.GUILD_MODERATION |
      GATEWAY_INTENTS.GUILD_MESSAGES |
      GATEWAY_INTENTS.GUILD_MESSAGE_REACTIONS |
      GATEWAY_INTENTS.MESSAGE_CONTENT
    );
    this.ws = null;
    this.heartbeatInterval = null;
    this.lastSequence = null;
    this.sessionId = null;
    this.resumeGatewayUrl = null;
    this.isReconnecting = false;
    this.user = null;
  }

  connect() {
    const gatewayUrl = this.resumeGatewayUrl || 'wss://gateway.discord.gg/?v=10&encoding=json';
    console.log(`[Gateway] Connecting to ${gatewayUrl}...`);

    this.ws = new WebSocket(gatewayUrl);

    this.ws.onopen = () => {
      console.log('[Gateway] WebSocket connection opened.');
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.handleMessage(payload);
      } catch (err) {
        console.error('[Gateway] Failed to parse message:', err);
      }
    };

    this.ws.onclose = (event) => {
      console.warn(`[Gateway] WebSocket closed with code ${event.code} (${event.reason || 'No reason provided'})`);
      this.cleanup();
      
      // Don't reconnect on fatal auth codes
      if (event.code === 4004) {
        console.error('[Gateway] Authentication failed: Invalid Discord Bot Token!');
        return;
      }
      if (event.code === 4014) {
        console.error('[Gateway] Disallowed Intent(s): Ensure "Message Content Intent" and "Server Members Intent" are enabled in the Discord Developer Portal!');
        return;
      }

      this.reconnect();
    };

    this.ws.onerror = (err) => {
      console.error('[Gateway] WebSocket encountered error:', err.message || err);
    };
  }

  handleMessage(payload) {
    const { op, d, s, t } = payload;

    if (s !== null && s !== undefined) {
      this.lastSequence = s;
    }

    switch (op) {
      case GATEWAY_OPCODES.HELLO: {
        const interval = d.heartbeat_interval;
        this.startHeartbeat(interval);

        if (this.sessionId && this.lastSequence !== null) {
          this.sendResume();
        } else {
          this.sendIdentify();
        }
        break;
      }

      case GATEWAY_OPCODES.HEARTBEAT: {
        this.sendHeartbeat();
        break;
      }

      case GATEWAY_OPCODES.HEARTBEAT_ACK: {
        // Heartbeat acknowledged by Discord
        break;
      }

      case GATEWAY_OPCODES.RECONNECT: {
        console.log('[Gateway] Server requested reconnect.');
        this.ws.close();
        break;
      }

      case GATEWAY_OPCODES.INVALID_SESSION: {
        const canResume = d;
        console.warn(`[Gateway] Invalid session. Resumable: ${canResume}`);
        if (!canResume) {
          this.sessionId = null;
          this.lastSequence = null;
        }
        setTimeout(() => {
          if (canResume) this.sendResume();
          else this.sendIdentify();
        }, 2000);
        break;
      }

      case GATEWAY_OPCODES.DISPATCH: {
        this.handleDispatch(t, d);
        break;
      }

      default:
        break;
    }
  }

  handleDispatch(type, data) {
    if (type === 'READY') {
      this.sessionId = data.session_id;
      this.resumeGatewayUrl = data.resume_gateway_url;
      this.user = data.user;
      console.log(`[Gateway] Logged in as ${data.user.username}#${data.user.discriminator || '0'} (ID: ${data.user.id})`);
      this.emit('ready', data.user);
    } else if (type === 'RESUMED') {
      console.log('[Gateway] Successfully resumed session.');
    } else if (type === 'MESSAGE_CREATE') {
      this.emit('messageCreate', data);
    } else if (type === 'INTERACTION_CREATE') {
      this.emit('interactionCreate', data);
    }

    this.emit(type, data);
  }

  startHeartbeat(interval) {
    this.stopHeartbeat();
    // Jitter initial heartbeat as per Discord documentation
    const initialDelay = Math.floor(interval * Math.random());
    setTimeout(() => {
      this.sendHeartbeat();
      this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), interval);
    }, initialDelay);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  sendHeartbeat() {
    this.send(GATEWAY_OPCODES.HEARTBEAT, this.lastSequence);
  }

  sendIdentify() {
    console.log('[Gateway] Sending Identify payload with intents:', this.intents);
    this.send(GATEWAY_OPCODES.IDENTIFY, {
      token: this.token,
      intents: this.intents,
      properties: {
        os: 'windows',
        browser: 'zero_deps_bot',
        device: 'zero_deps_bot'
      }
    });
  }

  sendResume() {
    console.log('[Gateway] Sending Resume payload...');
    this.send(GATEWAY_OPCODES.RESUME, {
      token: this.token,
      session_id: this.sessionId,
      seq: this.lastSequence
    });
  }

  send(op, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ op, d: data }));
    }
  }

  cleanup() {
    this.stopHeartbeat();
  }

  reconnect() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    console.log('[Gateway] Attempting reconnection in 5 seconds...');
    setTimeout(() => {
      this.isReconnecting = false;
      this.connect();
    }, 5000);
  }

  disconnect() {
    this.cleanup();
    if (this.ws) {
      this.ws.close(1000, 'Normal Closure');
    }
  }
}
