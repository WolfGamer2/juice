import React, { useState, useEffect, useRef } from 'react';

export default function JuiceWindow({ position, isDragging, isActive, handleMouseDown, handleDismiss, handleWindowClick, BASE_Z_INDEX, ACTIVE_Z_INDEX, userData, setUserData, startJuicing, playCollectSound, isJuicing }) {
    const [isJuicingLocal, setIsJuicingLocal] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [currentStretchId, setCurrentStretchId] = useState(null);
    const [timeJuiced, setTimeJuiced] = useState('0:00');
    const [startTime, setStartTime] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stopTime, setStopTime] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [totalPauseTimeSeconds, setTotalPauseTimeSeconds] = useState(0);
    const [streak, setStreak] = useState(userData.streakCount || 0); // Initialize streak
    const fileInputRef = useRef(null);
    const clickSoundRef = useRef(null);
    const expSoundRef = useRef(null);
    const congratsSoundRef = useRef(null);
    const [juicerImage, setJuicerImage] = useState('/juicerRest.png');

    const playClick = () => {
        if (clickSoundRef.current) {
            clickSoundRef.current.currentTime = 0;
            clickSoundRef.current.play().catch(e => console.error('Error playing click:', e));
        }
    };

    useEffect(() => {
        // Check the streak when the component mounts
        const lastJuiceDate = userData.lastJuiceDate; // Assume we store this in the user data
        const today = new Date().toISOString().split('T')[0];

        // If the user hasn't juiced today and the last juice date is not today, reset the streak
        if (lastJuiceDate !== today) {
            setStreak(0); // Reset streak if they missed a day
            setUserData(prevData => ({ ...prevData, streakCount: 0 })); // Update streak count
        }

        // Update last juicing date
        if (isJuicingLocal) {
            const now = new Date().toISOString().split('T')[0];
            setUserData(prevData => ({ ...prevData, lastJuiceDate: now })); // Store today's date
        }
    }, [isJuicingLocal, userData]);

    const handleStartJuicing = async () => {
        if (!confirm("Just to confirm, you have your game editor ready and you're ready to start working on your game? also sorry but pls keep demo clip at 4mb or less, will fix this soon ~Thomas")) {
            return;
        }

        try {
            const response = await fetch('/api/start-juice-stretch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: userData.token
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to start juice stretch');
            }

            const data = await response.json();
            setCurrentStretchId(data.stretchId);
            setIsJuicingLocal(true);
            setStartTime(new Date());
            setStopTime(null);
            setSelectedVideo(null);
            setDescription('');
            playCongratsSound();
            setIsPaused(false);
            setTotalPauseTimeSeconds(0);
            setJuicerImage('/juicerAnimation.gif');

            // Increment streak
            const newStreak = streak + 1;
            setStreak(newStreak);
            setUserData(prevData => ({ ...prevData, streakCount: newStreak }));

        } catch (error) {
            console.error('Error starting juice stretch:', error);
        }
    };

    const handleEndStretch = async () => {
        if (!selectedVideo || !description.trim()) {
            alert('Please upload a video and add a description');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('video', selectedVideo);
            formData.append('description', description);
            formData.append('token', userData.token);
            formData.append('stretchId', currentStretchId);
            formData.append('stopTime', stopTime.toISOString());

            try {
                const response = await fetch('/api/resume-juice-stretch', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: userData.token,
                        stretchId: currentStretchId
                    }),
                });
    
                if (!response.ok) {
                    throw new Error('Failed to resume juice stretch');
                }
                const data = await response.json();
                console.log(data.newPauseTime);
                setTotalPauseTimeSeconds(data.newPauseTime);
                setIsPaused(false);
            } catch (error) {
                console.error('Error resuming juice stretch:', error);
            }

            const response = await fetch('/api/create-omg-moment', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to create OMG moment');
            }

            // Play collect sound when successful
            playCollectSound();

            setIsJuicingLocal(false);
            setCurrentStretchId(null);
            setStartTime(null);
            setStopTime(null);
            setSelectedVideo(null);
            setDescription('');
            setTimeJuiced('0:00');
            setIsPaused(false);
            setJuicerImage('/juicerRest.png');
        } catch (error) {
            console.error('Error creating OMG moment:', error);
            alert('Failed to create OMG moment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <audio ref={clickSoundRef} src="./click.mp3" />
            <audio ref={expSoundRef} src="./expSound.mp3" volume="0.5" />
            <audio ref={congratsSoundRef} src="./juicercongrats.mp3" />
            <div 
                onClick={handleWindowClick('juiceWindow')}
                style={{
                    display: "flex", 
                    position: "absolute", 
                    zIndex: isActive ? ACTIVE_Z_INDEX : BASE_Z_INDEX, 
                    width: 400,
                    height: 475,
                    color: 'black',
                    backgroundColor: "#fff", 
                    border: "1px solid #000", 
                    borderRadius: 4,
                    flexDirection: "column",
                    padding: 0,
                    justifyContent: "space-between",
                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                    top: "50%",
                    left: "50%",
                    userSelect: "none"
                }}>
                <div 
                    onMouseDown={handleMouseDown('juiceWindow')}
                    style={{
                        display: "flex", 
                        borderBottom: "1px solid #000", 
                        padding: 8, 
                        flexDirection: "row", 
                        justifyContent: "space-between", 
                        cursor: isDragging ? 'grabbing' : 'grab'
                    }}>
                    <div style={{display: "flex", flexDirection: "row", gap: 8}}>
                        <button onClick={(e) => { 
                            e.stopPropagation(); 
                            playClick();
                            handleDismiss('juiceWindow'); 
                        }}>x</button>
                    </div>
                    <p>Juicer (v0.3)</p>
                    <div></div>
                </div>
                <div style={{flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 8}}>
                    {!showExplanation ? (
                        <>
                            <h1 style={{fontSize: 32, lineHeight: 1}}>Juicer (v0.3)</h1>
                            {isJuicing && <p>Log your time working on a feature then share "OMG IT WORKS" moment when you make it work</p>}
                            <div style={{display: "flex", flexDirection: "column", gap: 4}}>
                                <p>Current Session: {timeJuiced}</p>
                                <p>Total Time Juiced: {userData?.totalStretchHours ? 
                                    `${Math.floor(userData.totalStretchHours)} hours ${Math.round((userData.totalStretchHours % 1) * 60)} min` : 
                                    "0 hours 0 min"}</p>
                                <p>Current Streak: {streak} days</p> {/* Display streak */}
                            </div>
                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                margin: "10px 0",
                            }}>
                                <img 
                                    src={juicerImage}
                                    alt="Juicer"
                                    style={{
                                        width: "150px",
                                        height: "150px",
                                        imageRendering: "pixelated",
                                        objectFit: "contain"
                                    }}
                                />
                            </div>

                            {!isJuicingLocal && (
                                <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                                    <button onClick={() => {
                                        playClick();
                                        handleStartJuicing();
                                    }}>
                                        Start Juicing
                                    </button>
                                    <button onClick={() => {
                                        playClick();
                                        setShowExplanation(true);
                                    }}>
                                        What is this?
                                    </button>
                                </div>
                            )}
                            {isJuicingLocal && (
                                <div style={{padding: 8, display: 'flex', gap: 4, flexDirection: "column", border: "1px solid #000"}}>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="video/*"
                                        style={{ display: 'none' }}
                                    />
                                    <p 
                                        onClick={handleUploadClick}
                                        style={{
                                            cursor: 'pointer', 
                                            textAlign: "center", 
                                            width: "100%", 
                                            padding: 4, 
                                            border: "1px solid #000", 
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        {selectedVideo ? selectedVideo.name : 'Upload Video'}
                                    </p>
                                    <textarea 
                                        style={{width: "100%", padding: 2}} 
                                        placeholder="wut works?"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                    <button 
                                        onClick={() => {
                                            playClick();
                                            handleEndStretch();
                                        }}
                                        disabled={isSubmitting}
                                        style={{width: "100%"}}
                                    >
                                        {isSubmitting ? 'Juicing...' : 'Juice It!'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                            <h2>What is this?</h2>
                            <p>Juicer is a tool to help you track your work on a project. Start a stretch, then share an "OMG IT WORKS" moment with a short video and description!</p>
                            <p>It helps keep you motivated and builds a streak!</p>
                            <button onClick={() => setShowExplanation(false)}>Got it!</button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
