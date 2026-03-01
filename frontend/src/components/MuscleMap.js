import React, { useState } from 'react';

const MuscleMap = ({ onSelectMuscle }) => {
    const [view, setView] = useState('front'); // 'front' or 'back'
    const [hoveredMuscle, setHoveredMuscle] = useState(null);
    const [selectedMuscle, setSelectedMuscle] = useState(null);

    // Muscle Groups Mapping
    const muscleMapping = {
        'chest': 'Chest',
        'abs': 'Core',
        'quads': 'Legs',
        'shoulders': 'Shoulders',
        'biceps': 'Arms',
        'forearms': 'Arms',
        'traps': 'Back',
        'lats': 'Back',
        'lower_back': 'Back',
        'triceps': 'Arms',
        'glutes': 'Legs',
        'hamstrings': 'Legs',
        'calves': 'Legs'
    };

    const handleMuscleClick = (muscleId) => {
        const category = muscleMapping[muscleId];
        setSelectedMuscle(muscleId);
        if (category && onSelectMuscle) {
            onSelectMuscle(category);
        }
    };

    // Dynamic Styles
    const getPathStyle = (muscleId) => {
        const isHovered = hoveredMuscle === muscleId;
        const isSelected = selectedMuscle === muscleId;

        return {
            fill: isSelected ? 'url(#selectedGradient)' : isHovered ? 'url(#hoverGradient)' : 'rgba(255, 255, 255, 0.1)',
            stroke: isHovered || isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.2)',
            strokeWidth: isHovered || isSelected ? '2' : '1',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: isHovered || isSelected ? 'url(#glow)' : 'none',
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            transformOrigin: 'center'
        };
    };

    return (
        <div className="muscle-map-container" style={{ textAlign: 'center', padding: '10px', position: 'relative' }}>

            {/* View Toggle - Pill Shape */}
            <div style={{
                marginBottom: '30px',
                display: 'inline-flex',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '30px',
                padding: '5px',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <button
                    onClick={() => setView('front')}
                    style={{
                        padding: '10px 25px',
                        borderRadius: '25px',
                        background: view === 'front' ? 'var(--primary)' : 'transparent',
                        color: view === 'front' ? '#fff' : 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        boxShadow: view === 'front' ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none'
                    }}
                >
                    Front
                </button>
                <button
                    onClick={() => setView('back')}
                    style={{
                        padding: '10px 25px',
                        borderRadius: '25px',
                        background: view === 'back' ? 'var(--primary)' : 'transparent',
                        color: view === 'back' ? '#fff' : 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        boxShadow: view === 'back' ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none'
                    }}
                >
                    Back
                </button>
            </div>

            <div style={{ height: '550px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                {/* SVG Container */}
                <svg viewBox="0 0 200 400" height="100%" style={{ maxHeight: '550px', overflow: 'visible' }}>
                    <defs>
                        <linearGradient id="hoverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
                        </linearGradient>

                        <linearGradient id="selectedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.9" />
                        </linearGradient>

                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {view === 'front' ? (
                        <g id="front-view" className="animate-fade-in">
                            {/* Head */}
                            <circle cx="100" cy="35" r="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

                            {/* Shoulders */}
                            <path d="M68,62 Q55,75 50,90 L62,100 Q72,85 78,68 Z" style={getPathStyle('shoulders')} onClick={() => handleMuscleClick('shoulders')} onMouseEnter={() => setHoveredMuscle('shoulders')} onMouseLeave={() => setHoveredMuscle(null)} />
                            <path d="M132,62 Q145,75 150,90 L138,100 Q128,85 122,68 Z" style={getPathStyle('shoulders')} onClick={() => handleMuscleClick('shoulders')} onMouseEnter={() => setHoveredMuscle('shoulders')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Chest */}
                            <path d="M78,68 Q100,88 122,68 L118,105 Q100,115 82,105 Z" style={getPathStyle('chest')} onClick={() => handleMuscleClick('chest')} onMouseEnter={() => setHoveredMuscle('chest')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Biceps */}
                            <path d="M62,100 L52,135 Q60,140 68,130 Z" style={getPathStyle('biceps')} onClick={() => handleMuscleClick('biceps')} onMouseEnter={() => setHoveredMuscle('biceps')} onMouseLeave={() => setHoveredMuscle(null)} />
                            <path d="M138,100 L148,135 Q140,140 132,130 Z" style={getPathStyle('biceps')} onClick={() => handleMuscleClick('biceps')} onMouseEnter={() => setHoveredMuscle('biceps')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Forearms */}
                            <path d="M52,135 L42,165 Q50,170 58,160 Z" style={getPathStyle('forearms')} onClick={() => handleMuscleClick('forearms')} onMouseEnter={() => setHoveredMuscle('forearms')} onMouseLeave={() => setHoveredMuscle(null)} />
                            <path d="M148,135 L158,165 Q150,170 142,160 Z" style={getPathStyle('forearms')} onClick={() => handleMuscleClick('forearms')} onMouseEnter={() => setHoveredMuscle('forearms')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Abs */}
                            <path d="M82,105 Q100,115 118,105 L112,155 Q100,165 88,155 Z" style={getPathStyle('abs')} onClick={() => handleMuscleClick('abs')} onMouseEnter={() => setHoveredMuscle('abs')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Quads */}
                            <path d="M78,165 Q65,220 70,265 L92,265 Q98,220 92,165 Z" style={getPathStyle('quads')} onClick={() => handleMuscleClick('quads')} onMouseEnter={() => setHoveredMuscle('quads')} onMouseLeave={() => setHoveredMuscle(null)} />
                            <path d="M122,165 Q135,220 130,265 L108,265 Q102,220 108,165 Z" style={getPathStyle('quads')} onClick={() => handleMuscleClick('quads')} onMouseEnter={() => setHoveredMuscle('quads')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Calves */}
                            <path d="M70,275 Q60,310 65,355 L82,355 Q88,310 82,275 Z" style={getPathStyle('calves')} onClick={() => handleMuscleClick('calves')} onMouseEnter={() => setHoveredMuscle('calves')} onMouseLeave={() => setHoveredMuscle(null)} />
                            <path d="M130,275 Q140,310 135,355 L118,355 Q112,310 118,275 Z" style={getPathStyle('calves')} onClick={() => handleMuscleClick('calves')} onMouseEnter={() => setHoveredMuscle('calves')} onMouseLeave={() => setHoveredMuscle(null)} />
                        </g>
                    ) : (
                        <g id="back-view" className="animate-fade-in">
                            {/* Head */}
                            <circle cx="100" cy="35" r="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

                            {/* Traps */}
                            <path d="M80,60 L120,60 L112,80 L88,80 Z" style={getPathStyle('traps')} onClick={() => handleMuscleClick('traps')} onMouseEnter={() => setHoveredMuscle('traps')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Shoulders */}
                            <path d="M68,68 Q58,78 62,95 L78,85 Z" style={getPathStyle('shoulders')} onClick={() => handleMuscleClick('shoulders')} onMouseEnter={() => setHoveredMuscle('shoulders')} onMouseLeave={() => setHoveredMuscle(null)} />
                            <path d="M132,68 Q142,78 138,95 L122,85 Z" style={getPathStyle('shoulders')} onClick={() => handleMuscleClick('shoulders')} onMouseEnter={() => setHoveredMuscle('shoulders')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Lats */}
                            <path d="M78,85 L62,125 L90,145 L98,145 Z" style={getPathStyle('lats')} onClick={() => handleMuscleClick('lats')} onMouseEnter={() => setHoveredMuscle('lats')} onMouseLeave={() => setHoveredMuscle(null)} />
                            <path d="M122,85 L138,125 L110,145 L102,145 Z" style={getPathStyle('lats')} onClick={() => handleMuscleClick('lats')} onMouseEnter={() => setHoveredMuscle('lats')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Lower Back */}
                            <path d="M90,145 L110,145 L105,165 L95,165 Z" style={getPathStyle('lower_back')} onClick={() => handleMuscleClick('lower_back')} onMouseEnter={() => setHoveredMuscle('lower_back')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Triceps */}
                            <path d="M62,95 L52,130 Q62,135 68,125 Z" style={getPathStyle('triceps')} onClick={() => handleMuscleClick('triceps')} onMouseEnter={() => setHoveredMuscle('triceps')} onMouseLeave={() => setHoveredMuscle(null)} />
                            <path d="M138,95 L148,130 Q138,135 132,125 Z" style={getPathStyle('triceps')} onClick={() => handleMuscleClick('triceps')} onMouseEnter={() => setHoveredMuscle('triceps')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Glutes */}
                            <path d="M78,165 Q68,195 78,215 L98,215 Q102,195 98,165 Z" style={getPathStyle('glutes')} onClick={() => handleMuscleClick('glutes')} onMouseEnter={() => setHoveredMuscle('glutes')} onMouseLeave={() => setHoveredMuscle(null)} />
                            <path d="M122,165 Q132,195 122,215 L102,215 Q98,195 102,165 Z" style={getPathStyle('glutes')} onClick={() => handleMuscleClick('glutes')} onMouseEnter={() => setHoveredMuscle('glutes')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Hamstrings */}
                            <path d="M78,215 Q72,255 78,275 L95,275 Q98,255 95,215 Z" style={getPathStyle('hamstrings')} onClick={() => handleMuscleClick('hamstrings')} onMouseEnter={() => setHoveredMuscle('hamstrings')} onMouseLeave={() => setHoveredMuscle(null)} />
                            <path d="M122,215 Q128,255 122,275 L105,275 Q102,255 105,215 Z" style={getPathStyle('hamstrings')} onClick={() => handleMuscleClick('hamstrings')} onMouseEnter={() => setHoveredMuscle('hamstrings')} onMouseLeave={() => setHoveredMuscle(null)} />

                            {/* Calves */}
                            <path d="M78,275 Q68,305 78,355 L88,355 Q92,305 88,275 Z" style={getPathStyle('calves')} onClick={() => handleMuscleClick('calves')} onMouseEnter={() => setHoveredMuscle('calves')} onMouseLeave={() => setHoveredMuscle(null)} />
                            <path d="M122,275 Q132,305 122,355 L112,355 Q108,305 112,275 Z" style={getPathStyle('calves')} onClick={() => handleMuscleClick('calves')} onMouseEnter={() => setHoveredMuscle('calves')} onMouseLeave={() => setHoveredMuscle(null)} />
                        </g>
                    )}
                </svg>

                {/* Hover Label overlay */}
                {hoveredMuscle && (
                    <div className="animate-fade-in" style={{
                        position: 'absolute',
                        top: '40%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(15, 23, 42, 0.9)',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        color: '#fff',
                        pointerEvents: 'none',
                        border: '1px solid var(--primary)',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                        zIndex: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                    }}>
                        {muscleMapping[hoveredMuscle] || hoveredMuscle}
                    </div>
                )}
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: '5px', fontSize: '0.9rem' }}>
                {selectedMuscle ? 'Results for ' + (muscleMapping[selectedMuscle] || selectedMuscle) : 'Select a muscle group to view exercises'}
            </p>
        </div>
    );
};

export default MuscleMap;
