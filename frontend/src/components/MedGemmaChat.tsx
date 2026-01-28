// frontend/src/components/MedGemmaChat.tsx

import { useState } from 'react';
import { useMedGemma } from '@/lib/medgemma';

export default function MedGemmaChat() {
  const { loading, data, error, queryText } = useMedGemma();
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await queryText(message);
    setMessage('');
  };

  return (
    <div className="chat-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a medical question..."
          disabled={loading}
        />
        <button disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      {data?.response && <div className="response">{data.response}</div>}
    </div>
  );
}