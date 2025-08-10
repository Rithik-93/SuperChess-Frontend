import { Link } from 'react-router-dom';
import Auth from '../components/Auth';

export default function Home() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>SuperChess</h1>
        <p style={{ color: '#666', marginTop: 0 }}>Match with another player and play live chess in your browser.</p>
        <Link to="/play">
          <button style={{ padding: '12px 18px', fontSize: 16 }}>Play Now</button>
        </Link>
      </div>
      <Auth />
    </div>
  );
}


