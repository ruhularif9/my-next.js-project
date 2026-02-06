'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceDetection } from '@mediapipe/face_detection';
import { Camera } from '@mediapipe/camera_utils';

console.log('✅ FaceMonitor mounted');


export default function FaceMonitor() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [faceVisible, setFaceVisible] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let isMounted = true;
        let camera: Camera | null = null;
        let faceDetection: FaceDetection | null = null;

        const initFaceDetection = async () => {
            faceDetection = new FaceDetection({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
            });

            faceDetection.setOptions({
                model: 'short',
                minDetectionConfidence: 0.5,
            });

            faceDetection.onResults((results) => {
                if (!isMounted) return;
                console.log("Detections:", results.detections.length);
                if (results.detections.length > 0) {
                    setFaceVisible(true);
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                } else {
                    if (!timeoutRef.current) {
                        timeoutRef.current = setTimeout(() => {
                            if (isMounted) setFaceVisible(false);
                        }, 3000);
                    }
                }
            });

            if (videoRef.current) {
                camera = new Camera(videoRef.current, {
                    onFrame: async () => {
                        if (faceDetection && isMounted) {
                            await faceDetection.send({ image: videoRef.current! });
                        }
                    },
                    width: 320,
                    height: 240,
                });
                console.log("Starting camera...");
                await camera.start();
                console.log("Camera started");
            }
        };

        initFaceDetection().catch(err => {
            console.error("Error initializing Face Detection:", err);
        });

        return () => {
            console.log("Cleanup FaceMonitor");
            isMounted = false;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (camera) {
                // Camera utils from mediapipe usually expose stop(), but checking typedefs locally might be hard. 
                // However, standard usage suggests .stop() or just letting it go.
                // The @mediapipe/camera_utils Camera class has a stop() method.
                (camera as any).stop?.();
            }
            if (faceDetection) {
                faceDetection.close();
            }
        };
    }, []);

    return (
        <>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="fixed bottom-4 right-4 w-40 rounded shadow-lg border"
            />

            {!faceVisible && (
                <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50">
                    ⚠️ Face not detected! Please stay in front of the camera.
                </div>
            )}
        </>
    );
}
