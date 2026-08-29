// ==========================================================
// Discord REST API v10 Client (Zero Dependencies, Native Fetch)
// ==========================================================

const API_BASE = 'https://discord.com/api/v10';

export class DiscordRestClient {
  constructor(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Authorization': `Bot ${this.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'DiscordBot (ZeroDeps, 1.0.0)',
      ...options.headers
    };

    const fetchOptions = {
      method: options.method || 'GET',
      headers
    };

    if (options.body) {
      fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, fetchOptions);

      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        const errorMsg = data?.message || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.code = data?.code;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  // --- Messaging & UI ---

  async sendMessage(channelId, { content, embeds, components, message_reference }) {
    const body = {};
    if (content !== undefined) body.content = content;
    if (embeds !== undefined) body.embeds = Array.isArray(embeds) ? embeds : [embeds];
    if (components !== undefined) body.components = components;
    if (message_reference !== undefined) body.message_reference = message_reference;

    return this.request(`/channels/${channelId}/messages`, {
      method: 'POST',
      body
    });
  }

  async editMessage(channelId, messageId, { content, embeds, components }) {
    const body = {};
    if (content !== undefined) body.content = content;
    if (embeds !== undefined) body.embeds = Array.isArray(embeds) ? embeds : [embeds];
    if (components !== undefined) body.components = components;

    return this.request(`/channels/${channelId}/messages/${messageId}`, {
      method: 'PATCH',
      body
    });
  }

  async deleteMessage(channelId, messageId) {
    return this.request(`/channels/${channelId}/messages/${messageId}`, {
      method: 'DELETE'
    });
  }

  async bulkDeleteMessages(channelId, messageIds) {
    return this.request(`/channels/${channelId}/messages/bulk-delete`, {
      method: 'POST',
      body: { messages: messageIds }
    });
  }

  async getChannelMessages(channelId, limit = 50) {
    return this.request(`/channels/${channelId}/messages?limit=${limit}`);
  }

  // --- Interaction Responses ---

  async interactionCallback(interactionId, interactionToken, { type = 4, data = {} }) {
    return this.request(`/interactions/${interactionId}/${interactionToken}/callback`, {
      method: 'POST',
      body: { type, data }
    });
  }

  // --- Moderation Endpoints ---

  async kickMember(guildId, userId, reason = '') {
    const headers = reason ? { 'X-Audit-Log-Reason': encodeURIComponent(reason) } : {};
    return this.request(`/guilds/${guildId}/members/${userId}`, {
      method: 'DELETE',
      headers
    });
  }

  async banMember(guildId, userId, { delete_message_seconds = 0, reason = '' } = {}) {
    const headers = reason ? { 'X-Audit-Log-Reason': encodeURIComponent(reason) } : {};
    return this.request(`/guilds/${guildId}/bans/${userId}`, {
      method: 'PUT',
      headers,
      body: { delete_message_seconds }
    });
  }

  async unbanMember(guildId, userId, reason = '') {
    const headers = reason ? { 'X-Audit-Log-Reason': encodeURIComponent(reason) } : {};
    return this.request(`/guilds/${guildId}/bans/${userId}`, {
      method: 'DELETE',
      headers
    });
  }

  async timeoutMember(guildId, userId, durationMs, reason = '') {
    const headers = reason ? { 'X-Audit-Log-Reason': encodeURIComponent(reason) } : {};
    const communication_disabled_until = durationMs ? new Date(Date.now() + durationMs).toISOString() : null;
    return this.request(`/guilds/${guildId}/members/${userId}`, {
      method: 'PATCH',
      headers,
      body: { communication_disabled_until }
    });
  }

  async setChannelSlowmode(channelId, rateLimitSeconds, reason = '') {
    const headers = reason ? { 'X-Audit-Log-Reason': encodeURIComponent(reason) } : {};
    return this.request(`/channels/${channelId}`, {
      method: 'PATCH',
      headers,
      body: { rate_limit_per_user: rateLimitSeconds }
    });
  }

  async setChannelPermission(channelId, overwriteId, { allow = '0', deny = '0', type = 0 }, reason = '') {
    const headers = reason ? { 'X-Audit-Log-Reason': encodeURIComponent(reason) } : {};
    return this.request(`/channels/${channelId}/permissions/${overwriteId}`, {
      method: 'PUT',
      headers,
      body: { allow, deny, type }
    });
  }

  async getGuildMember(guildId, userId) {
    return this.request(`/guilds/${guildId}/members/${userId}`);
  }

  async getCurrentUser() {
    return this.request('/users/@me');
  }
}
