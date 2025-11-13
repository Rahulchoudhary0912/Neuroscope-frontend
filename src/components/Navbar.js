import React, { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';

const Navbar = () => {
    const [backendStatus, setBackendStatus] = useState('checking');

    useEffect(() => {
        const checkBackendStatus = async () => {
            try {
                await checkHealth();
                setBackendStatus('online');
            } catch (err) {
                console.warn('Backend status:', err.message);
                setBackendStatus('offline');
            }
        };

        // Check on mount
        checkBackendStatus();

        // Check every 30 seconds
        const interval = setInterval(checkBackendStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const statusColor = {
        online: '#4caf50',
        offline: '#f44336',
        checking: '#ff9800',
    };

    return (
        <nav>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>🧠 Neuro Scope</h1>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/3d-model">3D Model</a></li>
                </ul>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: statusColor[backendStatus],
                        display: 'inline-block',
                        animation: backendStatus === 'checking' ? 'pulse 1s infinite' : 'none'
                    }} />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                        {backendStatus === 'online' && 'Backend: Online ✅'}
                        {backendStatus === 'offline' && 'Backend: Offline ⚠️'}
                        {backendStatus === 'checking' && 'Checking...'}
                    </span>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;