import { useState, useEffect, useCallback } from 'react';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const GAP_OPTIONS = [15, 30, 45, 60, 90, 120];

function AvailabilityEditor({ service, onClose, onSaved }) {
  const [slots, setSlots] = useState({});
  const [slotMinutes, setSlotMinutes] = useState(service.slotMinutes ?? 60);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const load = useCallback(() => {
    fetch(`http://localhost:3000/providers/me/services/${service.id}/availability`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const map = {};
        (Array.isArray(data) ? data : []).forEach((a) => {
          map[a.dayOfWeek] = { startHour: a.startHour, endHour: a.endHour };
        });
        setSlots(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [service.id, token]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDay = (day) => {
    setSlots((prev) => {
      const next = { ...prev };
      if (next[day]) delete next[day];
      else next[day] = { startHour: 8, endHour: 17 };
      return next;
    });
  };

  const setHour = (day, field, value) => {
    setSlots((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: Number(value) },
    }));
  };

  const save = async () => {
    setMessage(null);

    // 1. Save the slot gap on the service
    const gapRes = await fetch(
      `http://localhost:3000/providers/me/services/${service.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slotMinutes }),
      },
    );
    if (!gapRes.ok) {
      const d = await gapRes.json();
      setMessage({
        text: Array.isArray(d.message) ? d.message.join(', ') : d.message,
        ok: false,
      });
      return;
    }

    // 2. Save the weekly availability
    const payload = {
      slots: Object.entries(slots).map(([day, s]) => ({
        dayOfWeek: Number(day),
        startHour: s.startHour,
        endHour: s.endHour,
      })),
    };
    const res = await fetch(
      `http://localhost:3000/providers/me/services/${service.id}/availability`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      setMessage({
        text: Array.isArray(data.message) ? data.message.join(', ') : data.message,
        ok: false,
      });
      return;
    }
    setMessage({ text: 'Schedule saved', ok: true });
    onSaved?.();
  };

  if (loading) return <p className="muted">Loading schedule...</p>;

  return (
    <div className="stack" style={{ marginTop: 'var(--space-3)' }}>
      <h3>Weekly schedule</h3>
      <p className="muted">
        Pick the days you work and your hours. Customers will see bookable time
        slots based on this.
      </p>

      <div className="cluster">
        <label htmlFor={`gap-${service.id}`}>Appointment length</label>
        <select
          id={`gap-${service.id}`}
          className="input"
          style={{ inlineSize: 130, marginBlockEnd: 0 }}
          value={slotMinutes}
          onChange={(e) => setSlotMinutes(Number(e.target.value))}
        >
          {GAP_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} minutes
            </option>
          ))}
        </select>
      </div>

      {DAYS.map((d) => (
        <div key={d.value} className="cluster">
          <label style={{ minWidth: 120 }}>
            <input
              type="checkbox"
              checked={!!slots[d.value]}
              onChange={() => toggleDay(d.value)}
              style={{ marginInlineEnd: 8 }}
            />
            {d.label}
          </label>

          {slots[d.value] && (
            <>
              <select
                className="input"
                style={{ inlineSize: 90, marginBlockEnd: 0 }}
                value={slots[d.value].startHour}
                onChange={(e) => setHour(d.value, 'startHour', e.target.value)}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{`${h}:00`}</option>
                ))}
              </select>
              <span className="muted">to</span>
              <select
                className="input"
                style={{ inlineSize: 90, marginBlockEnd: 0 }}
                value={slots[d.value].endHour}
                onChange={(e) => setHour(d.value, 'endHour', e.target.value)}
              >
                {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
                  <option key={h} value={h}>{`${h}:00`}</option>
                ))}
              </select>
            </>
          )}
        </div>
      ))}

      {message && (
        <p className={message.ok ? 'msg-ok' : 'msg-error'}>
          {message.ok ? '✅' : '⚠️'} {message.text}
        </p>
      )}

      <div className="cluster">
        <button className="btn btn-primary" onClick={save}>Save schedule</button>
        <button className="btn btn-danger" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default AvailabilityEditor;