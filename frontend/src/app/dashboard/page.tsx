"use client";
import { useEffect, useState, useRef } from "react";
import { createConversationWS } from "../lib/ws";

export default function DashboardPage() {
  const [convs, setConvs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const inputRef = useRef();

  const API = process.env.NEXT_PUBLIC_API_URL;

  function getToken() {
    return localStorage.getItem("mhchat_access");
  }

  async function loadConversations() {
    const res = await fetch(`${API}/api/conversations/`, { headers: { Authorization: `Bearer ${getToken()}` }});
    if (!res.ok) return;
    setConvs(await res.json());
  }

  async function loadMessages(convId) {
    const res = await fetch(`${API}/api/messages/?conversation=${convId}`, { headers: { Authorization: `Bearer ${getToken()}` }});
    if (!res.ok) return;
    setMessages(await res.json());
  }

  function openWS(convId) {
    if (wsRef.current) try { wsRef.current.close(); } catch {}
    wsRef.current = createConversationWS(convId, getToken(),
      (payload) => {
        // handle types: initial_messages, message, message_sent
        if (payload.type === "initial_messages" && Array.isArray(payload.messages)) {
          setMessages(payload.messages);
        } else if (payload.type === "message" && payload.message) {
          setMessages(m => [...m, payload.message]);
        } else if (payload.type === "message_sent" && payload.message) {
          setMessages(m => [...m, payload.message]);
        }
      }
    );
  }

  useEffect(()=> { loadConversations(); }, []);

  async function selectConv(c) {
    setSelected(c);
    await loadMessages(c.id);
    openWS(c.id);
  }

  async function sendMessage() {
    if (!selected) return alert("Select conversation");
    const text = inputRef.current.value.trim();
    if (!text) return;
    inputRef.current.value = "";
    // optimistic UI
    setMessages(m => [...m, { sender: "user", text, created_at: new Date().toISOString() }]);
    await fetch(`${API}/api/messages/`, {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ conversation: selected.id, sender: "user", text })
    });
    // worker will produce bot reply; websocket or polling will update UI
  }

  return (
    <div className="min-h-screen p-6 grid grid-cols-12 gap-6">
      <aside className="col-span-3 bg-white p-4 rounded shadow">
        <h2 className="mb-2">Conversations</h2>
        <ul className="space-y-2">
          {convs.map(c => (
            <li key={c.id}><button onClick={()=>selectConv(c)} className={`w-full text-left p-2 rounded ${selected?.id===c.id ? 'bg-sky-50':''}`}>#{c.id} {c.user?.username||'anon'}</button></li>
          ))}
        </ul>
      </aside>

      <main className="col-span-6 bg-white p-4 rounded shadow flex flex-col">
        <div className="flex-1 overflow-auto p-2 space-y-2" id="messages">
          {messages.map((m,i)=>(
            <div key={i} className={`p-2 rounded ${m.sender==='bot' ? 'bg-blue-50 text-blue-800' : 'bg-white'}`}>
              <div className="text-xs text-slate-400">[{m.sender}] {m.created_at && new Date(m.created_at).toLocaleString()}</div>
              <div className="mt-1">{m.text}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input ref={inputRef} className="flex-1 p-2 border rounded" placeholder="Type a message..." />
          <button onClick={sendMessage} className="px-4 py-2 bg-sky-600 text-white rounded">Send</button>
        </div>
      </main>

      <aside className="col-span-3 bg-white p-4 rounded shadow">
        <h3>Info</h3>
        <div className="text-sm mt-2">Selected: {selected?.id || '-'}</div>
      </aside>
    </div>
  );
}
