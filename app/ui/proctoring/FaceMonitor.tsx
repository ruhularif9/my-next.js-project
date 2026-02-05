'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceDetection } from '@mediapipe/face_detection';
import { Camera } from '@mediapipe/camera_utils';

export default function FaceMonitor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [faceVisible, setFaceVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const faceDetection = new FaceDetection({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });

    faceDetection.setOptions({
      model: 'short',
      minDetectionConfidence: 0.5,
    });

    faceDetection.onResults((results) => {
      if (results.detections.length > 0) {
        setFaceVisible(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else {
        // If no face for 3 seconds → alert
        timeoutRef.current = setTimeout(() => {
          setFaceVisible(false);
        }, 3000);
      }
    });

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceDetection.send({ image: videoRef.current! });
        },
        width: 320,
        height: 240,
      });
      camera.start();
    }
  }, []);

  return (
    <>
      <video ref={videoRef} className="hidden" autoPlay playsInline />
      {!faceVisible && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50">
          ⚠️ Face not detected! Please stay in front of the camera.
        </div>
      )}
    </>
  );
}
