
import React, { useEffect } from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  facingMode: 'user' | 'environment';
}

export const CameraView: React.FC<CameraViewProps> = ({ videoRef, facingMode }) => {
  useEffect(() => {
    let stream: MediaStream | null = null;
    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, aspectRatio: 4.3 / 5.7, width: { ideal: 1280 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access the camera. Please ensure you've granted permission in your browser settings.");
      }
    };

    setupCamera();

    return () => {
      // Cleanup: stop all tracks on component unmount or when facingMode changes
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoRef, facingMode]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} // Mirror selfie view
      aria-label="Live camera feed"
    />
  );
};
