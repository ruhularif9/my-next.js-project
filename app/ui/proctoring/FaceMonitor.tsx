'use client';
import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function FaceMonitor() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [faceVisible, setFaceVisible] = useState(true);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    // Load Models
    useEffect(() => {
        isMountedRef.current = true;

        const loadModels = async () => {
            try {
                console.log('⏳ Loading face-api models...');
                // Load models from a CDN to avoid local file management issues
                const MODEL_URL = 'https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js@0.22.2/weights/';
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

                if (isMountedRef.current) {
                    setIsModelLoaded(true);
                    console.log('✅ Face-api models loaded');
                }
            } catch (err) {
                console.error('❌ Error loading face-api models:', err);
            }
        };

        loadModels();

        return () => {
            isMountedRef.current = false;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Start Video
    useEffect(() => {
        if (!isModelLoaded) return;

        const startVideo = async () => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    console.log('📷 Requesting camera access...');
                    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("❌ Error starting video:", err);
                }
            }
        };

        startVideo();
    }, [isModelLoaded]);

    const handleVideoPlay = () => {
        const video = videoRef.current;
        if (!video) return;

        const detect = async () => {
            if (!isMountedRef.current) return;
            if (video.paused || video.ended) {
                return setTimeout(() => detect(), 1000); // Check again in 1s if paused
            }

            // TinyFaceDetector options (inputSize 224 is fast, scoreThreshold 0.5 is standard)
            const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

            try {
                const result = await faceapi.detectSingleFace(video, options);

                if (result) {
                    // Face detected
                    setFaceVisible(true);
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                    // console.log('Face detected score:', result.score);
                } else {
                    // No face
                    //  console.log('No face...');
                    if (!timeoutRef.current) {
                        timeoutRef.current = setTimeout(() => {
                            if (isMountedRef.current) setFaceVisible(false);
                        }, 3000);
                    }
                }
            } catch (err) {
                console.error('Detection error:', err);
            }

            // Run next frame with a slight delay to avoid blocking UI (100ms = ~10fps)
            setTimeout(detect, 100);
        };

        detect();
    };

    return (
        <>
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onPlay={handleVideoPlay}
                className="fixed bottom-4 right-4 w-40 rounded shadow-lg border bg-black"
                style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            {!faceVisible && isModelLoaded && (
                <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse">
                    ⚠️ Face not detected! Please stay in front of the camera.
                </div>
            )}
            {!isModelLoaded && (
                <div className="fixed bottom-4 right-4 w-40 h-24 bg-gray-900 rounded flex items-center justify-center text-white text-xs">
                    Loading AI...
                </div>
            )}
        </>
    );
}
