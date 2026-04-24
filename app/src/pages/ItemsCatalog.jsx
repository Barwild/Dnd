import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItems, getMagicItems } from '../api';
import { Search, Shield, Sword, Gem, Package, ChevronDown, ChevronUp, Star } from 'lucide-react';

const ITEM_CATEGORIES = [
  'Arma', 'Armadura', 'Equipo de aventurero', 'Herramienta',
  'Monturas y vehículos', 'Arcano', 'Sagrado', 'Druídico'
];

const RARITY_COLORS = {
  'Común': '#aaa',
  'Poco común': '#4a4',
  'Raro': '#48f',
  'Muy raro': '#a4f',
  'Legendario': '#fa4',
  'Artefacto': '#f44',
  'common': '#aaa',
  'uncommon': '#4a4',
  'rare': '#48f',
  'very rare': '#a4f',
  'legendary': '#fa4',
  'artifact': '#f44',
};

const RARITY_ORDER = ['Común', 'Poco común', 'Raro', 'Muy raro', 'Legendario', 'Artefacto',
  'common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'];

export default function ItemsCatalog() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('mundane'); // mundane | magic
  const [items, setItems] = useState([]);
  const [magicItems, setMagicItems] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(0);
  const PER_PAGE = 30;

  const loadItems = useCallback(async () => {
    if (tab === 'mundane') {
      const params = { skip: page * PER_PAGE, limit: PER_PAGE };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const res = await getItems(params);
      setItems(res.data || []);
    } else {
      const params = { skip: page * PER_PAGE, limit: PER_PAGE };
      if (search) params.search = search;
      if (rarityFilter) params.rarity = rarityFilter;
      const res = await getMagicItems(params);
      setMagicItems(res.data || []);
    }
  }, [tab, page, search, categoryFilter, rarityFilter]);

  useEffect(() => { loadItems(); }, [loadItems]);
  useEffect(() => { setPage(0); }, [tab, search, categoryFilter, rarityFilter]);

  const toggleExpand = (id) => setExpanded(expanded === id ? null : id);

  const renderCost = (item) => {
    if (!item.cost_quantity) return '—';
    return `${item.cost_quantity} ${item.cost_unit}`;
  };

  return (
    <div className="container fade-in" style={{ maxWidth: '1100px' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>← Inicio</button>

      <h1 style={{ textAlign: 'center', color: 'var(--accent-gold)', fontSize: '2.2rem', marginBottom: '0.3rem' }}>
        🎒 Catálogo de Objetos
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Equipo, armas, armaduras y objetos mágicos del Compendio D&D 5E
      </p>

      {/* Tabs */}
      <div className="flex-row flex-center" style={{ gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button className={`btn ${tab === 'mundane' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setTab('mundane')}>
          <Package size={16} /> Equipo Mundano
        </button>
        <button className={`btn ${tab === 'magic' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setTab('magic')}>
          <Gem size={16} /> Objetos Mágicos
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="flex-row" style={{ gap: '0.8rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Buscar objeto..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
          </div>
          {tab === 'mundane' ? (
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: '180px' }}>
              <option value="">Toda Categoría</option>
              {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <select value={rarityFilter} onChange={e => setRarityFilter(e.target.value)} style={{ width: '150px' }}>
              <option value="">Toda Rareza</option>
              {['Común', 'Poco común', 'Raro', 'Muy raro', 'Legendario', 'Artefacto'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Items Grid */}
      {tab === 'mundane' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {items.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              {search || categoryFilter ? 'No se encontraron objetos.' : 'Busca un objeto o selecciona una categoría.'}
            </div>
          ) : items.map(item => (
            <div key={item.id} className="glass-panel clickable" onClick={() => toggleExpand(item.id)}
              style={{ padding: '0.8rem 1.2rem', borderLeft: item.damage_dice ? '3px solid var(--accent-red)' : item.category?.includes('Armadura') ? '3px solid var(--accent-blue)' : '3px solid var(--glass-border)' }}>
              <div className="flex-row flex-between">
                <div>
                  <strong style={{ color: '#fff', fontSize: '1rem' }}>{item.name}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</div>
                </div>
                <div className="flex-row" style={{ gap: '0.5rem' }}>
                  {item.damage_dice && (
                    <span className="badge badge-red"><Sword size={10} /> {item.damage_dice} {item.damage_type}</span>
                  )}
                  <span className="badge badge-gold">{renderCost(item)}</span>
                  {item.weight && item.weight !== '0' && (
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)', border: '1px solid #333' }}>{item.weight} lb</span>
                  )}
                  {expanded === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expanded === item.id && (
                <div className="fade-in" style={{ marginTop: '0.8rem', borderTop: '1px solid #333', paddingTop: '0.8rem', fontSize: '0.85rem', color: '#ccc' }}>
                  {item.description && <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{item.description}</p>}
                  {(() => { try {
                    const props = JSON.parse(item.properties || '[]');
                    return props.length > 0 ? (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong style={{ color: 'var(--accent-gold)' }}>Propiedades:</strong>{' '}
                        {props.map((p, i) => <span key={i} className="badge badge-gold" style={{ marginRight: '0.3rem' }}>{p.name || p}</span>)}
                      </div>
                    ) : null;
                  } catch { return null; } })()}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
          {magicItems.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              {search || rarityFilter ? 'No se encontraron objetos mágicos.' : 'Busca un objeto mágico o filtra por rareza.'}
            </div>
          ) : magicItems.map(item => {
            const rarColor = RARITY_COLORS[item.rarity] || '#888';
            return (
              <div key={item.id} className="glass-panel clickable" onClick={() => toggleExpand(`m${item.id}`)}
                style={{ padding: '1rem', borderLeft: `3px solid ${rarColor}` }}>
                <div className="flex-row flex-between">
                  <div>
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>{item.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: rarColor, fontWeight: 500 }}>
                      <Star size={10} style={{ marginRight: '4px' }} />{item.rarity}
                      {item.requires_attunement && <span style={{ color: 'var(--accent-purple)', marginLeft: '0.5rem' }}>⚡ Sintonía</span>}
                    </div>
                  </div>
                  {expanded === `m${item.id}` ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {expanded === `m${item.id}` && (
                  <div className="fade-in" style={{ marginTop: '0.8rem', borderTop: '1px solid #333', paddingTop: '0.8rem', fontSize: '0.85rem', color: '#ccc' }}>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{item.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex-row flex-center" style={{ gap: '0.5rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Anterior</button>
        <span style={{ color: 'var(--text-muted)' }}>Página {page + 1}</span>
        <button className="btn btn-ghost btn-sm"
          onClick={() => setPage(p => p + 1)}
          disabled={(tab === 'mundane' ? items.length : magicItems.length) < PER_PAGE}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}
