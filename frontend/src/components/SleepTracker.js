import React, { useState, useEffect, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { FaMoon, FaStar } from 'react-icons/fa';

const SleepTracker = ({ API_URL }) => {
    const [duration, setDuration] = useState(7.5);
    const [quality, setQuality] = useState(4);
    const [recentLogs, setRecentLogs] = useState([]);
    const [success, setSuccess] = useState(null);

    const fetchRecentSleep = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/sleep/recent`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRecentLogs(data.reverse()); // Show oldest to newest
            }
        } catch (e) { console.error(e); }
    }, [API_URL]);

    useEffect(() => {
        fetchRecentSleep();
    }, [fetchRecentSleep]);

    const handleLog = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/sleep/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ duration_hours: duration, quality })
            });

            if (res.ok) {
                setSuccess('Sleep logged! 🌙');
                setTimeout(() => setSuccess(null), 3000);
                fetchRecentSleep();
            }
        } catch (e) {
            alert("Failed to log sleep");
        }
    };

    // Chart Data
    const chartData = {
        labels: recentLogs.map(l => new Date(l.date).toLocaleDateString(undefined, { weekday: 'short' })),
        datasets: [{
            label: 'Hours',
            data: recentLogs.map(l => l.duration_hours),
            backgroundColor: '#818cf8',
            borderRadius: 4,
            hoverBackgroundColor: '#6366f1'
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#64748b', font: { size: 9 } },
                border: { display: false }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#64748b', font: { size: 9 } },
                border: { display: false }
            }
        },
        maxBarThickness: 15,
        borderRadius: 4
    };

    return (
        <div className="glass-panel" style={{ padding: '24px', height: '100%' }}>
            <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                <FaMoon style={{ color: '#818cf8' }} /> Sleep Tracker
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Inputs */}
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Duration</label>
                            <span style={{ fontWeight: 'bold', color: '#818cf8' }}>{duration}h</span>
                        </div>
                        <input
                            type="range" min="3" max="12" step="0.5"
                            value={duration} onChange={(e) => setDuration(parseFloat(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>Quality</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <FaStar
                                    key={s}
                                    size={20}
                                    color={s <= quality ? '#fbbf24' : 'rgba(255,255,255,0.1)'}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                    onClick={() => setQuality(s)}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleLog}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none',
                            borderRadius: '10px',
                            color: 'white',
                            fontWeight: '600',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            cursor: 'pointer'
                        }}
                    >
                        Log Sleep
                    </button>
                    {success && <div className="animate-fade-in" style={{ color: '#10b981', marginTop: '10px', fontSize: '0.9rem', fontWeight: '600' }}>{success}</div>}
                </div>

                {/* Mini Chart */}
                <div style={{ height: '180px', position: 'relative', width: '100%', minWidth: 0 }}>
                    {recentLogs.length > 0 ? (
                        <Bar options={chartOptions} data={chartData} />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            <FaMoon size={24} style={{ opacity: 0.2, marginBottom: '8px' }} />
                            <span style={{ fontSize: '0.85rem' }}>No data yet</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SleepTracker;
