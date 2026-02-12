import { useState, useRef, useEffect } from 'react';
import './App.css';

const API_BASE = '';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topic, setTopic] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/config`)
      .then((r) => r.json())
      .then((data) => setTopic(data.topic))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Network error');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [...prev, { role: 'assistant', content: null, error: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">◇</span>
          <h1>Chat AI</h1>
        </div>
        <p className="tagline">
          {topic ? `Ask me anything about ${topic}.` : 'Ask me anything.'}
        </p>
      </header>

      <main className="main">
        <div className="chat-panel" ref={listRef}>
          {messages.length === 0 && (
            <div className="empty-state">
              <p>Type a message to get started.</p>
              <p className="hint">Try: &quot;Explain React in a few lines&quot; or &quot;What&apos;s the weather?&quot;</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`message message--${msg.role}`}>
              <span className="message-role">
                {msg.role === 'user' ? 'You' : 'AI'}
              </span>
              <div className="message-content">
                {msg.error ? (
                  <span className="message-error">{msg.error}</span>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message message--assistant">
              <span className="message-role">AI</span>
              <div className="message-content typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="banner banner-error">
            {error}
          </div>
        )}

        <div className="input-row">
          <textarea
            className="input"
            placeholder="Type here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            type="button"
            className="btn-send"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
