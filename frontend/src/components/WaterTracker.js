import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaTint, FaMinus } from 'react-icons/fa';

const WaterTracker = ({ API_URL }) => {
    const [dailyTotal, setDailyTotal] = useState(0);
    const [goal] = useState(2500);

    const fetchTodayLog = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/hydration/today`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("💧 Fetched hydration:", data);
                setDailyTotal(data.total_ml || 0);
            }
        } catch (e) {
            console.error("💧 Fetch error:", e);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchTodayLog();
        // Refresh every 5 seconds to stay in sync
        const interval = setInterval(fetchTodayLog, 5000);
        return () => clearInterval(interval);
    }, [fetchTodayLog]);

    const handleUndoWater = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/hydration/undo`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchTodayLog(); // Refresh after undo
            }
        } catch (e) {
            console.error("💧 Undo error:", e);
        }
    };

    const handleAddWater = async (amount) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/hydration/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount_ml: amount })
            });

            if (res.ok) {
                fetchTodayLog(); // Refresh after logging
            }
        } catch (e) {
            console.error("💧 Error logging water:", e);
        }
    };

    const percentage = Math.min(100, Math.round((dailyTotal / goal) * 100));

    // Wave offset: 100% (empty) -> 0% (full)
    // Actually top: 100% is empty. top: 0% is full.
    // So top should be (100 - percentage)%
    const waveTop = 100 - percentage;

    return (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaTint style={{ color: '#3b82f6' }} /> Hydration
            </h3>

            <div className="wave-container" style={{
                width: '140px', height: '140px', margin: '0 0 24px 0',
                position: 'relative', background: '#1f2937'
            }}>
                {/* Wave Animation Element */}
                <div className="wave" style={{ top: `${waveTop}%` }} />

                {/* Text Overlay */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    zIndex: 10, textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff' }}>
                        {dailyTotal}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
                        / {goal} ml
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%' }}>
                <button
                    onClick={() => handleAddWater(250)}
                    style={{
                        padding: '12px',
                        fontSize: '0.9rem',
                        justifyContent: 'center',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                    }}
                >
                    <FaPlus size={10} style={{ marginRight: '6px' }} /> 250
                </button>
                <button
                    onClick={() => handleAddWater(500)}
                    style={{
                        padding: '12px',
                        fontSize: '0.9rem',
                        justifyContent: 'center',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                    }}
                >
                    <FaPlus size={10} style={{ marginRight: '6px' }} /> 500
                </button>
                <button
                    onClick={handleUndoWater}
                    style={{
                        padding: '12px',
                        fontSize: '0.9rem',
                        justifyContent: 'center',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                    }}
                    title="Undo last entry"
                >
                    <FaMinus size={10} style={{ marginRight: '6px' }} /> Undo
                </button>
            </div>
        </div>
    );
};

export default WaterTracker;
