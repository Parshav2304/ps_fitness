import React from 'react';
import { FiHome, FiActivity, FiPieChart, FiTrendingUp, FiMessageSquare, FiLogOut, FiSettings, FiZap, FiLayers } from 'react-icons/fi';

const Sidebar = ({ activeTab, setActiveTab, onLogout, onSettings, user }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: FiHome },
        { id: 'workout', label: 'Workouts', icon: FiActivity },
        { id: 'nutrition', label: 'Nutrition', icon: FiPieChart },
        { id: 'meal_plan', label: 'Meal Architecture', icon: FiLayers },
        { id: 'progress', label: 'Analytics', icon: FiTrendingUp },
        { id: 'chat', label: 'Coach', icon: FiMessageSquare },
    ];

    return (
        <aside className="sidebar">
            <div className="brand">
                <div className="brand-icon">
                    <FiZap size={18} />
                </div>
                <h1>PS Fitness</h1>
                <span className="badge">PRO</span>
            </div>

            {/* Profile & Energy Metric Card */}
            {user && (
                <div style={{
                    padding: '14px 16px',
                    margin: '0 0 20px 0',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>{user.username}</div>
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            color: '#818cf8',
                            letterSpacing: '0.04em'
                        }}>
                            LVL {user.level || 1}
                        </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min(((user.xp || 0) / (user.xp_to_next_level || 1000)) * 100, 100)}%`,
                            height: '100%',
                            background: 'var(--primary)',
                            borderRadius: '99px',
                            transition: 'width 0.4s ease'
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {user.xp || 0} / {user.xp_to_next_level || 1000} XP
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <span>🔥</span>
                            {user.streak_days || 0}d streak
                        </div>
                    </div>
                </div>
            )}

            <nav className="nav-links">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <Icon size={17} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                <button className="nav-item" onClick={onSettings} style={{ color: 'var(--text-secondary)' }}>
                    <FiSettings size={17} />
                    <span>Settings</span>
                </button>
                <button className="nav-item" onClick={onLogout} style={{ color: 'var(--danger)' }}>
                    <FiLogOut size={17} />
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
