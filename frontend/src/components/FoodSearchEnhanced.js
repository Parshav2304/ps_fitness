import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback definition just in case, though it was unused in import? Wait, it IS used!
import { FaStar, FaRegStar, FaClock, FaPlus } from 'react-icons/fa';

const FoodSearchEnhanced = ({ API_URL, onFoodSelected }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [recentFoods, setRecentFoods] = useState([]);
    const [favoriteFoods, setFavoriteFoods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('search'); // search, recent, favorites
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchRecentFoods = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/foods/recent?limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRecentFoods(data.recent_foods || []);
            }
        } catch (error) {
            console.error('Error fetching recent foods:', error);
        }
    }, [API_URL]);

    const fetchFavorites = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/foods/favorites`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFavoriteFoods(data.favorites || []);
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchRecentFoods();
        fetchFavorites();
    }, [fetchRecentFoods, fetchFavorites]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                // To avoid referring to searchFoods closure in dependency array, we can just fetch here or disable eslint rule,
                // but searchFoods does not depend on much state.
                searchFoods(searchQuery, 1);
                setActiveTab('search');
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

    const searchFoods = async (query, pageNum = 1) => {
        if (!query || query.length < 2) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${API_URL}/api/foods/search?query=${encodeURIComponent(query)}&page=${pageNum}&page_size=20`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.foods || []);
                setTotalPages(data.total_pages || 0);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Error searching foods:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            searchFoods(searchQuery, 1);
            setActiveTab('search');
        }
    };

    const toggleFavorite = async (food) => {
        const isFavorited = favoriteFoods.some(f => f.id === food.id);
        const token = localStorage.getItem('token');

        try {
            if (isFavorited) {
                // Remove from favorites
                const response = await fetch(`${API_URL}/api/foods/favorites/${food.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    setFavoriteFoods(favoriteFoods.filter(f => f.id !== food.id));
                }
            } else {
                // Add to favorites
                const response = await fetch(`${API_URL}/api/foods/favorites`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(food)
                });
                if (response.ok) {
                    setFavoriteFoods([...favoriteFoods, food]);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const FoodItem = ({ food, showFavorite = true }) => {
        const isFavorited = favoriteFoods.some(f => f.id === food.id);
        const nutrition = food.nutrition || {};

        return (
            <div style={{
                background: 'rgba(31, 41, 55, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
            }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(31, 41, 55, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(31, 41, 55, 0.5)'}
            >
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>
                            {food.name}
                        </h4>
                        {food.brand && (
                            <span style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                                background: 'rgba(59, 130, 246, 0.1)',
                                padding: '2px 8px',
                                borderRadius: '4px'
                            }}>
                                {food.brand}
                            </span>
                        )}
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '12px',
                        fontSize: '13px',
                        color: '#9ca3af'
                    }}>
                        <div>
                            <span style={{ color: '#60a5fa' }}>{nutrition.calories || 0}</span> cal
                        </div>
                        <div>
                            <span style={{ color: '#34d399' }}>{nutrition.protein || 0}g</span> protein
                        </div>
                        <div>
                            <span style={{ color: '#fbbf24' }}>{nutrition.carbs || 0}g</span> carbs
                        </div>
                        <div>
                            <span style={{ color: '#f87171' }}>{nutrition.fat || 0}g</span> fat
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {showFavorite && (
                        <button
                            onClick={() => toggleFavorite(food)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: isFavorited ? '#fbbf24' : '#6b7280',
                                cursor: 'pointer',
                                fontSize: '20px',
                                padding: '8px'
                            }}
                            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            {isFavorited ? <FaStar /> : <FaRegStar />}
                        </button>
                    )}
                    <button
                        onClick={() => onFoodSelected(food)}
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            border: 'none',
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <FaPlus size={12} /> Add
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search 350,000+ foods..."
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            background: 'rgba(31, 41, 55, 0.5)',
                            color: '#fff',
                            fontSize: '14px'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            border: 'none',
                            color: '#fff',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '10px'
            }}>
                <button
                    onClick={() => setActiveTab('search')}
                    style={{
                        background: activeTab === 'search' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        border: activeTab === 'search' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                        color: activeTab === 'search' ? '#60a5fa' : '#9ca3af',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    Search Results ({searchResults.length})
                </button>
                <button
                    onClick={() => setActiveTab('recent')}
                    style={{
                        background: activeTab === 'recent' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        border: activeTab === 'recent' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                        color: activeTab === 'recent' ? '#60a5fa' : '#9ca3af',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <FaClock size={12} /> Recent ({recentFoods.length})
                </button>
                <button
                    onClick={() => setActiveTab('favorites')}
                    style={{
                        background: activeTab === 'favorites' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        border: activeTab === 'favorites' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                        color: activeTab === 'favorites' ? '#60a5fa' : '#9ca3af',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <FaStar size={12} /> Favorites ({favoriteFoods.length})
                </button>
            </div>

            {/* Content */}
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {activeTab === 'search' && (
                    <>
                        {searchResults.length > 0 ? (
                            <>
                                {searchResults.map((food, index) => (
                                    <FoodItem key={index} food={food} />
                                ))}
                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        marginTop: '20px'
                                    }}>
                                        <button
                                            onClick={() => searchFoods(searchQuery, page - 1)}
                                            disabled={page === 1}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                background: 'rgba(31, 41, 55, 0.5)',
                                                color: '#fff',
                                                cursor: page === 1 ? 'not-allowed' : 'pointer',
                                                opacity: page === 1 ? 0.5 : 1
                                            }}
                                        >
                                            Previous
                                        </button>
                                        <span style={{ color: '#9ca3af', padding: '8px 16px' }}>
                                            Page {page} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => searchFoods(searchQuery, page + 1)}
                                            disabled={page === totalPages}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                background: 'rgba(31, 41, 55, 0.5)',
                                                color: '#fff',
                                                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                                opacity: page === totalPages ? 0.5 : 1
                                            }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#9ca3af'
                            }}>
                                {loading ? 'Searching...' : 'Search for foods to get started'}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'recent' && (
                    <>
                        {recentFoods.length > 0 ? (
                            recentFoods.map((food, index) => (
                                <FoodItem key={index} food={food} />
                            ))
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#9ca3af'
                            }}>
                                No recent foods yet. Start logging to see them here!
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'favorites' && (
                    <>
                        {favoriteFoods.length > 0 ? (
                            favoriteFoods.map((food, index) => (
                                <FoodItem key={index} food={food} showFavorite={false} />
                            ))
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#9ca3af'
                            }}>
                                No favorites yet. Star foods to add them here!
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default FoodSearchEnhanced;
