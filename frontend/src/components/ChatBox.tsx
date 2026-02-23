// ChatBox.tsx (simplified)
import { useEffect, useRef, useState } from "react";

export default function ChatBox() {
  const [messages, setMessages] = useState<{id:number,from:string,text:string}[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket|null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/chat/room1/");
    ws.onopen = ()=> console.log("WS open");
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      setMessages(m => [...m, {id: Date.now(), from: data.type === 'ai_message' ? 'ai' : 'user', text: data.message}]);
    }
    ws.onclose = ()=> console.log("WS closed");
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const send = () => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ message: input }));
    setMessages(m => [...m, {id: Date.now(), from:'user', text: input}]);
    setInput("");
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="bg-white rounded-md shadow p-4 h-96 overflow-auto">
        {messages.map(m => (
          <div key={m.id} className={m.from==='ai' ? "text-left text-gray-800" : "text-right text-blue-600"}>
            <div className="inline-block p-2 rounded-md bg-gray-100">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="flex mt-3">
        <input value={input} onChange={(e)=>setInput(e.target.value)} className="flex-1 border rounded p-2" />
        <button onClick={send} className="ml-2 bg-indigo-600 text-white px-4 rounded">Send</button>
      </div>
    </div>
  )
}
