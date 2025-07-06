import React, { useRef, useEffect, useState } from 'react';

interface CreditCardScannerProps {
  onScanSuccess: (cardDetails: {
    cardNumber: string;
    expiry: string;
    cardHolderName: string;
  }) => void;
  onClose: () => void;
}

const CreditCardScanner: React.FC<CreditCardScannerProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let scanTimeout: NodeJS.Timeout;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play();
          
          // Simulate scanning for 3 seconds then returning mock data
          scanTimeout = setTimeout(() => {
            onScanSuccess({
              cardNumber: '4242 4242 4242 4242',
              expiry: '12/28',
              cardHolderName: 'Jane Doe',
            });
          }, 3000);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    };

    startCamera();

    return () => {
      clearTimeout(scanTimeout);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <h2 className="text-white text-xl font-semibold mb-4 text-center">Scan your credit card</h2>
      <p className="text-gray-300 text-sm mb-4 text-center">Position your card within the frame. This is a demo, scanning will complete automatically.</p>
      <div className="relative w-full max-w-sm bg-black rounded-lg overflow-hidden shadow-2xl aspect-[1.586/1]">
        <video ref={videoRef} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full h-full border-4 border-white border-opacity-50 rounded-xl animate-pulse"></div>
        </div>
      </div>
      {error && <p className="text-red-400 mt-4 bg-white/10 px-3 py-1 rounded">{error}</p>}
      <button onClick={onClose} className="mt-6 bg-white text-dark-text py-2 px-8 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors">
        Cancel
      </button>
    </div>
  );
};

export default CreditCardScanner;
