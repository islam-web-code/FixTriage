import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { distanceKm, formatDistance } from '../lib/distance';

const CATEGORIES = [
  'electrical',
  'plumbing',
  'car_repair',
  'cleaning',
  'ac_maintenance',
  'phone_repair',
  'cameras',
  'general_handyman',
];

function Providers() {
  const [providers, setProviders] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    const url = category
      ? `http://localhost:3000/providers?category=${category}`
      : 'http://localhost:3000/providers';
        const token = localStorage.getItem('token');
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, [category]);

  const findNearMe = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support location sharing.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setLocationError('Could not get your location. Check browser permissions.');
        setLocating(false);
      },
      { timeout: 10000 },
    );
  };

  // Add distance to each provider and sort by nearest when we know where the user is
  const listed = useMemo(() => {
    if (!myLocation) return providers;
    return providers
      .map((p) => ({
        ...p,
        distance:
          p.latitude != null && p.longitude != null
            ? distanceKm(myLocation.lat, myLocation.lng, p.latitude, p.longitude)
            : null,
      }))
      .sort((a, b) => {
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
  }, [providers, myLocation]);

  const mapped = listed.filter((p) => p.latitude != null && p.longitude != null);

  return (
    <div className="page">
      <h1>Find a provider</h1>
      <p className="muted">Browse skilled people near you, by category.</p>

      <div className="cluster">
        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ maxInlineSize: '16rem', marginBlockEnd: 0 }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace('_', ' ')}
            </option>
          ))}
        </select>

        <button className="btn btn-primary" onClick={findNearMe} disabled={locating}>
          {locating ? 'Locating…' : myLocation ? '📍 Update my location' : '📍 Find near me'}
        </button>

        {myLocation && (
          <button
            className="btn btn-danger"
            onClick={() => {
              setMyLocation(null);
              setLocationError(null);
            }}
          >
            Clear
          </button>
        )}
      </div>

      {locationError && <p className="msg-error">⚠️ {locationError}</p>}
      {myLocation && (
        <p className="msg-ok">✅ Showing providers sorted by distance from you</p>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden', height: 380 }}>
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <Map
            style={{ width: '100%', height: '380px' }}
            defaultCenter={{ lat: 32.0853, lng: 34.7818 }}
            defaultZoom={11}
            center={myLocation ?? undefined}
            mapId="fixtriage-map"
            gestureHandling="greedy"
            onClick={() => setSelected(null)}
          >
            {mapped.map((p) => (
              <AdvancedMarker
                key={p.id}
                position={{ lat: p.latitude, lng: p.longitude }}
                onClick={() => setSelected(p)}
              >
                <Pin background="#2453e6" borderColor="#1a3fb8" glyphColor="#fff" />
              </AdvancedMarker>
            ))}

            {myLocation && (
              <AdvancedMarker position={myLocation} title="You are here">
                <Pin background="#ffb020" borderColor="#c98600" glyphColor="#fff" />
              </AdvancedMarker>
            )}

            {selected && (
              <InfoWindow
                position={{ lat: selected.latitude, lng: selected.longitude }}
                onCloseClick={() => setSelected(null)}
              >
                <div style={{ color: '#17233b', minWidth: 160 }}>
                  <strong>{selected.user.name}</strong>
                  {selected.address && <div>{selected.address}</div>}
                  {selected.distance != null && (
                    <div>{formatDistance(selected.distance)}</div>
                  )}
                  <div style={{ marginTop: 6 }}>
                    <Link to={`/providers/${selected.id}`}>View profile →</Link>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {!loading && mapped.length === 0 && providers.length > 0 && (
        <p className="muted">None of these providers have a mapped location yet.</p>
      )}

      {loading && <p className="muted">Loading providers...</p>}
      {!loading && providers.length === 0 && (
        <div className="card">
          <h3>No providers found</h3>
          <p className="muted">
            Try a different category, or be the first — open the dashboard and list your services.
          </p>
        </div>
      )}

      <div className="list-long">
        {listed.map((p) => (
          <div className="card" key={p.id} style={{ marginBottom: 'var(--space-3)' }}>
            <div>
              <h3>{p.user.name}</h3>
              {p.bio && <p className="muted">{p.bio}</p>}
              {p.address && <p className="muted">📍 {p.address}</p>}
              {p.distance != null && (
                <p className="price" style={{ fontSize: '0.9rem' }}>
                  {formatDistance(p.distance)}
                </p>
              )}
              <p style={{ marginTop: 'var(--space-2)' }} className="cluster">
                {p.services.length > 0 ? (
                  p.services.map((s) => (
                    <span className="badge" key={s.id}>
                      {s.category.replace('_', ' ')}
                    </span>
                  ))
                ) : (
                  <span className="muted">No services listed yet</span>
                )}
              </p>
            </div>
            <Link to={`/providers/${p.id}`} className="btn btn-primary">
              View profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Providers;