import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaCamera, FaTimes, FaBarcode } from 'react-icons/fa';

const BarcodeScanner = ({ API_URL, onFoodFound, onClose }) => {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);

    const [manualBarcode, setManualBarcode] = useState('');
    const scannerRef = useRef(null);

    const lookupBarcode = useCallback(async (barcode) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/foods/barcode/${barcode}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const food = await response.json();
                if (food.product) {
                    onFoodFound(food.product);
                } else if (food.name) {
                    onFoodFound(food);
                } else {
                    setError("Food found but data incomplete.");
                }
            } else if (response.status === 404) {
                setError(`Product not found for barcode: ${barcode}`);
            } else {
                setError("Error looking up barcode");
            }
        } catch (err) {
            console.error("Barcode lookup error:", err);
            setError("Failed to look up barcode");
        }
    }, [API_URL, onFoodFound]); // onClose removed to avoid closing on error immediately

    const handleDetected = useCallback(async (result) => {
        if (!result || !result.codeResult) return;
        const barcode = result.codeResult.code;
        console.log("Barcode detected:", barcode);

        // Prevent multiple reads
        if (scanning) {
            setScanning(false);
            await lookupBarcode(barcode);
        }
    }, [lookupBarcode, scanning]);

    const stopScanner = useCallback(() => {
        if (!window.Quagga) return;
        window.Quagga.stop();
        window.Quagga.offDetected(handleDetected);
    }, [handleDetected]);

    const startScanner = useCallback(() => {
        if (!window.Quagga) {
            setError("Barcode scanning library not loaded. Please check your internet connection.");
            setScanning(false);
            return;
        }

        window.Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: scannerRef.current,
                constraints: {
                    width: 640,
                    height: 480,
                    facingMode: "environment"
                }
            },
            decoder: {
                readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"]
            },
            locate: true
        }, (err) => {
            if (err) {
                console.error("Barcode scanner initialization error:", err);
                setError("Camera access denied or not available");
                setScanning(false);
                return;
            }
            window.Quagga.start();
            window.Quagga.onDetected(handleDetected);
        });
    }, [handleDetected]);

    useEffect(() => {
        if (scanning) {
            startScanner();
        } else {
            stopScanner();
        }
        return () => stopScanner();
    }, [scanning, startScanner, stopScanner]);

    const handleManualLookup = async () => {
        if (!manualBarcode || manualBarcode.length < 8) {
            setError("Please enter a valid barcode (8-13 digits)");
            return;
        }

        await lookupBarcode(manualBarcode);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            {/* Header */}
            <div style={{
                width: '100%',
                maxWidth: '640px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h2 style={{ color: '#fff', margin: 0 }}>
                    <FaBarcode style={{ marginRight: '10px' }} />
                    Scan Barcode
                </h2>
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

            {/* Scanner Area */}
            {scanning ? (
                <div style={{
                    width: '100%',
                    maxWidth: '640px',
                    height: '480px',
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid rgba(59, 130, 246, 0.5)'
                }}>
                    <div ref={scannerRef} style={{ width: '100%', height: '100%' }} />
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        height: '40%',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                        pointerEvents: 'none'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: '#fff',
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}>
                        Position barcode within the frame
                    </div>
                </div>
            ) : (
                <div style={{
                    width: '100%',
                    maxWidth: '640px',
                    background: 'rgba(31, 41, 55, 0.8)',
                    borderRadius: '12px',
                    padding: '40px',
                    textAlign: 'center'
                }}>
                    <button
                        onClick={() => setScanning(true)}
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            border: 'none',
                            color: '#fff',
                            padding: '15px 30px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            margin: '0 auto 30px'
                        }}
                    >
                        <FaCamera size={20} />
                        Start Camera
                    </button>

                    <div style={{ color: '#9ca3af', margin: '20px 0' }}>OR</div>

                    <div style={{ marginTop: '20px' }}>
                        <label style={{ color: '#fff', display: 'block', marginBottom: '10px' }}>
                            Enter Barcode Manually
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={manualBarcode}
                                onChange={(e) => setManualBarcode(e.target.value)}
                                placeholder="Enter 8-13 digit barcode"
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    color: '#fff',
                                    fontSize: '14px'
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
                            />
                            <button
                                onClick={handleManualLookup}
                                style={{
                                    background: 'rgba(59, 130, 246, 0.2)',
                                    border: '1px solid rgba(59, 130, 246, 0.5)',
                                    color: '#60a5fa',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Lookup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px 20px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '8px',
                    color: '#f87171',
                    maxWidth: '640px',
                    width: '100%'
                }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
