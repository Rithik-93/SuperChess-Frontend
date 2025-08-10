import { useState } from 'react';
import { beginGoogleOAuth, login, signup } from '../api';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div style={{ border: '1px solid #444', padding: 16, borderRadius: 8, marginBottom: 16 }}>
      <h3>Auth</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button disabled={loading} onClick={doSignup}>Signup</button>
        <button disabled={loading} onClick={doLogin}>Login</button>
        <button onClick={beginGoogleOAuth}>Continue with Google</button>
      </div>
      {error && <div style={{ color: 'tomato' }}>{error}</div>}
      {info && <div style={{ color: 'limegreen' }}>{info}</div>}
    </div>
  );
}


