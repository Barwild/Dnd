import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { login } from '../api';
import { LogIn, Eye, EyeOff, Sword, Shield, Zap, Users, Globe, BookOpen } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ username, password });
      loginUser(res.data.access_token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Hero Section */}
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '3rem', paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div style={{ flex: '1 1 500px', maxWidth: '600px' }} className="slide-up">
          <h1 className="glow" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '1rem', color: '#fff' }}>
            D&D 5E NEXUS
          </h1>
          <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: 'var(--accent-gold)', marginBottom: '1.5rem', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            Constructor y Gestor de Personajes 100% GRATIS
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Crea y gestiona personajes de la 5ª Edición con el mejor constructor de hojas de personaje en línea. Creación guiada o experimentada, cálculos automáticos, soporte multiclase, sistema de grupo (party) y herramientas completas para el Dungeon Master. La alternativa gratuita definitiva a las herramientas de pago.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="#features" className="btn btn-gold btn-lg">Descubrir Características</a>
            <a href="#compendium" className="btn btn-ghost btn-lg">Ver Compendio</a>
          </div>
        </div>

        {/* Login Form Panel */}
        <div className="glass-panel fade-in" style={{ flex: '1 1 350px', maxWidth: '420px', borderTop: '3px solid var(--accent-gold)' }}>
          <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '0.5rem', color: '#fff' }}>Iniciar Sesión</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>Continúa tu aventura o dirige tu campaña</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Usuario</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu nombre de usuario" required autoFocus />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(139,0,0,0.2)', border: '1px solid rgba(139,0,0,0.4)', borderRadius: '6px', padding: '0.6rem', color: '#f88', fontSize: '0.85rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-gold btn-lg" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              <LogIn size={18} /> {loading ? 'Entrando...' : 'Entrar al Nexus'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>Regístrate gratis</Link>
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" style={{ background: 'rgba(0,0,0,0.4)', padding: '5rem 0', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>Un Kit Completo de Herramientas</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 4rem auto', fontSize: '1.1rem' }}>
            Diseñado con tecnología moderna para ofrecer la mejor experiencia tanto para jugadores como para Dungeon Masters.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(200, 155, 60, 0.1)', padding: '1rem', borderRadius: '50%', width: 'fit-content' }}>
                <Sword size={32} style={{ color: 'var(--accent-gold)' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontFamily: 'Inter, sans-serif' }}>Constructor a Tu Manera</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Crea personajes con ayuda guiada o salta directamente al modo experimentado. Elige especie, clase, trasfondo y personaliza cada detalle.
              </p>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(200, 155, 60, 0.1)', padding: '1rem', borderRadius: '50%', width: 'fit-content' }}>
                <Zap size={32} style={{ color: 'var(--accent-gold)' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontFamily: 'Inter, sans-serif' }}>Cálculos Automáticos</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Modificadores, bonificadores de competencia, CD de salvación de conjuros y bonos de ataque: todo calculado instantáneamente de forma automática.
              </p>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(200, 155, 60, 0.1)', padding: '1rem', borderRadius: '50%', width: 'fit-content' }}>
                <Globe size={32} style={{ color: 'var(--accent-gold)' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontFamily: 'Inter, sans-serif' }}>Acceso Global y Sincronizado</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Tus personajes se sincronizan automáticamente. Empieza en tu ordenador y continúa en tu móvil durante la partida. Todo se guarda al instante.
              </p>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '3px solid var(--accent-red)' }}>
              <div style={{ background: 'rgba(139, 0, 0, 0.1)', padding: '1rem', borderRadius: '50%', width: 'fit-content' }}>
                <Shield size={32} style={{ color: 'var(--accent-red-bright)' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontFamily: 'Inter, sans-serif' }}>Herramientas del Master</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                El panel definitivo para el Dungeon Master. Gestiona campañas, controla a los jugadores, construye encuentros dinámicos y usa el rastreador de combate.
              </p>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(200, 155, 60, 0.1)', padding: '1rem', borderRadius: '50%', width: 'fit-content' }}>
                <Users size={32} style={{ color: 'var(--accent-gold)' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontFamily: 'Inter, sans-serif' }}>Sistema de Grupo (Party)</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Reúne a tu grupo, invita a jugadores y comparte información vital. Perfecto para una comunicación fluida entre el DM y los aventureros.
              </p>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(200, 155, 60, 0.1)', padding: '1rem', borderRadius: '50%', width: 'fit-content' }}>
                <BookOpen size={32} style={{ color: 'var(--accent-gold)' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontFamily: 'Inter, sans-serif' }}>Compendio Integrado</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Accede rápidamente a reglas, hechizos, bestiario, objetos y condiciones sin salir de la plataforma. La enciclopedia completa a un clic.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compendium Highlights */}
      <div id="compendium" className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Contenido Básico y Expansiones Únicas</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto 4rem auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
          Combinamos la base oficial del SRD 5.1 con una gran cantidad de contenido único y compatible. Obtén la experiencia estándar de 5e junto a opciones de expansión exclusivas. Todo en español.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-gold)', marginBottom: '0.5rem', fontFamily: 'Cinzel' }}>9+</div>
            <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>Especies Jugables</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Dracónido, Enano, Elfo, Gnomo, Goliat, Mediano, Humano, Orco y Tiflin con rasgos completos.</p>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-gold)', marginBottom: '0.5rem', fontFamily: 'Cinzel' }}>12+</div>
            <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>Clases de Personaje</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Todas las clases básicas desde el Bárbaro hasta el Mago, cada una con su subclase SRD.</p>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-gold)', marginBottom: '0.5rem', fontFamily: 'Cinzel' }}>16+</div>
            <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>Trasfondos</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Trasfondos estándar más opciones expandidas para personalizar al máximo a tu aventurero.</p>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-gold)', marginBottom: '0.5rem', fontFamily: 'Cinzel' }}>300+</div>
            <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>Hechizos y Objetos</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Base de datos ampliada de hechizos y equipo mágico y mundano con descripciones detalladas.</p>
          </div>
        </div>
      </div>

      {/* Footer / Call to Action */}
      <div style={{ background: 'var(--bg-secondary)', padding: '4rem 1.5rem', textAlign: 'center', marginTop: 'auto', borderTop: '1px solid var(--glass-border)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>Tu Próxima Aventura Te Espera</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>
          Únete a los aventureros que ya gestionan sus campañas con D&D 5E Nexus. Gratis, sin ataduras.
        </p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn btn-primary btn-lg">
          Comenzar Ahora
        </button>
        <p style={{ marginTop: '3rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
          © 2026 D&D 5E Nexus - Hecho por y para aventureros.<br/>
          Contenido SRD bajo licencia CC BY 4.0.
        </p>
      </div>
    </div>
  );
}
