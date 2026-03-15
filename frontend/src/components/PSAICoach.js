import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPaperclip, FaMicrophone, FaArrowUp, FaBolt, FaPlus } from 'react-icons/fa';

const PSAICoach = ({ token, API_URL, user }) => {
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const handleSendRef = useRef(null); // Ref to always hold latest handleSend

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Proactive Check-in
    useEffect(() => {
        const timer = setTimeout(() => {
            if (messages.length === 0) {
                setMessages([{
                    role: 'assistant',
                    content: `👋 Hey ${user?.username || 'Champion'}! I noticed you haven't logged a workout today.\n\nReady to crush a quick session? I can generate a 20-minute HIIT plan for you instantly!`,
                    timestamp: new Date().toISOString()
                }]);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [messages.length, user]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;

            // 1. Add User Image Message
            const newMsg = {
                role: 'user',
                content: base64String, // We show the image in UI
                type: 'image',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, newMsg]);

            // 2. Real API Call
            handleSend("Please analyze this food image for me.", base64String);

            // Clear input so same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsDataURL(file);
    };

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US'; // Or user's locale

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                // Auto-send voice input
                handleSendRef.current(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally runs once; uses ref for handleSend

    const handleSend = useCallback(async (text = input, imageData = null) => {
        if (!text.trim() && !imageData) return;

        // Optimistic UI Update (Only if it's text, image is handled in handleImageUpload)
        if (!imageData) {
            const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, userMsg]);
        }

        setInput('');
        setIsTyping(true);

        try {
            const payload = { message: text };
            if (imageData) {
                payload.image_data = imageData;
            }

            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to send');

            const data = await res.json();
            const aiMsg = { role: 'assistant', content: data.response, timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsTyping(false);
        }
    }, [input, token, API_URL]);

    // Keep ref up to date with latest handleSend
    handleSendRef.current = handleSend;

    // Load History
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_URL}/chat/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const history = await res.json();
                    // Backend returns chronological list of {role, content, timestamp}
                    if (history.length > 0) {
                        setMessages(history);
                    } else {
                        // Initial greeting if no history
                        setMessages([{
                            role: 'assistant',
                            content: `Hi ${user?.username || 'Health Hero'}! I'm PS AI Coach. I can help with workouts, nutrition, and analyzing your progress. What's on your mind?`,
                            timestamp: new Date().toISOString()
                        }]);
                    }
                }
            } catch (err) {
                console.error("Failed to load history", err);
            }
        };
        if (token) fetchHistory();
    }, [token, API_URL, user]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);




    const handleNewChat = async () => {
        if (!window.confirm("Are you sure you want to clear your chat history and start a new session?")) return;

        try {
            const res = await fetch(`${API_URL}/chat/history`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMessages([{
                    role: 'assistant',
                    content: `Hi ${user?.username || 'Health Hero'}! I'm PS AI Coach. I can help with workouts, nutrition, and analyzing your progress. What's on your mind?`,
                    timestamp: new Date().toISOString()
                }]);
            }
        } catch (err) {
            console.error("Failed to clear history", err);
            alert("Failed to clear history.");
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (e) {
                    console.error(e); // Handle already started error
                }
            } else {
                alert("Voice input not supported in this browser.");
            }
        }
    };


    return (
        <div style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', padding: 0, backgroundColor: '#212121', overflow: 'hidden', position: 'relative' }}>

            {/* Header (Minimalistic Model Selector & Actions) */}
            <div style={{ padding: '12px 24px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, background: 'linear-gradient(180deg, #212121 60%, transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#2f2f2f'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#ececf1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        PS AI Coach <span style={{ color: '#8e8ea0', fontSize: '16px' }}>▾</span>
                    </span>
                </div>

                <button
                    onClick={handleNewChat}
                    style={{
                        background: 'transparent', border: '1px solid #4a4a4a', color: '#ececf1',
                        padding: '6px 12px', borderRadius: '16px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px',
                        transition: 'all 0.2s', fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#2f2f2f'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    title="Start New Chat & Clear History"
                >
                    <FaPlus size={12} /> New Chat
                </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '80px 0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {messages.length === 0 && !isTyping && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaBolt color="#212121" size={32} />
                        </div>
                        <h2 style={{ color: '#ececf1', fontSize: '24px', fontWeight: '600' }}>How can I help you today?</h2>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        padding: '0 24px',
                        width: '100%',
                        maxWidth: '800px',
                        margin: '0 auto'
                    }}>
                        {msg.role === 'assistant' && (
                            <div style={{ flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #4a4a4a', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', marginTop: '4px' }}>
                                <FaBolt color="#212121" size={14} />
                            </div>
                        )}
                        <div style={{
                            maxWidth: '75%',
                            padding: msg.role === 'user' ? '10px 20px' : '4px 0',
                            borderRadius: msg.role === 'user' ? '24px' : '0',
                            background: msg.role === 'user' ? '#2f2f2f' : 'transparent',
                            color: '#ececf1',
                            fontSize: '16px',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                            {/* Image Support */}
                            {msg.type === 'image' && (
                                <img src={msg.content} alt="Upload" style={{ maxWidth: '100%', borderRadius: '12px', marginBottom: '12px' }} />
                            )}
                            {msg.type === 'image' ? (msg.caption || '') : msg.content}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 24px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #4a4a4a', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', marginTop: '4px' }}>
                            <FaBolt color="#212121" size={14} />
                        </div>
                        <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center' }}>
                            <div className="typing-indicator" style={{ display: 'flex', gap: '5px' }}>
                                <span style={{ width: '8px', height: '8px', backgroundColor: '#ececf1', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                                <span style={{ width: '8px', height: '8px', backgroundColor: '#ececf1', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite 0.2s' }}></span>
                                <span style={{ width: '8px', height: '8px', backgroundColor: '#ececf1', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite 0.4s' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '0 24px 24px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{
                    background: '#2f2f2f',
                    borderRadius: '32px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            background: 'transparent', border: 'none', color: '#ececf1',
                            cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#40414f'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        title="Attach File"
                    >
                        <FaPaperclip size={18} />
                    </button>

                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Message PS AI Coach..."
                        style={{
                            flex: 1, background: 'transparent', border: 'none',
                            color: '#ececf1', fontSize: '16px', outline: 'none',
                            padding: '8px 4px',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                    />

                    {input.trim() ? (
                        <button
                            onClick={() => handleSend()}
                            style={{
                                background: '#ececf1',
                                border: 'none',
                                color: '#212121',
                                width: '36px', height: '36px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                            onMouseLeave={e => e.currentTarget.style.background = '#ececf1'}
                        >
                            <FaArrowUp size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={toggleListening}
                            style={{
                                background: isListening ? '#f43f5e' : 'transparent', border: 'none', color: '#ececf1',
                                cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => !isListening && (e.currentTarget.style.background = '#40414f')}
                            onMouseLeave={e => !isListening && (e.currentTarget.style.background = 'transparent')}
                            title="Voice Input"
                        >
                            <FaMicrophone size={18} />
                        </button>
                    )}
                </div>
                <div style={{ textAlign: 'center', fontSize: '13px', color: '#8e8ea0', marginTop: '12px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    PS AI Coach can make mistakes. Consider verifying important information.
                </div>
            </div>
        </div>
    );
};

export default PSAICoach;
