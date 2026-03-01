import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { FaTrophy, FaFire, FaDumbbell, FaWeight, FaRulerCombined } from 'react-icons/fa';
import WaterTracker from './WaterTracker';
import SleepTracker from './SleepTracker';
import ProgressGallery from './ProgressGallery';

// Register ChartJS components including Filler for area charts
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AnalyticsDashboard = ({ API_URL, onProfileUpdate, hydration, refreshHydration }) => {
    console.log("📊 AnalyticsDashboard Props:", { hydration, refreshHydration: typeof refreshHydration });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for Log Weight Modal
    const [showLogModal, setShowLogModal] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [logSuccess, setLogSuccess] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/analytics/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch analytics');
                const jsonData = await res.json();
                setData(jsonData);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [API_URL]);

    if (loading) return (
        <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-pulse" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Loading Analytics...</div>
        </div>
    );
    if (error) return <div className="error-state">Error: {error}</div>;
    if (!data) return null;

    // Chart Options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                padding: 12,
                cornerRadius: 12,
                displayColors: false,
                borderWidth: 1,
                borderColor: 'rgba(139, 92, 246, 0.2)',
                intersect: false,
                mode: 'index',
                backdropFilter: 'blur(5px)'
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.03)' },
                ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
                border: { display: false }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
                border: { display: false }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        // Prevent giant bars when data is sparse
        maxBarThickness: 40,
        borderRadius: 6
    };

    // 1. Volume Data (Gradient Bar)
    const volumeData = {
        labels: data.volume_chart.labels,
        datasets: [{
            label: 'Volume (kg)',
            data: data.volume_chart.data,
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, '#8b5cf6');
                gradient.addColorStop(1, '#a78bfa');
                return gradient;
            },
            borderRadius: 6,
            hoverBackgroundColor: '#7c3aed'
        }],
    };

    // 2. Weight Trend Data (Gradient Area)
    const weightData = {
        labels: data.weight_trend.labels,
        datasets: [{
            label: 'Weight (kg)',
            data: data.weight_trend.data,
            borderColor: '#06b6d4',
            borderWidth: 2,
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
                gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
                return gradient;
            },
            pointBackgroundColor: '#0f172a',
            pointBorderColor: '#06b6d4',
            pointBorderWidth: 2,
            pointHoverBorderWidth: 3,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true,
        }],
    };

    const handleLogWeight = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const userRes = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
            const userData = await userRes.json();

            const formData = new FormData(e.target);
            const payload = {
                weight: parseFloat(newWeight),
                waist: formData.get('waist') ? parseFloat(formData.get('waist')) : null,
                chest: formData.get('chest') ? parseFloat(formData.get('chest')) : null,
                arms: formData.get('arms') ? parseFloat(formData.get('arms')) : null,
                height: userData.height || 175,
                activity_level: userData.activity_level ? ({
                    'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55,
                    'active': 1.725, 'very_active': 1.9
                }[userData.activity_level] || 1.55) : 1.55
            };

            const res = await fetch(`${API_URL}/progress/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to log');

            setLogSuccess('Weight logged! +20 XP');
            setTimeout(() => setLogSuccess(null), 3000);
            setShowLogModal(false);
            setNewWeight('');

            // Refresh data
            const refreshRes = await fetch(`${API_URL}/analytics/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const refreshData = await refreshRes.json();
            setData(refreshData);

            if (onProfileUpdate) onProfileUpdate();

        } catch (err) {
            alert('Failed to log weight: ' + err.message);
        }
    };

    return (
        <div className="analytics-container animate-fade-in" style={{ paddingBottom: '40px' }}>

            {/* Header / Actions */}
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.03em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Analytics
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.90rem' }}>Track your evolution</p>
                </div>
                <button
                    onClick={() => setShowLogModal(true)}
                    className="btn-primary"
                    style={{ padding: '10px 20px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}
                >
                    <FaWeight size={14} style={{ marginRight: '8px' }} /> Log Weight
                </button>
            </div>

            {/* Header Stats */}
            <div className="dashboard-grid" style={{ marginTop: 0, marginBottom: '32px' }}>
                <div className="col-span-3">
                    <StatCard
                        icon={<FaDumbbell style={{ color: '#8b5cf6' }} size={20} />}
                        label="Total Workouts"
                        value={data.stats.total_workouts}
                        trend="+2 this week"
                    />
                </div>
                <div className="col-span-3">
                    <StatCard
                        icon={<FaWeight style={{ color: '#f43f5e' }} size={20} />}
                        label="Total Volume"
                        value={`${(data.stats.total_volume / 1000).toFixed(1)}k`}
                        sub="kg"
                    />
                </div>
                <div className="col-span-3">
                    <StatCard
                        icon={<FaFire style={{ color: '#f59e0b' }} size={20} />}
                        label="Current Streak"
                        value={data.stats.current_streak}
                        sub="days"
                    />
                </div>
                <div className="col-span-3">
                    <StatCard
                        icon={<FaTrophy style={{ color: '#eab308' }} size={20} />}
                        label="PRs Broken"
                        value={data.best_lifts.length}
                    />
                </div>
            </div>

            {/* AI Insights & Trackers */}
            <div className="dashboard-grid" style={{ marginTop: 0, marginBottom: '32px' }}>
                <div className="col-span-4">
                    <WaterTracker API_URL={API_URL} />
                </div>
                <div className="col-span-4">
                    <SleepTracker API_URL={API_URL} />
                </div>
                <div className="col-span-4 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'auto' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                            <FaRulerCombined style={{ color: '#ec4899' }} /> Body Metrics
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer' }}>View History</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                        <div style={{ textAlign: 'center', padding: '20px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Waist</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                                {data.measurements_data?.waist?.slice(-1)[0] || '-'} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400' }}>cm</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '20px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Chest</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                                {data.measurements_data?.chest?.slice(-1)[0] || '-'} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400' }}>cm</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Charts Row */}
            <div className="dashboard-grid" style={{ marginTop: 0, marginBottom: '32px' }}>
                <div className="col-span-8 glass-panel" style={{ padding: '24px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '10px' }}>
                        <div style={{ width: '10px', height: '10px', background: '#8b5cf6', borderRadius: '50%' }}></div>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px', color: 'var(--text-main)' }}>
                        Volume Progression
                    </h3>
                    <div style={{ height: '300px' }}>
                        {data.volume_chart.data.length > 0 ? (
                            <Bar options={commonOptions} data={volumeData} />
                        ) : (
                            <EmptyState message="Log workouts to see volume stats" />
                        )}
                    </div>
                </div>

                <div className="col-span-4 glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px', color: 'var(--text-main)' }}>
                        Weight Trend
                    </h3>
                    <div style={{ height: '300px' }}>
                        {data.weight_trend.data.length > 0 ? (
                            <Line options={commonOptions} data={weightData} />
                        ) : (
                            <EmptyState message="Log weight to see trends" />
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Gallery */}
            <ProgressGallery API_URL={API_URL} />
            <div style={{ marginBottom: '32px' }}></div>


            {/* Weekly & Heatmap Grid */}
            <div className="dashboard-grid" style={{ marginTop: 0, alignItems: 'stretch' }}>
                {/* Best Lifts - Redesigned */}
                <div className="col-span-4 glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                        <FaTrophy style={{ color: '#eab308' }} /> Personal Records
                    </h3>

                    {data.best_lifts.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                            {data.best_lifts.slice(0, 4).map((lift, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'linear-gradient(90deg, rgba(255,255,255,0.03), transparent)',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    borderLeft: `3px solid ${['#f59e0b', '#94a3b8', '#b45309'][i] || 'rgba(255,255,255,0.1)'}`
                                }}>
                                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{lift.name}</div>
                                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                        {lift.weight}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '2px' }}>kg</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="No PRs yet" />
                    )}
                </div>

                {/* Consistency Heatmap */}
                <div className="col-span-4 glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                        <FaFire style={{ color: '#f59e0b' }} /> Consistency
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', alignContent: 'center', height: '100%', paddingBottom: '20px' }}>
                        {[...Array(28)].map((_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() - (27 - i));
                            const dateStr = date.toISOString().split('T')[0];
                            const active = data.consistency_heatmap.some(h => h.date === dateStr);

                            return (
                                <div
                                    key={i}
                                    title={dateStr}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '6px',
                                        backgroundColor: active ? '#10b981' : 'rgba(255,255,255,0.05)',
                                        boxShadow: active ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none',
                                        transition: 'all 0.3s'
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Weekly Summary - Redesigned */}
                <div className="col-span-4 glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '24px 24px 16px', background: 'rgba(255,255,255,0.02)' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                            <FaRulerCombined style={{ color: '#8b5cf6' }} /> Weekly Report
                        </h3>
                    </div>

                    {data.weekly_summary ? (
                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ fontSize: '1.05rem', lineHeight: '1.6', color: 'var(--text-main)', flex: 1 }}>
                                {data.weekly_summary.message}
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px',
                                background: data.weekly_summary.trend === 'up'
                                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1), transparent)'
                                    : 'linear-gradient(90deg, rgba(255, 255, 255, 0.05), transparent)',
                                borderRadius: '12px',
                                borderLeft: `4px solid ${data.weekly_summary.trend === 'up' ? '#10b981' : data.weekly_summary.trend === 'down' ? '#ef4444' : '#94a3b8'}`
                            }}>
                                <div style={{
                                    fontSize: '1.5rem',
                                    background: data.weekly_summary.trend === 'up' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {data.weekly_summary.trend === 'up' ? '📈' : data.weekly_summary.trend === 'down' ? '📉' : '⚖️'}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Trend Verdict</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: data.weekly_summary.trend === 'up' ? '#10b981' : 'var(--text-main)' }}>
                                        {data.weekly_summary.trend === 'up' ? 'Positive Growth' : data.weekly_summary.trend === 'down' ? 'Needs Focus' : 'Stable & Consistent'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (<div style={{ padding: '24px' }}>No data available</div>)}
                </div>
            </div>


            {/* Log Weight Modal */}
            {showLogModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ width: '450px', padding: '40px', position: 'relative', border: '1px solid rgba(139, 92, 246, 0.2)', boxShadow: '0 0 50px rgba(139, 92, 246, 0.15)' }}>
                        <button onClick={() => setShowLogModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: 700 }}>Log Current Weight</h2>

                        <form onSubmit={handleLogWeight}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Weight (kg)</label>
                                <input
                                    type="number"
                                    value={newWeight}
                                    onChange={(e) => setNewWeight(e.target.value)}
                                    placeholder="e.g. 75.5"
                                    step="0.1"
                                    autoFocus
                                    className="chat-input-field"
                                    style={{ width: '100%', fontSize: '1.5rem', fontWeight: 'bold', padding: '16px' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Waist</label>
                                    <input name="waist" type="number" step="0.1" className="chat-input-field" style={{ width: '100%', padding: '10px' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Chest</label>
                                    <input name="chest" type="number" step="0.1" className="chat-input-field" style={{ width: '100%', padding: '10px' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Arms</label>
                                    <input name="arms" type="number" step="0.1" className="chat-input-field" style={{ width: '100%', padding: '10px' }} />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                                Save Log (+20 XP)
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {logSuccess && (
                <div className="animate-fade-in" style={{
                    position: 'fixed', bottom: '30px', right: '30px',
                    background: '#10b981', color: '#fff', padding: '16px 24px', borderRadius: '12px', zIndex: 2000,
                    boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.5)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <span>🎉</span> {logSuccess}
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value, sub, trend }) => (
    <div className="glass-panel stat-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>{icon}</div>
        </div>
        <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                {value}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500', marginLeft: '4px' }}>{sub}</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
                {label}
            </div>
            {trend && <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px' }}>{trend}</div>}
        </div>
    </div>
);

const EmptyState = ({ message }) => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', minHeight: '150px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.2 }}>📊</div>
        <div style={{ fontSize: '0.95rem' }}>{message}</div>
    </div>
);

export default AnalyticsDashboard;
