import { useEffect, useState } from 'react';
import { beginGoogleOAuth, login, signup, me } from '../api';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string; name?: string; avatar?: string } | null>(null);

  useEffect(() => {
    // Try to fetch current user on mount (cookie-based)
    me().then((res) => {
      if (res.ok) setCurrentUser(res.data.user);
    });
  }, []);

  const doSignup = async () => {
    setLoading(true); setError(null); setInfo(null);
    const res = await signup(email, password);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setInfo('Signed up! Access token cookie set.');
  };

  const doLogin = async () => {
    setLoading(true); setError(null); setInfo(null);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setInfo('Logged in! Access token cookie set.');
  };

  return (
    <div style={{ padding: 16, marginBottom: 16 }}>
      {currentUser ? (
        <div style={{
          background: 'white',
          padding: 16,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          {currentUser.avatar && (
            <img src={currentUser.avatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong>{currentUser.name || currentUser.email}</strong>
            <span style={{ color: '#666', fontSize: 12 }}>{currentUser.email}</span>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'white',
          padding: 16,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Sign in</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button disabled={loading} onClick={doSignup} style={{ padding: '10px 16px' }}>Create account</button>
            <button disabled={loading} onClick={doLogin} style={{ padding: '10px 16px' }}>Sign in</button>
            <button onClick={beginGoogleOAuth} style={{ padding: '10px 16px' }}>Continue with Google</button>
          </div>
          {error && <div style={{ color: 'tomato' }}>{error}</div>}
          {info && <div style={{ color: 'limegreen' }}>{info}</div>}
        </div>
      )}
    </div>
  );
}


