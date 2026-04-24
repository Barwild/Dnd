import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Sword, Shield, BookOpen, Dice5, ScrollText } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="container fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', textAlign: 'center' }}>
      <h1 className="glow" style={{ fontSize: '3.5rem', marginBottom: '0.5rem', color: '#fff', textShadow: '0 0 25px rgba(200, 155, 60, 0.6)' }}>
        D&D 5E NEXUS
      </h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '3rem', color: 'var(--text-muted)', maxWidth: '500px' }}>
        Gestiona tu destino como héroe o controla el universo como Dungeon Master.
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '900px' }}>
        {/* Player Card */}
        <Link to="/player-lobby" style={{ textDecoration: 'none', flex: '1', minWidth: '280px', maxWidth: '400px' }}>
          <div className="glass-panel clickable slide-up" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderBottom: '3px solid var(--accent-gold)' }}>
            <Sword size={48} style={{ color: 'var(--accent-gold)' }} />
            <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0 }}>Soy Jugador</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              Crea tu héroe, gestiona tus personajes y únete a campañas.
            </p>
            <button className="btn btn-gold" style={{ marginTop: '0.5rem' }}>Entrar al Lobby</button>
          </div>
        </Link>

        {/* DM Card */}
        {user?.role === 'dm' && (
          <Link to="/campaigns" style={{ textDecoration: 'none', flex: '1', minWidth: '280px', maxWidth: '400px' }}>
            <div className="glass-panel clickable slide-up" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderBottom: '3px solid var(--accent-red)', animationDelay: '0.1s' }}>
              <Shield size={48} style={{ color: 'var(--accent-red-bright)' }} />
              <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0 }}>Soy Master</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
                Gestiona campañas, monstruos y dirige las partidas.
              </p>
              <button className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Panel de Campañas</button>
            </div>
          </Link>
        )}
      </div>

      {/* Quick Links */}
      {user?.role === 'dm' && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/bestiary" className="btn btn-ghost">
            <BookOpen size={16} /> Bestiario Completo
          </Link>
          <Link to="/items" className="btn btn-ghost">
            <ScrollText size={16} /> Catálogo de Objetos
          </Link>
          <Link to="/conditions" className="btn btn-ghost">
            <Shield size={16} /> Condiciones
          </Link>
        </div>
      )}

      <p style={{ marginTop: '3rem', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
        Bienvenido, <strong style={{ color: 'var(--accent-gold)' }}>{user?.display_name}</strong> — D&D 5ª Edición en Español
      </p>
    </div>
  );
}
