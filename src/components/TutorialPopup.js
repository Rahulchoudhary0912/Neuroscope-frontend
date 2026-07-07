import { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/tutorialPopup.css';

const STORAGE_KEY = 'neuroscope_tutorial_dismissed';

const TutorialPopup = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [rememberDevice, setRememberDevice] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        // Check if user has permanently dismissed the popup
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) {
            // Small delay for better UX — let page settle first
            const timer = setTimeout(() => setIsVisible(true), 600);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = useCallback(() => {
        // Pause video on close
        if (videoRef.current) {
            videoRef.current.pause();
        }

        setIsAnimatingOut(true);

        setTimeout(() => {
            setIsVisible(false);
            setIsAnimatingOut(false);

            if (rememberDevice) {
                localStorage.setItem(STORAGE_KEY, 'true');
            }
            // If unchecked, do NOT set localStorage — popup will show again on next visit
        }, 380);
    }, [rememberDevice]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isVisible) handleClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, handleClose]);

    // Lock body scroll while popup is open
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isVisible]);

    if (!isVisible) return null;

    const videoSrc = process.env.PUBLIC_URL + '/video/tutorial.mp4';

    return (
        <div
            className={`tp-overlay ${isAnimatingOut ? 'tp-overlay--out' : 'tp-overlay--in'}`}
            onClick={(e) => e.target === e.currentTarget && handleClose()}
            role="dialog"
            aria-modal="true"
            aria-label="Tutorial"
        >
            <div className={`tp-modal ${isAnimatingOut ? 'tp-modal--out' : 'tp-modal--in'}`}>

                {/* Header */}
                <div className="tp-header">
                    <div className="tp-header__left">
                        <span className="tp-badge">TUTORIAL</span>
                        <h2 className="tp-title">Welcome to <span className="tp-title--accent">NeuroScope</span></h2>
                        <p className="tp-subtitle">Watch this quick guide to get started with AI-powered brain tumor analysis</p>
                    </div>
                    <button
                        className="tp-close"
                        onClick={handleClose}
                        aria-label="Close tutorial"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Video */}
                <div className="tp-video-wrapper">
                    <video
                        ref={videoRef}
                        className="tp-video"
                        src={videoSrc}
                        autoPlay
                        muted
                        controls
                        playsInline
                        preload="metadata"
                    >
                        <p className="tp-video-fallback">
                            Your browser doesn't support HTML5 video.{' '}
                            <a href={videoSrc} target="_blank" rel="noopener noreferrer">Download the tutorial</a>.
                        </p>
                    </video>
                </div>

                {/* Footer */}
                <div className="tp-footer">
                    <label className="tp-checkbox-label">
                        <input
                            type="checkbox"
                            className="tp-checkbox-input"
                            checked={rememberDevice}
                            onChange={(e) => setRememberDevice(e.target.checked)}
                        />
                        <span className="tp-checkbox-custom" aria-hidden="true" />
                        <span className="tp-checkbox-text">Don't show this again on this device</span>
                    </label>

                    <button className="tp-continue-btn" onClick={handleClose}>
                        <span>Continue to NeuroScope</span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TutorialPopup;
