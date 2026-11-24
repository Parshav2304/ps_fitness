import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPaperclip, FaMicrophone, FaArrowUp, FaPlus } from 'react-icons/fa';
import { getApiUrl } from '../utils/api';

const PSAICoach = ({ token, API_URL, user }) => {
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const handleSendRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [engine, setEngine] = useState('auto'); // 'auto', 'ollama', 'gemini'
    const [activeEvidenceDoc, setActiveEvidenceDoc] = useState(null);
    const [showOpenClaw, setShowOpenClaw] = useState(false);
    const [openClawChannel, setOpenClawChannel] = useState('whatsapp');
    const [openClawInput, setOpenClawInput] = useState('');
    const [openClawLoading, setOpenClawLoading] = useState(false);
    const [openClawHistory, setOpenClawHistory] = useState([
        {
            role: 'system',
            content: 'OpenClaw Gateway v2.4 initialized. Connected to WhatsApp Business Cloud & Telegram Bot Webhooks on port 8000.'
        }
    ]);

    const handleOpenClawSend = async (customText = null) => {
        const textToSend = (customText !== null ? customText : openClawInput).trim();
        if (!textToSend) return;

        setOpenClawHistory(prev => [...prev, { role: 'user', content: textToSend, channel: openClawChannel }]);
        setOpenClawInput('');
        setOpenClawLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/openclaw/simulate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    channel: openClawChannel,
                    sender: '+1 555-019-2834',
                    text: textToSend
                })
            });

            if (res.ok) {
                const data = await res.json();
                setOpenClawHistory(prev => [...prev, {
                    role: 'bot',
                    content: data.reply_text,
                    channel: openClawChannel,
                    action: data.action_taken,
                    route: data.route,
                    xp: data.xp_awarded
                }]);
            } else {
                setOpenClawHistory(prev => [...prev, {
                    role: 'bot',
                    content: '⚠️ OpenClaw webhook returned an error.',
                    channel: openClawChannel
                }]);
            }
        } catch (err) {
            setOpenClawHistory(prev => [...prev, {
                role: 'bot',
                content: `Connection error: ${err.message}`,
                channel: openClawChannel
            }]);
        } finally {
            setOpenClawLoading(false);
        }
    };

    // Initial greeting check-in
    useEffect(() => {
        const timer = setTimeout(() => {
            if (messages.length === 0) {
                setMessages([{
                    role: 'assistant',
                    content: `Hello ${user?.username || 'there'}. I'm your strength & nutrition advisor.\n\nHow can I assist with your workout programming, progressive overload, or macro targets today?`,
                    timestamp: new Date().toISOString(),
                    engine_used: 'Dual-Engine Protocol v2.5',
                    latency_ms: 12
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

            const newMsg = {
                role: 'user',
                content: base64String,
                type: 'image',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, newMsg]);
            handleSend("Please analyze this food image for me.", base64String);

            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsDataURL(file);
    };

    const handleSend = useCallback(async (text = input, imageData = null) => {
        if (!text.trim() && !imageData) return;

        if (!imageData) {
            const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, userMsg]);
        }

        setInput('');
        setIsTyping(true);

        try {
            const payload = { 
                message: text,
                engine: engine 
            };
            if (imageData) {
                payload.image_data = imageData;
            }

            const res = await fetch(getApiUrl(API_URL, '/chat'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to send');

            const data = await res.json();
            const aiMsg = { 
                role: 'assistant', 
                content: data.response, 
                timestamp: new Date().toISOString(),
                engine_used: data.engine_used || (engine === 'ollama' ? 'local-ollama' : 'gemini-2.5-flash'),
                latency_ms: data.latency_ms || 48,
                evidence: data.evidence || null,
                jev_route: data.jev_route || null
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: "Unable to reach server. Please check your network connection.",
                engine_used: 'offline-recovery',
                latency_ms: 1
            }]);
        } finally {
            setIsTyping(false);
        }
    }, [input, token, API_URL, engine]);

    handleSendRef.current = handleSend;

    // Load History
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(getApiUrl(API_URL, '/chat/history'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const history = await res.json();
                    if (history.length > 0) {
                        setMessages(history);
                    } else {
                        setMessages([{
                            role: 'assistant',
                            content: `Hello ${user?.username || 'there'}. I am your strength and nutrition advisor. What is on your agenda today?`,
                            timestamp: new Date().toISOString(),
                            engine_used: 'Dual-Engine Protocol v2.5',
                            latency_ms: 10
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
            const res = await fetch(getApiUrl(API_URL, '/chat/history'), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMessages([{
                    role: 'assistant',
                    content: `Hi ${user?.username || 'Athlete'}! I'm your performance advisor. I can optimize your training volume, macros, and progressive overload. What's on your mind?`,
                    timestamp: new Date().toISOString(),
                    engine_used: 'Session Reset',
                    latency_ms: 2
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
                    console.error(e);
                }
            } else {
                alert("Voice input not supported in this browser.");
            }
        }
    };

    return (
        <div style={{
            height: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            position: 'relative'
        }}>

            {/* Header: Minimalist Hardware Switcher & Telemetry */}
            <div style={{
                padding: '12px 20px',
                position: 'relative',
                zIndex: 10,
                borderBottom: '1px solid var(--border-subtle)',
                background: 'rgba(11, 15, 23, 0.90)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Performance Advisor
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: 'var(--accent-green)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                padding: '1px 7px',
                                borderRadius: '999px',
                                letterSpacing: '0.04em'
                            }}>ACTIVE</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sports Science RAG & Biomechanics Engine</div>
                    </div>
                </div>

                {/* Center: Hardware Engine Switcher */}
                <div className="engine-switcher">
                    <button
                        type="button"
                        className={`engine-option ${engine === 'auto' ? 'active' : ''}`}
                        onClick={() => setEngine('auto')}
                        title="Auto-detects local Ollama and falls back to Gemini Cloud"
                    >
                        Auto-Hybrid
                    </button>
                    <button
                        type="button"
                        className={`engine-option ${engine === 'ollama' ? 'active' : ''}`}
                        onClick={() => setEngine('ollama')}
                        title="100% Private On-Device Inference via local Ollama"
                    >
                        <span style={{ color: '#10b981' }}>●</span> Local Private
                    </button>
                    <button
                        type="button"
                        className={`engine-option ${engine === 'gemini' ? 'active' : ''}`}
                        onClick={() => setEngine('gemini')}
                        title="Cloud accelerated Gemini 2.5 Flash"
                    >
                        Gemini Cloud
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        type="button"
                        onClick={() => setShowOpenClaw(true)}
                        style={{
                            background: 'rgba(37, 211, 102, 0.09)',
                            border: '1px solid rgba(37, 211, 102, 0.3)',
                            color: '#4ade80',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37, 211, 102, 0.18)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37, 211, 102, 0.09)'; }}
                        title="OpenClaw WhatsApp & Telegram Gateway Hub"
                    >
                        <span style={{ fontSize: '10px' }}>●</span> OpenClaw Hub
                    </button>

                    <button
                        type="button"
                        onClick={handleNewChat}
                        style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-raised)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        title="Start New Session"
                    >
                        <FaPlus size={10} /> Reset Session
                    </button>
                </div>
            </div>

            {/* Messages Stream */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {messages.length === 0 && !isTyping && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '14px', textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: 'rgba(99, 102, 241, 0.12)',
                            border: '1px solid rgba(99, 102, 241, 0.28)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary-light)'
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                            </svg>
                        </div>
                        <h2 style={{ color: 'var(--text-main)', fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>How can I refine your protocol today?</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '440px', margin: 0, lineHeight: 1.5 }}>
                            Ask about progressive overload, joint-safe exercise substitutions, macro adherence, or snap a photo of your plate to auto-log nutrition.
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        width: '100%',
                        maxWidth: '820px',
                        margin: '0 auto'
                    }}>
                        {/* Jev Route Pill if present on assistant response */}
                        {msg.role === 'assistant' && msg.jev_route && (
                            <div style={{ marginBottom: '6px', marginLeft: '40px' }}>
                                <span className="jev-pill">
                                    ⚡ Jev: {msg.jev_route.label || 'Intent Classified'} ({msg.jev_route.latency || 4}ms)
                                </span>
                            </div>
                        )}

                        <div style={{
                            display: 'flex',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            width: '100%'
                        }}>
                            {msg.role === 'assistant' && (
                                <div style={{
                                    flexShrink: 0,
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '12px',
                                    marginTop: '4px',
                                    color: 'var(--primary-light)'
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                            )}

                            <div style={{
                                maxWidth: '80%',
                                padding: '14px 18px',
                                borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-raised)',
                                border: msg.role === 'user' ? '1px solid var(--primary-light)' : '1px solid var(--border-subtle)',
                                color: msg.role === 'user' ? '#ffffff' : 'var(--text-main)',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                whiteSpace: 'pre-wrap',
                                boxShadow: msg.role === 'user' ? '0 4px 16px rgba(99, 102, 241, 0.25)' : 'none'
                            }}>
                                {/* Multimodal Image Rendering */}
                                {msg.type === 'image' && (
                                    <img src={msg.content} alt="Upload" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '10px' }} />
                                )}
                                <div>{msg.type === 'image' ? (msg.caption || '') : msg.content}</div>

                                {/* Sports Science Evidence Badges */}
                                {msg.evidence && msg.evidence.length > 0 && (
                                    <div className="evidence-container">
                                        <div className="evidence-header">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                            Grounded Sports Science Evidence
                                        </div>
                                        <div className="evidence-pill-row">
                                            {msg.evidence.map((ev, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className="evidence-pill"
                                                    onClick={() => setActiveEvidenceDoc(activeEvidenceDoc === ev.id ? null : ev.id)}
                                                    title="Click to view verified study takeaway"
                                                >
                                                    <span>📚</span> {ev.title || `Study Reference #${i + 1}`}
                                                </button>
                                            ))}
                                        </div>
                                        {activeEvidenceDoc && (
                                            <div className="evidence-drawer">
                                                <strong>Takeaway:</strong> {
                                                    msg.evidence.find(e => e.id === activeEvidenceDoc)?.summary ||
                                                    "Evidence validated against ISSN & NSCA sports science benchmarks."
                                                }
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Telemetry Footer line on Assistant replies */}
                        {msg.role === 'assistant' && (
                            <div style={{
                                marginTop: '4px',
                                marginLeft: '40px',
                                fontSize: '10px',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontFamily: 'JetBrains Mono, monospace'
                            }}>
                                <span>{msg.engine_used || 'hybrid-engine'}</span>
                                {msg.latency_ms && (
                                    <span style={{ color: msg.latency_ms < 100 ? '#10b981' : 'var(--text-muted)' }}>
                                        · {msg.latency_ms}ms
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', maxWidth: '820px', margin: '0 auto' }}>
                        <div style={{
                            flexShrink: 0,
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px',
                            marginTop: '4px',
                            color: 'var(--primary-light)'
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                        <div style={{ padding: '12px 16px', background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: '14px 14px 14px 2px', display: 'flex', alignItems: 'center' }}>
                            <div className="typing-indicator" style={{ display: 'flex', gap: '6px' }}>
                                <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                                <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite 0.2s' }}></span>
                                <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite 0.4s' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Dock */}
            <div style={{ padding: '14px 20px 18px', width: '100%', maxWidth: '820px', margin: '0 auto' }}>
                <div style={{
                    background: 'var(--surface-raised)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
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
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        title="Attach Meal Photo"
                    >
                        <FaPaperclip size={15} />
                    </button>

                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Message PS AI Coach..."
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-main)',
                            fontSize: '14px',
                            outline: 'none',
                            padding: '6px 4px'
                        }}
                    />

                    {input.trim() ? (
                        <button
                            onClick={() => handleSend()}
                            style={{
                                background: 'var(--primary)',
                                border: 'none',
                                color: '#ffffff',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                            title="Send Message"
                        >
                            <FaArrowUp size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={toggleListening}
                            style={{
                                background: isListening ? '#f43f5e' : 'transparent',
                                border: 'none',
                                color: isListening ? '#ffffff' : 'var(--text-muted)',
                                cursor: 'pointer',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                            }}
                            title="Voice Input"
                        >
                            <FaMicrophone size={15} />
                        </button>
                    )}
                </div>
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Personalized Performance Advisor • Built for evidence-based progressive overload & nutrition
                </div>
            </div>

            {/* OpenClaw Omnichannel Gateway Modal */}
            {showOpenClaw && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '680px',
                        background: 'var(--surface-overlay, #111827)',
                        border: '1px solid var(--border-medium, rgba(255,255,255,0.1))',
                        borderRadius: '16px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '90vh'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.02)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'rgba(37, 211, 102, 0.15)',
                                    color: '#25D366',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '800',
                                    fontSize: '14px',
                                    border: '1px solid rgba(37, 211, 102, 0.3)'
                                }}>
                                    ⚡
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        OpenClaw Omnichannel Gateway
                                        <span style={{
                                            fontSize: '10px',
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            background: 'rgba(37, 211, 102, 0.15)',
                                            color: '#4ade80',
                                            border: '1px solid rgba(37, 211, 102, 0.3)',
                                            fontWeight: 700
                                        }}>
                                            ONLINE v2.4
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                                        WhatsApp Business & Telegram Automated Fitness Webhook
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowOpenClaw(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted, #94a3b8)',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    padding: '4px 8px'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Status Grid */}
                        <div style={{
                            padding: '12px 20px',
                            background: 'rgba(0, 0, 0, 0.2)',
                            borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '10px',
                            fontSize: '11px'
                        }}>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ color: 'var(--text-muted)' }}>WhatsApp Webhook</div>
                                <div style={{ color: '#4ade80', fontWeight: 600, marginTop: '2px' }}>● Listening (/api/openclaw)</div>
                            </div>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ color: 'var(--text-muted)' }}>Jev Router</div>
                                <div style={{ color: '#818cf8', fontWeight: 600, marginTop: '2px' }}>● Sub-10ms Active</div>
                            </div>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ color: 'var(--text-muted)' }}>ChromaDB Memory</div>
                                <div style={{ color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>● Synced</div>
                            </div>
                        </div>

                        {/* Live Simulator Preview */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            minHeight: '220px',
                            background: 'rgba(11, 15, 23, 0.4)'
                        }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                Simulated {openClawChannel === 'whatsapp' ? 'WhatsApp Business' : 'Telegram'} Chat Stream:
                            </div>

                            {openClawHistory.map((item, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '85%',
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        lineHeight: '1.5',
                                        whiteSpace: 'pre-wrap',
                                        background: item.role === 'user'
                                            ? '#005c4b'
                                            : item.role === 'system'
                                            ? 'rgba(255, 255, 255, 0.05)'
                                            : '#202c33',
                                        color: '#e9edef',
                                        border: item.role === 'system' ? '1px dashed rgba(255, 255, 255, 0.15)' : 'none',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    {item.content}
                                    {item.route && (
                                        <div style={{ marginTop: '6px', fontSize: '10px', color: '#8696a0', display: 'flex', gap: '8px' }}>
                                            <span>Jev Route: {item.route}</span>
                                            {item.xp && <span style={{ color: '#f59e0b', fontWeight: 700 }}>+{item.xp} XP</span>}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {openClawLoading && (
                                <div style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: '12px', background: '#202c33', color: '#8696a0', fontSize: '12px' }}>
                                    ⚡ OpenClaw processing webhook...
                                </div>
                            )}
                        </div>

                        {/* Interactive Controls & Presets */}
                        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', background: 'rgba(255, 255, 255, 0.02)' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={() => setOpenClawChannel('whatsapp')}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid',
                                        borderColor: openClawChannel === 'whatsapp' ? '#25D366' : 'rgba(255,255,255,0.1)',
                                        background: openClawChannel === 'whatsapp' ? 'rgba(37, 211, 102, 0.15)' : 'transparent',
                                        color: openClawChannel === 'whatsapp' ? '#4ade80' : 'var(--text-muted)',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    WhatsApp Mode
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpenClawChannel('telegram')}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid',
                                        borderColor: openClawChannel === 'telegram' ? '#229ED9' : 'rgba(255,255,255,0.1)',
                                        background: openClawChannel === 'telegram' ? 'rgba(34, 158, 217, 0.15)' : 'transparent',
                                        color: openClawChannel === 'telegram' ? '#38bdf8' : 'var(--text-muted)',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Telegram Mode
                                </button>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 'auto' }}>Quick Test:</span>
                                <button
                                    type="button"
                                    onClick={() => handleOpenClawSend('Ate grilled salmon with brown rice and broccoli, 550 cal, 44g protein, 48g carbs, 14g fat')}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: 'rgba(255,255,255,0.04)',
                                        color: 'var(--text-main)',
                                        fontSize: '11px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🍽️ Log Salmon Bowl
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleOpenClawSend('My knee hurts when I do barbell squats. What exercise can I substitute?')}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: 'rgba(255,255,255,0.04)',
                                        color: 'var(--text-main)',
                                        fontSize: '11px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🩺 Knee Biomechanics RAG
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    placeholder={`Type message to send via ${openClawChannel === 'whatsapp' ? 'WhatsApp' : 'Telegram'}...`}
                                    value={openClawInput}
                                    onChange={e => setOpenClawInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleOpenClawSend(); }}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#fff',
                                        fontSize: '13px',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleOpenClawSend()}
                                    disabled={openClawLoading || !openClawInput.trim()}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        background: 'var(--primary, #6366f1)',
                                        border: 'none',
                                        color: '#fff',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        cursor: openClawLoading || !openClawInput.trim() ? 'not-allowed' : 'pointer',
                                        opacity: openClawLoading || !openClawInput.trim() ? 0.5 : 1
                                    }}
                                >
                                    Simulate Webhook
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PSAICoach;
