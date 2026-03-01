import React from 'react';
import { FiHome, FiActivity, FiPieChart, FiTrendingUp, FiMessageSquare, FiLogOut, FiSettings, FiZap } from 'react-icons/fi';

const Sidebar = ({ activeTab, setActiveTab, onLogout, onSettings, user }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: FiHome },
        { id: 'workout', label: 'Workout Logger', icon: FiActivity },
        { id: 'nutrition', label: 'Nutrition', icon: FiPieChart },
        { id: 'meal_plan', label: 'Meal Plan', icon: FiPieChart },
        { id: 'progress', label: 'Analytics', icon: FiTrendingUp },
        { id: 'chat', label: 'AI Coach', icon: FiMessageSquare },
    ];

    return (
        <div className="sidebar">
            <div className="brand">
                <span style={{ fontSize: '2rem' }}>⚡</span>
                <h1>PS Fitness</h1>
            </div>

            {/* Gamification Profile Card */}
            {user && (
                <div style={{
                    padding: '15px',
                    margin: '0 15px 20px 15px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                        <div style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: '#fff'
                        }}>
                            LVL {user.level || 1}
                        </div>
                    </div>

                    {/* XP Bar */}
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min(((user.xp || 0) / (user.xp_to_next_level || 1000)) * 100, 100)}%`,
                            height: '100%',
                            background: '#f59e0b',
                            borderRadius: '3px',
                            transition: 'width 0.5s ease-out'
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {user.xp || 0} / {user.xp_to_next_level || 1000} XP
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                            <FiZap size={12} fill="#f59e0b" />
                            {user.streak_days || 0} Day Streak
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
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <button className="nav-item" onClick={onSettings} style={{ color: 'var(--text-muted)' }}>
                    <FiSettings size={20} />
                    <span>Settings</span>
                </button>
                <button className="nav-item" onClick={onLogout} style={{ color: '#f43f5e' }}>
                    <FiLogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
