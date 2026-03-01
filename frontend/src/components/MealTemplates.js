import React, { useState, useEffect } from 'react';
import { FaPlus, FaSave, FaTrash, FaClock } from 'react-icons/fa';

const MealTemplates = ({ API_URL, onTemplateSelected }) => {
    const [templates, setTemplates] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateFoods, setNewTemplateFoods] = useState([]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/meal-templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates || []);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const createTemplate = async () => {
        if (!newTemplateName || newTemplateFoods.length === 0) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/meal-templates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newTemplateName,
                    foods: newTemplateFoods
                })
            });

            if (response.ok) {
                fetchTemplates();
                setShowCreateModal(false);
                setNewTemplateName('');
                setNewTemplateFoods([]);
            }
        } catch (error) {
            console.error('Error creating template:', error);
        }
    };

    const deleteTemplate = async (templateId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/meal-templates/${templateId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchTemplates();
            }
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    const calculateTemplateNutrition = (foods) => {
        return foods.reduce((total, food) => ({
            calories: total.calories + (food.nutrition?.calories || 0),
            protein: total.protein + (food.nutrition?.protein || 0),
            carbs: total.carbs + (food.nutrition?.carbs || 0),
            fat: total.fat + (food.nutrition?.fat || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h3 style={{ margin: 0, color: '#fff' }}>
                    <FaClock style={{ marginRight: '10px' }} />
                    Meal Templates
                </h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        border: 'none',
                        color: '#fff',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    <FaPlus /> Create Template
                </button>
            </div>

            {/* Templates Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px'
            }}>
                {templates.map((template) => {
                    const nutrition = calculateTemplateNutrition(template.foods);
                    return (
                        <div
                            key={template.id}
                            style={{
                                background: 'rgba(31, 41, 55, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(31, 41, 55, 0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(31, 41, 55, 0.5)'}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'start',
                                marginBottom: '12px'
                            }}>
                                <h4 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>
                                    {template.name}
                                </h4>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTemplate(template.id);
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#f87171',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    <FaTrash size={14} />
                                </button>
                            </div>

                            <div style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                                marginBottom: '12px'
                            }}>
                                {template.foods.length} items
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                <div style={{ fontSize: '13px' }}>
                                    <span style={{ color: '#60a5fa' }}>{Math.round(nutrition.calories)}</span> cal
                                </div>
                                <div style={{ fontSize: '13px' }}>
                                    <span style={{ color: '#34d399' }}>{Math.round(nutrition.protein)}g</span> protein
                                </div>
                                <div style={{ fontSize: '13px' }}>
                                    <span style={{ color: '#fbbf24' }}>{Math.round(nutrition.carbs)}g</span> carbs
                                </div>
                                <div style={{ fontSize: '13px' }}>
                                    <span style={{ color: '#f87171' }}>{Math.round(nutrition.fat)}g</span> fat
                                </div>
                            </div>

                            <button
                                onClick={() => onTemplateSelected(template)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(59, 130, 246, 0.5)',
                                    background: 'rgba(59, 130, 246, 0.2)',
                                    color: '#60a5fa',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                Use Template
                            </button>
                        </div>
                    );
                })}
            </div>

            {templates.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#9ca3af'
                }}>
                    No meal templates yet. Create one to save time logging common meals!
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                        borderRadius: '16px',
                        maxWidth: '500px',
                        width: '100%',
                        padding: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>Create Meal Template</h3>

                        <input
                            type="text"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            placeholder="Template name (e.g., 'Breakfast Combo')"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                background: 'rgba(0, 0, 0, 0.3)',
                                color: '#fff',
                                fontSize: '14px',
                                marginBottom: '16px'
                            }}
                        />

                        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
                            Note: Add foods to this template from your recent foods or favorites after creation.
                        </p>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    background: 'transparent',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createTemplate}
                                disabled={!newTemplateName}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: newTemplateName ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(59, 130, 246, 0.3)',
                                    color: '#fff',
                                    cursor: newTemplateName ? 'pointer' : 'not-allowed',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                <FaSave style={{ marginRight: '8px' }} />
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MealTemplates;
