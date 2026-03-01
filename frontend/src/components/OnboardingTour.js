import React, { useState, useEffect } from 'react';

const TOUR_STEPS = [
    {
        title: "👋 Welcome to PS Fitness!",
        content: "Your ultimate AI-powered fitness companion. Let's take a quick tour to get you started.",
        target: null // Centered
    },
    {
        title: "📊 Dashboard",
        content: "See your daily progress, streaks, and upcoming scheduled workouts here.",
        target: "dashboard"
    },
    {
        title: "🏋️ Workout Logger",
        content: "Log your sets, reps, and weight. Use the AI to generate personalized plans.",
        target: "workout"
    },
    {
        title: "🍎 Nutrition Tracking",
        content: "Search for foods, log your meals, and track your macros (Protein, Carbs, Fats).",
        target: "nutrition"
    },
    {
        title: "🤖 AI Coach",
        content: "Ask your AI Coach anything! Get advice on form, diet, or motivation.",
        target: "chat"
    }
];

const OnboardingTour = ({ onComplete, user }) => {
    const [step, setStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    // Personalize the first step title dynamically
    if (user && user.username) {
        TOUR_STEPS[0].title = `👋 Welcome, ${user.username}!`;
    }

    useEffect(() => {
        const hasSeen = localStorage.getItem('has_seen_onboarding');
        if (!hasSeen) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (step < TOUR_STEPS.length - 1) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('has_seen_onboarding', 'true');
        if (onComplete) onComplete();
    };

    if (!isVisible) return null;

    const currentStep = TOUR_STEPS[step];

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div className="glass-panel animate-float" style={{
                width: '400px',
                padding: '40px',
                textAlign: 'center',
                border: '1px solid var(--primary)',
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>
                    {step === 0 ? '🚀' : '✨'}
                </div>
                <h2 style={{ marginBottom: '15px', color: '#fff' }}>{currentStep.title}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px', lineHeight: '1.6' }}>
                    {currentStep.content}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {TOUR_STEPS.map((_, i) => (
                            <div key={i} style={{
                                width: '8px', height: '8px',
                                borderRadius: '50%',
                                background: i === step ? 'var(--primary)' : 'rgba(255,255,255,0.2)'
                            }} />
                        ))}
                    </div>
                    <button
                        className="btn-primary"
                        onClick={handleNext}
                        style={{ padding: '10px 25px' }}
                    >
                        {step === TOUR_STEPS.length - 1 ? "Let's Go!" : 'Next →'}
                    </button>
                </div>

                {step < TOUR_STEPS.length - 1 && (
                    <button
                        onClick={handleClose}
                        style={{
                            marginTop: '20px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Skip Tour
                    </button>
                )}
            </div>
        </div>
    );
};

export default OnboardingTour;
