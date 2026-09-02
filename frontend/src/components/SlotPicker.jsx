import { useState, useEffect, useCallback } from 'react';

function toDateInput(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function SlotPicker({ service, onBook, busy }) {
  const [date, setDate] = useState(toDateInput(new Date()));
  const [slots, setSlots] = useState([]);
  const [reason, setReason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chosen, setChosen] = useState(null);
  const [problemText, setProblemText] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setChosen(null);
    fetch(
      `http://localhost:3000/providers/services/${service.id}/slots?date=${date}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        setReason(data.reason ?? null);
      })
      .catch(() => {
        setSlots([]);
        setReason('Could not load available times');
      })
      .finally(() => setLoading(false));
  }, [service.id, date]);

  useEffect(() => {
    load();
  }, [load]);

  // Next 14 days as quick-pick buttons
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="stack" style={{ marginTop: 'var(--space-3)' }}>
      <h3>Pick a time</h3>

      <div className="slot-days">
        {days.map((d) => {
          const value = toDateInput(d);
          const active = value === date;
          return (
            <button
              key={value}
              className={`day-chip${active ? ' is-active' : ''}`}
              onClick={() => setDate(value)}
            >
              <span className="day-chip-dow">
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span className="day-chip-num">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {loading && <p className="muted">Loading times...</p>}

      {!loading && slots.length === 0 && (
        <p className="muted">{reason ?? 'No times available on this day.'}</p>
      )}

      {!loading && slots.length > 0 && (
        <div className="slot-grid">
          {slots.map((s) => {
            const t = new Date(s);
            const active = chosen === s;
            return (
              <button
                key={s}
                className={`slot-chip${active ? ' is-active' : ''}`}
                onClick={() => setChosen(s)}
              >
                {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </button>
            );
          })}
        </div>
      )}

      {chosen && (
        <div className="stack">
          <textarea
            className="input"
            placeholder="Describe the problem (optional)"
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
          />
          <div className="cluster">
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => onBook(chosen, problemText, load)}
            >
              {busy
                ? 'Booking…'
                : `Book ${new Date(chosen).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
            </button>
            <button className="btn btn-danger" onClick={() => setChosen(null)}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SlotPicker;