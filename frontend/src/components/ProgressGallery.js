import React, { useState, useEffect, useCallback } from 'react';
import { FaCamera, FaImage, FaPlus } from 'react-icons/fa';

const ProgressGallery = ({ API_URL }) => {
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);

    const fetchPhotos = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/progress/photos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPhotos(data);
            }
        } catch (e) { console.error(e); }
    }, [API_URL]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            await uploadPhoto(base64String);
        };
        reader.readAsDataURL(file);
    };

    const uploadPhoto = async (imageData) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/progress/photos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: new Date().toISOString(),
                    image_data: imageData,
                    view_type: 'front', // Default for now, could add selector
                    notes: ''
                })
            });
            if (res.ok) {
                fetchPhotos(); // Refresh
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '24px', marginTop: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 600 }}>
                    <FaCamera style={{ color: 'var(--primary)' }} /> Progress Gallery
                </h3>
                <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem' }}>
                    <FaPlus size={12} /> Upload Photo
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />
                </label>
            </div>

            {/* Photo Grid */}
            {photos.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                    <FaImage size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.9rem' }}>No photos yet. Upload your first progress pic!</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '16px'
                }}>
                    {photos.map(photo => (
                        <div key={photo.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '3/4', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <img
                                src={photo.image_data}
                                alt="Progress"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '8px',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                                color: '#fff',
                                fontSize: '0.75rem',
                                textAlign: 'center',
                                fontWeight: 500
                            }}>
                                {new Date(photo.date).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProgressGallery;
