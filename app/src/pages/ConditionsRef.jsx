import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConditions } from '../api';
import { ChevronDown, ChevronUp, Search, AlertTriangle } from 'lucide-react';

/* ── Fallback conditions in case the API doesn't have them ── */
const FALLBACK_CONDITIONS = [
  { name: 'Cegado', description: 'Una criatura cegada no puede ver y falla automáticamente cualquier prueba de característica que requiera visión. Las tiradas de ataque contra la criatura tienen ventaja, y las tiradas de ataque de la criatura tienen desventaja.' },
  { name: 'Encantado', description: 'Una criatura encantada no puede atacar al encantador ni objetivo al encantador con habilidades dañinas o efectos mágicos. El encantador tiene ventaja en las pruebas de característica para interactuar socialmente con la criatura.' },
  { name: 'Ensordecido', description: 'Una criatura ensordecida no puede oír y falla automáticamente cualquier prueba de característica que requiera oído.' },
  { name: 'Asustado', description: 'Una criatura asustada tiene desventaja en las pruebas de característica y tiradas de ataque mientras la fuente de su miedo esté dentro de su línea de visión. La criatura no puede moverse voluntariamente hacia la fuente de su miedo.' },
  { name: 'Agarrado', description: 'La velocidad de una criatura agarrada se convierte en 0, y no puede beneficiarse de ningún bono a su velocidad. La condición termina si el agarrador queda incapacitado o si un efecto aleja a la criatura fuera del alcance del agarrador.' },
  { name: 'Incapacitado', description: 'Una criatura incapacitada no puede realizar acciones ni reacciones.' },
  { name: 'Invisible', description: 'Es imposible ver a una criatura invisible sin ayuda mágica o sentidos especiales. La criatura está en gran medida oscurecida para propósitos de esconderse. Las tiradas de ataque contra la criatura tienen desventaja, y sus tiradas de ataque tienen ventaja.' },
  { name: 'Paralizado', description: 'Una criatura paralizada queda incapacitada y no puede moverse ni hablar. La criatura falla automáticamente salvaciones de FUE y DES. Tiradas de ataque contra ella tienen ventaja. Cualquier ataque que la golpee dentro de 5 pies es un crítico.' },
  { name: 'Petrificado', description: 'Una criatura petrificada se transforma, junto con cualquier objeto no mágico que lleve, en piedra sólida. Su peso se multiplica por diez y deja de envejecer. Está incapacitada, no puede moverse ni hablar, y no es consciente de lo que la rodea. Tiene resistencia a todo el daño e inmunidad al veneno y enfermedades.' },
  { name: 'Envenenado', description: 'Una criatura envenenada tiene desventaja en tiradas de ataque y pruebas de característica.' },
  { name: 'Tumbado', description: 'La única opción de movimiento de una criatura tumbada es arrastrarse, a menos que se levante. Levantarse cuesta una cantidad de movimiento igual a la mitad de su velocidad. Tiene desventaja en tiradas de ataque. Una tirada de ataque contra la criatura tiene ventaja si el atacante está a 5 pies, y desventaja si está más lejos.' },
  { name: 'Inmovilizado', description: 'La velocidad de una criatura inmovilizada se convierte en 0 y no puede beneficiarse de ningún bono a su velocidad. Tiradas de ataque contra ella tienen ventaja, y sus tiradas de ataque tienen desventaja. La criatura tiene desventaja en salvaciones de DES.' },
  { name: 'Aturdido', description: 'Una criatura aturdida queda incapacitada, no puede moverse y solo puede hablar con titubeos. La criatura falla automáticamente salvaciones de FUE y DES. Las tiradas de ataque contra ella tienen ventaja.' },
  { name: 'Inconsciente', description: 'Una criatura inconsciente está incapacitada, no puede moverse ni hablar, y no es consciente de lo que la rodea. La criatura suelta lo que lleve y cae al suelo. Falla automáticamente salvaciones de FUE y DES. Tiradas de ataque contra ella tienen ventaja. Cualquier ataque dentro de 5 pies es un crítico.' },
  { name: 'Agotamiento', description: 'Algunos efectos especiales causan agotamiento. Se mide en seis niveles acumulativos: Nv1: Desventaja en pruebas de característica. Nv2: Velocidad reducida a la mitad. Nv3: Desventaja en tiradas de ataque y salvaciones. Nv4: Puntos de golpe máximos reducidos a la mitad. Nv5: Velocidad reducida a 0. Nv6: Muerte.' },
];

const CONDITION_ICONS = {
  'Cegado': '🙈', 'Encantado': '💖', 'Ensordecido': '🔇', 'Asustado': '😱',
  'Agarrado': '🤝', 'Incapacitado': '⛔', 'Invisible': '👻', 'Paralizado': '⚡',
  'Petrificado': '🪨', 'Envenenado': '☠️', 'Tumbado': '⬇️', 'Inmovilizado': '🔗',
  'Aturdido': '💫', 'Inconsciente': '😵', 'Agotamiento': '😰',
};

const CONDITION_COLORS = {
  'Cegado': '#888', 'Encantado': '#f8a', 'Ensordecido': '#888', 'Asustado': '#fa4',
  'Agarrado': '#4af', 'Incapacitado': '#f44', 'Invisible': '#a8f', 'Paralizado': '#ff4',
  'Petrificado': '#999', 'Envenenado': '#4c4', 'Tumbado': '#8af', 'Inmovilizado': '#f84',
  'Aturdido': '#fc4', 'Inconsciente': '#a44', 'Agotamiento': '#c84',
};

export default function ConditionsRef() {
  const navigate = useNavigate();
  const [conditions, setConditions] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getConditions().then(res => {
      const data = res.data || [];
      if (data.length > 0) {
        setConditions(data);
      } else {
        setConditions(FALLBACK_CONDITIONS.map((c, i) => ({ id: i + 1, ...c })));
      }
    }).catch(() => {
      setConditions(FALLBACK_CONDITIONS.map((c, i) => ({ id: i + 1, ...c })));
    });
  }, []);

  const filtered = conditions.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container fade-in" style={{ maxWidth: '900px' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>← Volver</button>

      <h1 style={{ textAlign: 'center', color: 'var(--accent-red-bright)', fontSize: '2.2rem', marginBottom: '0.3rem' }}>
        <AlertTriangle size={28} style={{ marginRight: '0.5rem' }} />
        Condiciones
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Las 15 condiciones del Manual del Jugador D&D 5E
      </p>

      {/* Search */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Buscar condición..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
      </div>

      {/* Conditions grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '0.8rem' }}>
        {filtered.map(condition => {
          const icon = CONDITION_ICONS[condition.name] || '⚠️';
          const color = CONDITION_COLORS[condition.name] || 'var(--accent-gold)';
          const isExpanded = expanded === condition.id;

          return (
            <div key={condition.id} className="glass-panel clickable" onClick={() => setExpanded(isExpanded ? null : condition.id)}
              style={{
                cursor: 'pointer', borderLeft: `3px solid ${color}`,
                padding: isExpanded ? '1.2rem' : '0.8rem 1.2rem'
              }}>
              <div className="flex-row flex-between">
                <div className="flex-row" style={{ gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>{icon}</span>
                  <strong style={{ color: '#fff', fontSize: '1rem' }}>{condition.name}</strong>
                </div>
                {isExpanded ? <ChevronUp size={16} style={{ color }} /> : <ChevronDown size={16} style={{ color }} />}
              </div>

              {isExpanded && (
                <div className="fade-in" style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #333' }}>
                  <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {condition.description}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
