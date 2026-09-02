import { useState, useEffect, useRef, useCallback } from 'react';

function BookingChat({ bookingId, myUserId }) {
  const [messages, setMessages] = useState([]);
  const [canSend, setCanSend] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const logRef = useRef(null);
  const token = localStorage.getItem('token');

  const load = useCallback(
    (scroll = false) => {
      fetch(`http://localhost:3000/bookings/${bookingId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          return data;
        })
        .then((data) => {
          setMessages(data.messages ?? []);
          setCanSend(!!data.canSend);
          setError(null);
          if (scroll) {
            setTimeout(() => {
              if (logRef.current) {
                logRef.current.scrollTop = logRef.current.scrollHeight;
              }
            }, 50);
          }
        })
        .catch((e) => setError(e.message || 'Could not load messages'))
        .finally(() => setLoading(false));
    },
    [bookingId, token],
  );

  useEffect(() => {
    load(true);
    const timer = setInterval(() => load(false), 5000);
    return () => clearInterval(timer);
  }, [load]);

  const send = async () => {
    if (!text.trim()) return;
    const res = await fetch(`http://localhost:3000/bookings/${bookingId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: text.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(Array.isArray(data.message) ? data.message.join(', ') : data.message);
      return;
    }
    setText('');
    load(true);
  };

  if (loading) return <p className="muted">Loading conversation...</p>;
  if (error && messages.length === 0) return <p className="muted">{error}</p>;

  return (
    <div className="stack" style={{ marginTop: 'var(--space-3)' }}>
      <h3>Conversation</h3>

      <div className="chat-log" ref={logRef}>
        {messages.length === 0 && (
          <p className="muted">No messages yet — say hello.</p>
        )}
        {messages.map((m) => {
          const mine = m.sender.id === myUserId;
          return (
            <div key={m.id} className={`chat-bubble${mine ? ' is-mine' : ''}`}>
              <span className="chat-author">{mine ? 'You' : m.sender.name}</span>
              <span>{m.content}</span>
              <span className="chat-time">
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          );
        })}
      </div>

      {canSend ? (
        <div className="cluster">
          <input
            className="input"
            style={{ flex: 1, marginBlockEnd: 0 }}
            placeholder="Write a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn btn-primary" onClick={send}>Send</button>
        </div>
      ) : (
        <p className="muted">This job is completed — the conversation is read-only.</p>
      )}

      {error && <p className="msg-error">⚠️ {error}</p>}
    </div>
  );
}

export default BookingChat;