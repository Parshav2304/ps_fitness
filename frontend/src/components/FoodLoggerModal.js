import React, { useState } from 'react';
import { FaTimes, FaBarcode, FaSearch } from 'react-icons/fa';
import FoodSearchEnhanced from './FoodSearchEnhanced';
import BarcodeScanner from './BarcodeScanner';

const FoodLoggerModal = ({ API_URL, onClose, onFoodLogged }) => {
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);
    const [servingSize, setServingSize] = useState(100);
    const [quantity, setQuantity] = useState(1);
    const [mealType, setMealType] = useState('breakfast');

    const handleFoodSelected = (food) => {
        setSelectedFood(food);
        setServingSize(food.serving_size || 100);
    };

    const handleBarcodeFood = (food) => {
        setShowBarcodeScanner(false);
        handleFoodSelected(food);
    };

    const handleLogFood = async () => {
        if (!selectedFood) return;

        const token = localStorage.getItem('token');
        const nutrition = selectedFood.nutrition || {};

        // Calculate nutrition based on serving size
        const baseServingSize = parseFloat(selectedFood.serving_size) || 100;
        const currentServingSize = parseFloat(servingSize) || 0;
        const currentQuantity = parseFloat(quantity) || 1;
        const multiplier = (currentServingSize / baseServingSize) * currentQuantity;

        const adjustedNutrition = {
            calories: Math.round((nutrition.calories || 0) * multiplier),
            protein: Math.round((nutrition.protein || 0) * multiplier * 10) / 10,
            carbs: Math.round((nutrition.carbs || 0) * multiplier * 10) / 10,
            fat: Math.round((nutrition.fat || 0) * multiplier * 10) / 10,
            fiber: Math.round((nutrition.fiber || 0) * multiplier * 10) / 10,
            sugar: Math.round((nutrition.sugar || 0) * multiplier * 10) / 10,
            sodium: Math.round((nutrition.sodium || 0) * multiplier * 10) / 10
        };

        try {
            const response = await fetch(`${API_URL}/food/log`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: selectedFood.name,
                    calories: adjustedNutrition.calories,
                    protein: adjustedNutrition.protein,
                    carbs: adjustedNutrition.carbs,
                    fats: adjustedNutrition.fat,
                    meal: mealType,
                    servings: multiplier,
                    date: new Date().toISOString()
                })
            });

            if (response.ok) {
                const data = await response.json();
                onFoodLogged(data);
                onClose();
            } else {
                alert('Failed to log food');
            }
        } catch (error) {
            console.error('Error logging food:', error);
            alert('Error logging food');
        }
    };

    if (showBarcodeScanner) {
        return (
            <BarcodeScanner
                API_URL={API_URL}
                onFoodFound={handleBarcodeFood}
                onClose={() => setShowBarcodeScanner(false)}
            />
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                borderRadius: '16px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '24px' }}>
                        <FaSearch style={{ marginRight: '10px' }} />
                        Log Food
                    </h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setShowBarcodeScanner(true)}
                            style={{
                                background: 'rgba(59, 130, 246, 0.2)',
                                border: '1px solid rgba(59, 130, 246, 0.5)',
                                color: '#60a5fa',
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
                            <FaBarcode /> Scan Barcode
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.5)',
                                color: '#f87171',
                                padding: '10px 15px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <FaTimes /> Close
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{
                    padding: '24px',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {!selectedFood ? (
                        <FoodSearchEnhanced
                            API_URL={API_URL}
                            onFoodSelected={handleFoodSelected}
                        />
                    ) : (
                        <div>
                            {/* Selected Food Details */}
                            <div style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '24px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '20px' }}>
                                            {selectedFood.name}
                                        </h3>
                                        {selectedFood.brand && (
                                            <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
                                                {selectedFood.brand}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSelectedFood(null)}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            color: '#9ca3af',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Change Food
                                    </button>
                                </div>

                                {/* Nutrition Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '16px',
                                    marginBottom: '20px'
                                }}>
                                    {[
                                        { label: 'Calories', value: selectedFood.nutrition?.calories || 0, color: '#60a5fa', unit: '' },
                                        { label: 'Protein', value: selectedFood.nutrition?.protein || 0, color: '#34d399', unit: 'g' },
                                        { label: 'Carbs', value: selectedFood.nutrition?.carbs || 0, color: '#fbbf24', unit: 'g' },
                                        { label: 'Fat', value: selectedFood.nutrition?.fat || 0, color: '#f87171', unit: 'g' }
                                    ].map((item, index) => (
                                        <div key={index} style={{
                                            background: 'rgba(0, 0, 0, 0.3)',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '24px', fontWeight: '700', color: item.color, marginBottom: '4px' }}>
                                                {Math.round((item.value * (parseFloat(servingSize) || 0) * parseFloat(quantity)) / (parseFloat(selectedFood.serving_size) || 100))}{item.unit}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                {item.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Input Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    {/* Serving Size Input */}
                                    <div>
                                        <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                                            Serving Size
                                        </label>
                                        <input
                                            type="number"
                                            value={servingSize}
                                            onChange={(e) => setServingSize(Number(e.target.value))}
                                            min="1"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                background: 'rgba(0, 0, 0, 0.3)',
                                                color: '#fff',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                    {/* Quantity Input */}
                                    <div>
                                        <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                                            Quantity
                                        </label>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            min="1"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                background: 'rgba(0, 0, 0, 0.3)',
                                                color: '#fff',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Meal Type Selection */}
                                <div>
                                    <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                                        Meal Type
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                        {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setMealType(type)}
                                                style={{
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    border: mealType === type ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.2)',
                                                    background: mealType === type ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                                                    color: mealType === type ? '#60a5fa' : '#9ca3af',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    textTransform: 'capitalize'
                                                }}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Log Button */}
                            <button
                                onClick={handleLogFood}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    color: '#fff',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                Log Food
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FoodLoggerModal;
