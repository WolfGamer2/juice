import React, { useState, useEffect, useRef } from 'react';

export default function JuiceWindow({ position, isDragging, isActive, handleMouseDown, handleDismiss, handleWindowClick, BASE_Z_INDEX, ACTIVE_Z_INDEX, userData, setUserData, startJuicing, playCollectSound, isJuicing }) {
    const [isJuicingLocal, setIsJuicingLocal] = useState(false);
    const [currentStretchId, setCurrentStretchId] = useState(null);
    const [timeJuiced, setTimeJuiced] = useState('0:00');
    const [startTime, setStartTime] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stopTime, setStopTime] = useState(null);
    const [streak, setStreak] = useState(userData?.streak || 0);
    const fileInputRef = useRef(null);

    useEffect(() => {
        let interval;
        if (isJuicingLocal && startTime && !stopTime) {
            interval = setInterval(() => {
                const now = new Date();
                const diff = Math.floor((now - startTime) / 1000);
                const minutes = Math.floor(diff / 60);
                const seconds = diff % 60;
                setTimeJuiced(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isJuicingLocal, startTime, stopTime]);

    const handleStartJuicing = async () => {
        try {
            const response = await fetch('/api/start-juice-stretch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: userData.token }),
            });

            if (!response.ok) throw new Error('Failed to start juice stretch');

            const data = await response.json();
            setCurrentStretchId(data.stretchId);
            setIsJuicingLocal(true);
            setStartTime(new Date());
            setStopTime(null);
            setSelectedVideo(null);
            setDescription('');

            const today = new Date().toDateString();
            const lastJuiced = userData.lastJuicedDate || null;
            let newStreak = streak;
            if (lastJuiced) {
                const lastDate = new Date(lastJuiced).toDateString();
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                newStreak = lastDate === yesterday.toDateString() ? streak + 1 : 1;
            } else {
                newStreak = 1;
            }

            setStreak(newStreak);
            setUserData(prev => ({ ...prev, streak: newStreak, lastJuicedDate: today }));
            startJuicing();
        } catch (error) {
            console.error('Error starting juice stretch:', error);
        }
    };

    return (
        <div onClick={handleWindowClick('juiceWindow')} style={{ position: "absolute", zIndex: isActive ? ACTIVE_Z_INDEX : BASE_Z_INDEX, width: 400, height: 300, backgroundColor: "#fff", border: "1px solid #000", borderRadius: 4, padding: 16, transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`, top: "50%", left: "50%" }}>
            <div onMouseDown={handleMouseDown('juiceWindow')} style={{ borderBottom: "1px solid #000", padding: 8, display: "flex", justifyContent: "space-between" }}>
                <button onClick={(e) => { e.stopPropagation(); handleDismiss('juiceWindow'); }}>x</button>
                <p>Juicer (v.0.1)</p>
            </div>
            <div style={{ flex: 1, padding: 16 }}>
                <h1>Juicer (v.0.1)</h1>
                <p>Current Challenge: Build game prototype</p>
                <p>Current Session: {timeJuiced}</p>
                <p>Total Time Juiced: {userData?.totalStretchHours ? `${Math.floor(userData.totalStretchHours)} hours ${Math.round((userData.totalStretchHours % 1) * 60)} min` : "0 hours 0 min"}</p>
                <p>Current Streak: {streak} {streak === 1 ? "day" : "days"}🔥</p>
                {!isJuicingLocal && <button onClick={handleStartJuicing}>Start Juicing</button>}
            </div>
        </div>
    );
}
