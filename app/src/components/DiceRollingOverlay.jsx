import React from 'react';

export default function DiceRollingOverlay({ rolling, onClose }) {
  if (!rolling) return null;
  const { description, formula, dieType, stage, total, dieValue, modifier } = rolling;

  // Determine neon glow color based on die type
  const getGlowColor = () => {
    switch (dieType) {
      case 'd4':  return 'rgba(255, 170, 0, 0.5)';    // Amber
      case 'd6':  return 'rgba(40, 200, 100, 0.5)';   // Emerald
      case 'd8':  return 'rgba(0, 120, 255, 0.5)';    // Sapphire
      case 'd10': return 'rgba(180, 80, 255, 0.5)';   // Amethyst
      case 'd12': return 'rgba(255, 60, 60, 0.5)';    // Ruby
      case 'd20':
      default:    return 'rgba(200, 155, 60, 0.6)';   // Gold
    }
  };

  const getAccentColor = () => {
    switch (dieType) {
      case 'd4':  return '#ffaa00';
      case 'd6':  return '#28c864';
      case 'd8':  return '#0078ff';
      case 'd10': return '#b450ff';
      case 'd12': return '#ff3c3c';
      case 'd20':
      default:    return 'var(--accent-gold)';
    }
  };

  const glowColor = getGlowColor();
  const accentColor = getAccentColor();

  const renderDieSVG = () => {
    const strokeColor = stage === 'result' ? accentColor : '#ccc';
    const fillOpacity = stage === 'result' ? '0.12' : '0.06';
    const strokeWidth = '2';

    switch (dieType) {
      case 'd4':
        return (
          <svg viewBox="0 0 100 100" className="ps-die-svg">
            <polygon points="50,10 10,85 90,85" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="50" y1="10" x2="50" y2="55" stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.5" />
            <line x1="10" y1="85" x2="50" y2="55" stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.5" />
            <line x1="90" y1="85" x2="50" y2="55" stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.5" />
          </svg>
        );
      case 'd6':
        return (
          <svg viewBox="0 0 100 100" className="ps-die-svg">
            <polygon points="50,10 90,30 50,50 10,30" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            <polygon points="10,30 50,50 50,90 10,70" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            <polygon points="50,50 90,30 90,70 50,90" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'd8':
        return (
          <svg viewBox="0 0 100 100" className="ps-die-svg">
            <polygon points="50,5 85,50 50,95 15,50" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="50" y1="5" x2="50" y2="95" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.4" />
            <line x1="15" y1="50" x2="85" y2="50" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.4" />
          </svg>
        );
      case 'd10':
        return (
          <svg viewBox="0 0 100 100" className="ps-die-svg">
            <polygon points="50,5 90,40 75,75 50,95 25,75 10,40" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="50" y1="5" x2="50" y2="55" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.4" />
            <line x1="50" y1="95" x2="50" y2="55" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.4" />
          </svg>
        );
      case 'd12':
        return (
          <svg viewBox="0 0 100 100" className="ps-die-svg">
            <polygon points="50,5 92,35 76,88 24,88 8,35" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            <polygon points="50,32 68,45 61,68 39,68 32,45" fill="none" stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.5" />
          </svg>
        );
      case 'd20':
      default:
        return (
          <svg viewBox="0 0 100 100" className="ps-die-svg">
            <polygon points="50,5 92,30 92,75 50,95 8,75 8,30" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            <polygon points="50,28 24,70 76,70" fill="none" stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.5" />
            <line x1="50" y1="5" x2="50" y2="28" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.4" />
            <line x1="92" y1="30" x2="76" y2="70" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.4" />
            <line x1="8" y1="30" x2="24" y2="70" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.4" />
            <line x1="92" y1="75" x2="76" y2="70" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.4" />
            <line x1="8" y1="75" x2="24" y2="70" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.4" />
            <line x1="50" y1="95" x2="76" y2="70" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.4" />
            <line x1="50" y1="95" x2="24" y2="70" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.4" />
          </svg>
        );
    }
  };

  // Show modifier sign nicely
  const modSign = modifier > 0 ? '+' : modifier < 0 ? '−' : null;
  const modAbs = Math.abs(modifier);
  const hasModifier = modifier !== 0;

  return (
    <div
      className={`ps-dice-overlay${stage === 'result' ? ' fade-out-delay' : ''}`}
      style={{ '--die-glow': glowColor, '--die-accent': accentColor }}
    >
      {/* Background glow */}
      <div className="ps-dice-glow-back" style={{ boxShadow: `0 0 120px 40px ${glowColor}` }} />

      <div className="ps-dice-container">
        {/* Description */}
        <div className="ps-dice-desc-text">{description || 'Tirando dados...'}</div>

        {/* Die + Result row */}
        <div className="ps-dice-main-row">
          {/* Die SVG with value inside */}
          <div className={`ps-die-wrapper${stage === 'rolling' ? ' ps-die-spinning' : ' ps-die-impact'}`}>
            {renderDieSVG()}
            {stage === 'result' && dieValue !== undefined && (
              <div
                className="ps-die-result-text pop-in"
                style={{ color: accentColor, textShadow: `0 0 16px ${glowColor}` }}
              >
                {dieValue}
              </div>
            )}
            {stage === 'rolling' && (
              <div className="ps-die-result-text" style={{ color: '#555', fontSize: '1rem', letterSpacing: '0.2em' }}>
                ···
              </div>
            )}
          </div>

          {/* Modifier badge — only if there's a modifier */}
          {stage === 'result' && hasModifier && (
            <div className="ps-dice-modifier-badge pop-in" style={{ borderColor: accentColor }}>
              <span className="ps-dice-mod-sign" style={{ color: accentColor }}>{modSign}</span>
              <span className="ps-dice-mod-val">{modAbs}</span>
              <span className="ps-dice-mod-label">MOD</span>
            </div>
          )}
        </div>

        {/* Total — shown only on result */}
        {stage === 'result' && (
          <div className="ps-dice-total-row pop-in">
            <span className="ps-dice-total-label">TOTAL</span>
            <span className="ps-dice-total-val" style={{ color: accentColor, textShadow: `0 0 20px ${glowColor}` }}>
              {total}
            </span>
          </div>
        )}

        {/* Formula chip */}
        <div className="ps-dice-formula-text">{formula}</div>
      </div>
    </div>
  );
}
