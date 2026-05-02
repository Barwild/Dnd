import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCharacter, updateCharacter, getItems, getCharacterEquipment, getCharacterWeapons, getCharacterArmor, equipItem, unequipItem, rollDice } from '../api';
import { Shield, Swords, ArrowLeft, Coins, ShieldPlus } from 'lucide-react';
import { useAuth } from '../AuthContext';

const COIN_VALUES = { cp: 1, sp: 10, ep: 50, gp: 100, pp: 1000 };

export default function EquipmentSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [character, setCharacter] = useState(null);
  const [stats, setStats] = useState({});
  const [equipment, setEquipment] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [armor, setArmor] = useState([]);
  const [equipmentStats, setEquipmentStats] = useState(null);
  
  const [shopItems, setShopItems] = useState([]);
  const [shopPage, setShopPage] = useState(0);
  const [shopSearch, setShopSearch] = useState('');
  const [shopLoading, setShopLoading] = useState(false);
  const [shopExpanded, setShopExpanded] = useState(null);
  const [diceResult, setDiceResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const normalizeCoins = (coins) => ({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, ...coins });
  const parseCoins = (coins) => {
    if (typeof coins === 'string') {
      try { return JSON.parse(coins || '{}'); } catch { return {}; }
    }
    return coins || {};
  };
  const totalCopper = (coins) => Object.entries(normalizeCoins(parseCoins(coins)))
    .reduce((sum, [k, v]) => sum + (Number(v) || 0) * (COIN_VALUES[k] || 0), 0);
  const copperToCoins = (copper) => {
    let remaining = Math.max(0, Math.floor(copper));
    const result = {};
    result.pp = Math.floor(remaining / COIN_VALUES.pp); remaining %= COIN_VALUES.pp;
    result.gp = Math.floor(remaining / COIN_VALUES.gp); remaining %= COIN_VALUES.gp;
    result.ep = Math.floor(remaining / COIN_VALUES.ep); remaining %= COIN_VALUES.ep;
    result.sp = Math.floor(remaining / COIN_VALUES.sp); remaining %= COIN_VALUES.sp;
    result.cp = remaining;
    return result;
  };
  const formatCoins = (coins) => {
    const normalized = normalizeCoins(parseCoins(coins));
    return Object.entries(normalized)
      .filter(([, value]) => value !== undefined && value !== null && value !== 0)
      .map(([coin, value]) => `${value}${coin}`)
      .join(' ') || '0cp';
  };
  const setCoinValue = async (coin, value) => {
    const amount = Math.max(0, parseInt(value, 10) || 0);
    const newStats = {
      ...stats,
      coins: { ...normalizeCoins(stats.coins), [coin]: amount }
    };
    setStats(newStats);
    // Auto-save coins
    await updateCharacter(id, { stats: JSON.stringify(newStats) });
  };
  
  const renderCost = (item) => {
    if (!item.cost_quantity) return 'Gratis';
    return `${item.cost_quantity} ${item.cost_unit || 'gp'}`;
  };

  const load = async () => {
    try {
      const res = await getCharacter(id);
      const char = res.data;
      
      let statsObj = {};
      try { statsObj = JSON.parse(char.stats || '{}'); } catch {}
      statsObj.coins = normalizeCoins(parseCoins(statsObj.coins));
      
      let eq = [];
      try { 
        const parsed = JSON.parse(char.equipment || '[]'); 
        if (Array.isArray(parsed)) eq = parsed;
      } catch {}
      if (eq.length === 0 && char.starting_equipment) {
        try { 
          const parsedStart = JSON.parse(char.starting_equipment || '[]'); 
          if (Array.isArray(parsedStart)) eq = parsedStart;
        } catch {}
      }

      setCharacter(char);
      setStats(statsObj);
      setEquipment(Array.isArray(eq) ? eq : []);

      await loadEquipmentData(id);
    } catch (e) { console.error(e); }
  };

  const loadEquipmentData = async (characterId) => {
    try {
      const equipRes = await getCharacterEquipment(characterId);
      setEquipmentStats(equipRes.data.equipment_stats);
      
      const weaponsRes = await getCharacterWeapons(characterId);
      setWeapons(Array.isArray(weaponsRes.data) ? weaponsRes.data : []);
      
      const armorRes = await getCharacterArmor(characterId);
      setArmor(Array.isArray(armorRes.data) ? armorRes.data : []);
    } catch (e) {
      console.error('Error cargando datos de equipo:', e);
    }
  };

  const loadShopItems = async () => {
    setShopLoading(true);
    try {
      const params = { skip: shopPage * 20, limit: 20 };
      if (shopSearch) params.search = shopSearch;
      const res = await getItems(params);
      setShopItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setShopLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { loadShopItems(); }, [shopPage, shopSearch]);

  const saveEquipment = async (newEq) => {
    await updateCharacter(id, { equipment: JSON.stringify(newEq) });
  };

  const buyItem = async (item) => {
    const costCopper = (Number(item.cost_quantity) || 0) * (COIN_VALUES[(item.cost_unit || 'gp').toLowerCase()] || COIN_VALUES.gp);
    const currentCopper = totalCopper(stats.coins);
    if (costCopper > currentCopper) {
      alert('No tienes suficiente dinero.');
      return;
    }

    const remaining = copperToCoins(currentCopper - costCopper);
    const newStats = { ...stats, coins: remaining };
    setStats(newStats);
    
    const newItem = { 
      id: item.id, name: item.name, cost: renderCost(item), category: item.category,
      damage_dice: item.damage_dice, damage_type: item.damage_type, weapon_range: item.weapon_range,
      armor_class_base: item.armor_class_base, armor_class_dex_bonus: item.armor_class_dex_bonus,
      stealth_disadvantage: item.stealth_disadvantage, properties: item.properties || []
    };
    
    const newEq = [...equipment, newItem];
    setEquipment(newEq);
    
    await updateCharacter(id, { stats: JSON.stringify(newStats), equipment: JSON.stringify(newEq) });
    alert(`Comprado ${item.name}.`);
    
    if (item.category === 'Weapon' || item.category === 'Armor') {
      if (window.confirm(`¿Quieres equipar ${item.name} ahora?`)) {
        equipItemToCharacter(item.id, item.category === 'Weapon' ? 'weapon' : 'armor');
      }
    }
  };

  const equipItemToCharacter = async (itemId, slot) => {
    try {
      const result = await equipItem(id, itemId, slot);
      if (result.data.success) {
        alert(`${result.data.equipped_item.name} equipado en ranura ${slot}`);
        await loadEquipmentData(id);
      } else {
        alert('Error al equipar item: ' + (result.data.error || 'Desconocido'));
      }
    } catch (e) { alert('Error al equipar item'); }
  };

  const unequipItemFromCharacter = async (slot) => {
    try {
      const result = await unequipItem(id, slot);
      if (result.data.success) {
        alert(`Item desequipado`);
        await loadEquipmentData(id);
      }
    } catch (e) { alert('Error al desequipar item'); }
  };

  const removeEquipment = async (index) => {
    const newEq = equipment.filter((_, j) => j !== index);
    setEquipment(newEq);
    await saveEquipment(newEq);
  };

  const handleRoll = async (formula, desc) => {
    try {
      const res = await rollDice({ dice_formula: formula, character_name: character?.name || '', description: desc, roll_type: 'combat' });
      setDiceResult({ ...res.data, description: desc });
      setTimeout(() => setDiceResult(null), 5000);
    } catch {}
  };

  const mod = (val) => Math.floor(((val || 10) - 10) / 2);
  const profBonus = Math.ceil((character?.level || 1) / 4) + 1;

  const rollWeaponAttack = (weapon) => {
    // Detect if we should use DEX or STR
    const isFinesse = weapon.properties && weapon.properties.includes('Finesse');
    const isRanged = weapon.weapon_range && weapon.weapon_range.includes('ft');
    const dex = stats.DEX || 10;
    const str = stats.STR || 10;
    const statKey = isRanged ? 'DEX' : (isFinesse ? (dex > str ? 'DEX' : 'STR') : 'STR');
    
    const attackMod = mod(stats[statKey]) + profBonus;
    handleRoll(`1d20${attackMod >= 0 ? '+' : ''}${attackMod}`, `Ataque con ${weapon.name} (${statKey})`);
  };

  const rollWeaponDamage = (weapon) => {
    if (!weapon.damage_dice) return;
    const isFinesse = weapon.properties && weapon.properties.includes('Finesse');
    const isRanged = weapon.weapon_range && weapon.weapon_range.includes('ft');
    const dex = stats.DEX || 10;
    const str = stats.STR || 10;
    const statKey = isRanged ? 'DEX' : (isFinesse ? (dex > str ? 'DEX' : 'STR') : 'STR');
    
    const damageMod = mod(stats[statKey]);
    handleRoll(`${weapon.damage_dice}${damageMod >= 0 ? '+' : ''}${damageMod}`, `Daño con ${weapon.name} (${weapon.damage_type})`);
  };

  if (!character) return <div className="page-center"><h2>Cargando inventario...</h2></div>;

  return (
    <div className="container fade-in" style={{ maxWidth: '900px', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="flex-row flex-between" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex-row" style={{ gap: '0.8rem', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/character/${id}`)}>
            <ArrowLeft size={16} /> Volver a la Ficha
          </button>
          <h2 style={{ margin: 0, color: 'var(--accent-gold)', fontSize: '1.2rem' }}>Armería de {character.name}</h2>
        </div>
      </div>

      {diceResult && (
        <div className="glass-panel slide-up" style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 999, borderColor: 'var(--accent-red)', padding: '1rem', maxWidth: '300px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{diceResult.description}</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-red)' }}>{diceResult.total}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>{diceResult.dice_formula}</div>
        </div>
      )}

      {equipmentStats && (
        <div className="glass-panel" style={{ marginBottom: '1.5rem', borderTop: '3px solid var(--accent-gold)' }}>
          <h3><ShieldPlus size={18} /> Estadísticas de Combate Actuales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-blue)' }}>
              <div style={{ color: 'var(--accent-blue)', fontWeight: 'bold', marginBottom: '0.5rem' }}>Clase de Armadura</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{equipmentStats.armor_class || (10 + mod(stats.DEX))}</div>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>{equipmentStats.armor_class ? 'Con armadura equipada' : 'Armadura Natural'}</div>
            </div>
            {equipmentStats.weapon_damage && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-red)' }}>
                <div style={{ color: 'var(--accent-red)', fontWeight: 'bold', marginBottom: '0.5rem' }}>Arma Principal Equip.</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                  {equipmentStats.weapon_damage.name}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {equipmentStats.weapon_damage.damage_dice} {equipmentStats.weapon_damage.damage_type && `(${equipmentStats.weapon_damage.damage_type})`}
                </div>
              </div>
            )}
          </div>
          {equipmentStats.stealth_disadvantage && (
            <div style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', padding: '0.5rem', borderRadius: '6px', marginTop: '1rem' }}>
              <span style={{ color: '#ff6b6b' }}>⚠️ Penalización: Tu armadura te otorga desventaja en Sigilo.</span>
            </div>
          )}
        </div>
      )}

      {/* Armas */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3><Swords size={18} /> Mis Armas</h3>
        {weapons.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No tienes armas. Cómpralas en la tienda.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {weapons.map((weapon, index) => {
              const isEquipped = equipmentStats?.equipment_slots?.weapon?.id === weapon.id;
              return (
                <div key={index} style={{ 
                  background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px',
                  border: isEquipped ? '2px solid var(--accent-red)' : '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div className="flex-row flex-between" style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent-red)' }}>{weapon.name}</div>
                    {isEquipped && <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>Equipada</span>}
                  </div>
                  
                  <div className="flex-row flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.8rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                      {weapon.damage_dice || '-'} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#aaa' }}>{weapon.damage_type}</span>
                    </div>
                    {weapon.weapon_range && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{weapon.weapon_range}</div>}
                  </div>

                  <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '0.8rem' }}>
                    <button className="btn btn-sm" style={{ flex: 1, background: '#842', color: '#fff', border: 'none' }} onClick={() => rollWeaponAttack(weapon)}>
                      🎲 Ataque
                    </button>
                    <button className="btn btn-sm" style={{ flex: 1, background: '#822', color: '#fff', border: 'none' }} onClick={() => rollWeaponDamage(weapon)}>
                      🩸 Daño
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => equipItemToCharacter(weapon.id, 'weapon')}
                      className="btn btn-sm btn-secondary" 
                      style={{ flex: 1, padding: '0.4rem' }}
                      disabled={isEquipped}
                    >
                      {isEquipped ? '✓ En uso' : 'Equipar'}
                    </button>
                    {isEquipped && (
                      <button onClick={() => unequipItemFromCharacter('weapon')} className="btn btn-danger btn-sm" style={{ padding: '0.4rem' }}>
                        Desequipar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Armaduras */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3><Shield size={18} /> Mis Armaduras y Escudos</h3>
        {armor.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No tienes armaduras.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {armor.map((armorItem, index) => {
              const isEquipped = equipmentStats?.equipment_slots?.armor?.id === armorItem.id || equipmentStats?.equipment_slots?.shield?.id === armorItem.id;
              const slotToUse = armorItem.category === 'Shield' ? 'shield' : 'armor';
              return (
                <div key={index} style={{ 
                  background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px',
                  border: isEquipped ? '2px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div className="flex-row flex-between" style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>{armorItem.name}</div>
                    {isEquipped && <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>En uso</span>}
                  </div>
                  
                  {armorItem.armor_class_base && (
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                      🛡️ CA: {armorItem.armor_class_base}
                      {armorItem.armor_class_dex_bonus && <span style={{ fontSize: '0.9rem', color: '#888' }}> + DES</span>}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                    <button 
                      onClick={() => equipItemToCharacter(armorItem.id, slotToUse)}
                      className="btn btn-sm btn-secondary" 
                      style={{ flex: 1, padding: '0.4rem' }}
                      disabled={isEquipped}
                    >
                      {isEquipped ? '✓ En uso' : 'Equipar'}
                    </button>
                    {isEquipped && (
                      <button onClick={() => unequipItemFromCharacter(slotToUse)} className="btn btn-danger btn-sm" style={{ padding: '0.4rem' }}>
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generic Equipment List */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3>Mochila e Inventario</h3>
        {equipment.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Inventario vacío.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {equipment.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.6rem 1rem', borderRadius: '6px' }}>
                <span style={{ color: '#eee' }}>{item.name || item}</span>
                <button className="btn btn-danger btn-sm" onClick={() => removeEquipment(i)} style={{ padding: '0.2rem 0.5rem' }}>Tirar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tienda */}
      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <div className="flex-row flex-between" style={{ marginBottom: '1rem' }}>
          <h3><Coins size={18} /> Monedas y Tienda</h3>
          <span className="badge badge-gold" style={{ fontSize: '0.95rem' }}>{formatCoins(stats.coins)}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
          {Object.entries(normalizeCoins(stats.coins)).map(([coin, value]) => (
            <div key={coin} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.7rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 'bold' }}>{coin.toUpperCase()}</div>
              <input type="number" min="0" value={value}
                onChange={e => setCoinValue(coin, e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center', outline: 'none' }} />
            </div>
          ))}
        </div>

        <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Buscar armas, armaduras, objetos..." value={shopSearch}
            onChange={e => { setShopSearch(e.target.value); setShopPage(0); }}
            style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff' }} />
          <button className="btn btn-secondary" onClick={loadShopItems}>Buscar</button>
        </div>

        {shopLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando tienda...</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {shopItems.map(item => {
              const costCopper = (Number(item.cost_quantity) || 0) * (COIN_VALUES[(item.cost_unit || 'gp').toLowerCase()] || COIN_VALUES.gp);
              const currentCopper = totalCopper(stats.coins);
              const canBuy = costCopper > 0 && costCopper <= currentCopper;
              return (
                <div key={item.id} className="glass-panel" style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.15)', borderRadius: '10px' }}>
                  <div className="flex-row flex-between" style={{ gap: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#fff' }}>{item.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{renderCost(item)} • {item.category}</div>
                    </div>
                    <button className={`btn btn-sm ${canBuy ? 'btn-gold' : 'btn-ghost'}`} disabled={!canBuy} onClick={() => buyItem(item)}>
                      {canBuy ? 'Comprar' : 'Muy caro'}
                    </button>
                  </div>
                  <div className="flex-row" style={{ marginTop: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShopExpanded(shopExpanded === item.id ? null : item.id)} style={{ fontSize: '0.75rem' }}>
                      {shopExpanded === item.id ? 'Ocultar' : 'Ver'} detalles
                    </button>
                  </div>
                  {shopExpanded === item.id && item.description && (
                    <p style={{ marginTop: '0.5rem', color: '#ccc', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>{item.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-row flex-between" style={{ marginTop: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShopPage(p => Math.max(0, p - 1))} disabled={shopPage === 0}>← Anterior</button>
          <span style={{ color: '#888' }}>Página {shopPage + 1}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setShopPage(p => p + 1)} disabled={shopItems.length < 20}>Siguiente →</button>
        </div>
      </div>
    </div>
  );
}
