import React from 'react';
import { FiHome, FiActivity, FiPieChart, FiTrendingUp, FiMessageSquare, FiLogOut, FiSettings, FiZap, FiLayers } from 'react-icons/fi';

const Sidebar = ({ activeTab, setActiveTab, onLogout, onSettings, user }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: FiHome },
        { id: 'workout', label: 'Workouts', icon: FiActivity },
        { id: 'nutrition', label: 'Nutrition', icon: FiPieChart },
        { id: 'meal_plan', label: 'Meal Plan', icon: FiLayers },
        { id: 'progress', label: 'Analytics', icon: FiTrendingUp },
        { id: 'chat', label: 'AI Coach', icon: FiMessageSquare },
    ];

    return (
        <div className="sidebar">
            <div className="brand">
                <FiZap size={22} style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 8px var(--primary-glow))' }} />
                <h1>PS Fitness</h1>
            </div>

            {/* Gamification Profile Card */}
            {user && (
                <div style={{
                    padding: '16px',
                    margin: '0 0 24px 0',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>{user.username}</div>
                        <div style={{
                            background: 'var(--gradient-main)',
                            padding: '3px 8px',
                            borderRadius: '99px',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            color: '#fff',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            LVL {user.level || 1}
                        </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min(((user.xp || 0) / (user.xp_to_next_level || 1000)) * 100, 100)}%`,
                            height: '100%',
                            background: 'var(--gradient-main)',
                            borderRadius: '99px',
                            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {user.xp || 0} / {user.xp_to_next_level || 1000} XP
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <FiZap size={11} fill="var(--secondary)" style={{ color: 'var(--secondary)' }} />
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
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className="nav-item" onClick={onSettings} style={{ color: 'var(--text-muted)' }}>
                    <FiSettings size={18} />
                    <span>Settings</span>
                </button>
                <button className="nav-item" onClick={onLogout} style={{ color: 'var(--danger)' }}>
                    <FiLogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
