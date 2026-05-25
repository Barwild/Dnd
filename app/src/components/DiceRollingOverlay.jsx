import React from 'react';

export default function DiceRollingOverlay({ rolling, onClose }) {
  if (!rolling) return null;
  const { description, formula, dieType, stage, total } = rolling;

  // Determine neon glow color based on die type
  const getGlowColor = () => {
    switch (dieType) {
      case 'd4': return 'rgba(255, 170, 0, 0.4)'; // Amber
      case 'd6': return 'rgba(40, 200, 100, 0.4)'; // Emerald Green
      case 'd8': return 'rgba(0, 120, 255, 0.4)'; // Sapphire Blue
      case 'd10': return 'rgba(180, 80, 255, 0.4)'; // Amethyst Purple
      case 'd12': return 'rgba(255, 60, 60, 0.4)'; // Ruby Red
      case 'd20':
      default:
        return 'rgba(200, 155, 60, 0.5)'; // Gold
    }
  };

  const glowColor = getGlowColor();

  // Render correct SVG geometry based on die type
  const renderDieSVG = () => {
    const strokeColor = stage === 'result' ? 'var(--accent-gold)' : '#fff';
    const fillOpacity = '0.07';
    const strokeWidth = '1.8';

    switch (dieType) {
      case 'd4':
        return (
          <svg viewBox="0 0 100 100" className="ps-die-svg">
            {/* Outline */}
            <polygon points="50,10 10,85 90,85" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Center connections */}
            <line x1="50" y1="10" x2="50" y2="55" stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={stage === 'rolling' ? '1 1' : 'none'} />
            <line x1="10" y1="85" x2="50" y2="55" stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={stage === 'rolling' ? '1 1' : 'none'} />
            <line x1="90" y1="85" x2="50" y2="55" stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={stage === 'rolling' ? '1 1' : 'none'} />
          </svg>
        );
      case 'd6':
        return (
          <svg viewBox="0 0 100 100" className="ps-die-svg">
            {/* Isometric Cube Faces */}
            <polygon points="50,10 90,30 50,50 10,30" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            <polygon points="10,30 50,50 50,90 10,70" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            <polygon points="50,50 90,30 90,70 50,90" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'd8':
        return (
          <svg viewBox="0 0 100 100" className="ps-die-svg">
            {/* Octahedron Outline */}
            <polygon points="50,5 85,50 50,95 15,50" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Center diamond lines */}
            <line x1="50" y1="5" x2="50" y2="95" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="15" y1="50" x2="50" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="85" y1="50" x2="50" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="50" y1="5" x2="15" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="50" y1="5" x2="85" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="50" y1="95" x2="15" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="50" y1="95" x2="85" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'd10':
        return (
          <svg viewBox="0 0 100 100" className="ps-die-svg">
            <polygon points="50,5 90,40 75,75 50,95 25,75 10,40" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Kite structure */}
            <line x1="50" y1="5" x2="50" y2="55" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="50" y1="95" x2="50" y2="55" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="10" y1="40" x2="50" y2="55" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="90" y1="40" x2="50" y2="55" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="25" y1="75" x2="50" y2="55" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="75" y1="75" x2="50" y2="55" stroke={strokeColor} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'd12':
        return (
          <svg viewBox="0 0 100 100" className="ps-die-svg">
            {/* Dodecahedron Outer Hexagon */}
            <polygon points="50,5 92,35 76,88 24,88 8,35" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Inner Pentagon */}
            <polygon points="50,32 68,45 61,68 39,68 32,45" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Connecting lines */}
            <line x1="50" y1="5" x2="50" y2="32" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="92" y1="35" x2="68" y2="45" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="76" y1="88" x2="61" y2="68" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="24" y1="88" x2="39" y2="68" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="8" y1="35" x2="32" y2="45" stroke={strokeColor} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'd20':
      default:
        return (
          <svg viewBox="0 0 100 100" className="ps-die-svg">
            {/* Outer Hexagon */}
            <polygon points="50,5 92,30 92,75 50,95 8,75 8,30" fill="#fff" fillOpacity={fillOpacity} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Inner Triangle */}
            <polygon points="50,28 24,70 76,70" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Connections */}
            <line x1="50" y1="5" x2="50" y2="28" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="92" y1="30" x2="76" y2="70" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="92" y1="75" x2="76" y2="70" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="50" y1="95" x2="76" y2="70" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="50" y1="95" x2="24" y2="70" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="8" y1="75" x2="24" y2="70" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="8" y1="30" x2="24" y2="70" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="50" y1="28" x2="24" y2="70" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="50" y1="28" x2="76" y2="70" stroke={strokeColor} strokeWidth={strokeWidth} />
          </svg>
        );
    }
  };

  return (
    <div className={`ps-dice-overlay ${stage === 'result' ? 'fade-out-delay' : ''}`}>
      <div className="ps-dice-glow-back" style={{ boxShadow: `0 0 100px 30px ${glowColor}` }} />
      
      <div className="ps-dice-container">
        {/* Die Wrapper */}
        <div className={`ps-die-wrapper ${stage === 'rolling' ? 'ps-die-spinning' : 'ps-die-impact'}`}>
          {renderDieSVG()}
          
          {/* Result Number inside Die */}
          {stage === 'result' && (
            <div className="ps-die-result-text pop-in">
              {total}
            </div>
          )}
        </div>

        {/* Rolling Status / Description */}
        <div className="ps-dice-info-panel">
          <div className="ps-dice-desc-text">{description || 'Tirando dados...'}</div>
          <div className="ps-dice-formula-text">{formula}</div>
          
          {stage === 'result' && (
            <div className="ps-dice-final-banner glow-text">
              ¡Resultado obtenido!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
