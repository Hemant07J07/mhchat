// chat/static/chat/ws.js
(function () {
  // Helper: read cookie (if you store token in cookie)
  function getCookie(name) {
    const v = `; ${document.cookie}`;
    const parts = v.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // How to get the JWT access token:
  // 1) try localStorage 'access'
  // 2) fallback to cookie 'access' or 'access_token'
  function getAccessToken() {
    return (
      localStorage.getItem('access') ||
      localStorage.getItem('access_token') ||
      getCookie('access') ||
      getCookie('access_token') ||
      ''
    );
  }

  // Build websocket URL with token in query param (prototype).
  function buildWsUrl(convId) {
    const token = getAccessToken();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const encoded = encodeURIComponent(token || '');
    return `${proto}://${location.host}/ws/chat/${convId}/?token=${encoded}`;
  }

  // Exposed state
  let socket = null;
  let currentConvId = null;
  let reconnectTimer = null;
  const RECONNECT_DELAY_MS = 1500;

  // Try to append a single message to the UI (uses existing renderMessages if present)
  function appendMessageToUI(msg) {
    // If your page already defines renderMessages (it does in index.html), use it:
    if (typeof renderMessages === 'function') {
      // renderMessages expects an array; fetch current messages then append:
      // For simplicity we'll pull existing messages from DOM and add new one at end.
      // If you prefer, you can re-fetch from /api/messages/ after receiving a message.
      const container = document.getElementById('messages');
      if (!container) return;
      const el = document.createElement('div');
      el.className = 'msg ' + (msg.sender || 'bot');
      const time = msg.created_at ? new Date(msg.created_at).toLocaleString() : new Date().toLocaleString();
      el.innerHTML = `<strong>[${msg.sender}]</strong> ${msg.text} <div style="font-size:0.8em;color:#666">${time}</div>`;
      container.appendChild(el);
      container.scrollTop = container.scrollHeight;
      return;
    }

    // Fallback: append a simple element
    const container = document.getElementById('messages');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'msg ' + (msg.sender || 'bot');
    const time = msg.created_at ? new Date(msg.created_at).toLocaleString() : new Date().toLocaleString();
    el.innerHTML = `<strong>[${msg.sender}]</strong> ${msg.text} <div style="font-size:0.8em;color:#666">${time}</div>`;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  function handleIncomingEvent(data) {
    // data may be { type: "initial_messages", messages: [...] } or { type: "message", message: {...} }
    try {
      if (!data) return;
      if (data.type === 'initial_messages' && Array.isArray(data.messages)) {
        // If your page has renderMessages, call it with the array
        if (typeof renderMessages === 'function') {
          renderMessages(data.messages);
        } else {
          data.messages.forEach(m => appendMessageToUI(m));
        }
        return;
      }
      if (data.type === 'message' && data.message) {
        appendMessageToUI(data.message);
        return;
      }
      if (data.type === 'message_sent' && data.message) {
        // ack for the sender
        appendMessageToUI(data.message);
        return;
      }
      if (data.type === 'pong') {
        // ignore or show connection health
        return;
      }
      // generic payload: if it looks like a message object, show it
      if (data.id && data.text) {
        appendMessageToUI(data);
      }
    } catch (err) {
      console.error('Error handling WS event', err, data);
    }
  }

  function connectWs(convId) {
    if (!convId) {
      console.warn('connectWs: convId required');
      return;
    }
    currentConvId = convId;

    const url = buildWsUrl(convId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already open for conv', convId);
      return;
    }

    if (socket) {
      try { socket.close(); } catch (e) {}
      socket = null;
    }

    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WS open', url);
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      // optional: send a small "hello" ping
      try { socket.send(JSON.stringify({ action: 'ping' })); } catch (e) {}
    };

    socket.onmessage = (event) => {
      let data = null;
      try { data = JSON.parse(event.data); } catch (e) { console.warn('non-json ws message', event.data); return; }
      handleIncomingEvent(data);
    };

    socket.onclose = (ev) => {
      console.log('WS closed', ev);
      socket = null;
      // auto-reconnect
      reconnectTimer = setTimeout(() => connectWs(currentConvId), RECONNECT_DELAY_MS);
    };

    socket.onerror = (err) => {
      console.error('WS error', err);
      // errors will trigger onclose -> reconnect
    };
  }

  function sendViaWs(text) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      socket.send(JSON.stringify({ action: 'send_message', text }));
      return true;
    } catch (e) {
      console.error('WS send failed', e);
      return false;
    }
  }

  // fallback REST POST (keeps your existing API)
  async function sendViaRest(convId, sender, text) {
    const payload = { conversation: convId, sender, text };
    const headers = { 'Content-Type': 'application/json' };
    // use JWT Authorization if you store token in localStorage
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch('/api/messages/', {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      return await res.json();
    } catch (err) {
      console.error('REST send failed', err);
      throw err;
    }
  }

  // PUBLIC: call when loading a conversation
  window.connectChatWebSocket = function (convId) {
    connectWs(convId);
  };

  // PUBLIC: call to send a message (tries WS, falls back to REST)
  window.sendChatMessage = async function (convId, sender, text) {
    // if websocket exists and is open AND convId matches, prefer WS
    if (socket && socket.readyState === WebSocket.OPEN && convId === currentConvId) {
      const ok = sendViaWs(text);
      if (ok) return { via: 'ws' };
    }
    // fallback to REST
    const json = await sendViaRest(convId, sender, text);
    return { via: 'rest', json };
  };

  // If page has a load button (#loadBtn) and send button (#sendBtn), wire them automatically
  function wireUIIfPresent() {
    const loadBtn = document.getElementById('loadBtn');
    const convInput = document.getElementById('convId');
    if (loadBtn && convInput) {
      loadBtn.addEventListener('click', () => {
        const id = convInput.value.trim();
        if (!id) { alert('Enter conversation id (create in admin).'); return; }
        connectWs(id);
      });
    }

    const sendBtn = document.getElementById('sendBtn');
    const msgInput = document.getElementById('msgInput');
    const senderSelect = document.getElementById('senderSelect');
    const convInput2 = document.getElementById('convId');

    if (sendBtn && msgInput && senderSelect && convInput2) {
      sendBtn.addEventListener('click', async () => {
        const convIdVal = convInput2.value.trim();
        if (!convIdVal) { alert('Load a conversation first.'); return; }
        const text = msgInput.value.trim();
        const sender = senderSelect.value;
        if (!text) return;

        try {
          const r = await window.sendChatMessage(convIdVal, sender, text);
          // clear UI input on success
          msgInput.value = '';
          // if REST returned created message, refresh messages or rely on ws broadcast
          if (r.via === 'rest') {
            // re-fetch messages quickly
            const res = await fetch(`/api/messages/?conversation=${convIdVal}`, { credentials: 'same-origin' });
            if (res.ok) {
              const data = await res.json();
              if (typeof renderMessages === 'function') renderMessages(data);
            }
          }
        } catch (err) {
          alert('Error sending message: ' + err.message);
        }
      });
    }
  }

  // Auto-wire after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireUIIfPresent);
  } else {
    wireUIIfPresent();
  }
})();
