

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import { UsersIcon, BuildingOfficeIcon, HeartIcon, LogoIcon, UserIcon } from '../components/icons';
import { useAppContext } from '../context/AppContext';
import jsQR from 'jsqr';
import { Tip, Associate } from '../types';


const QrScanner: React.FC<{
    onScan: (data: string) => void;
    onCancel: () => void;
}> = ({ onScan, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState('');
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const canvasContext = canvas.getContext('2d', { willReadFrequently: true });
        if (!canvasContext) return;

        let stream: MediaStream | null = null;

        const tick = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });
                if (code) {
                    onScan(code.data);
                    return; // Stop scanning on success
                }
            }
            animationFrameId.current = requestAnimationFrame(tick);
        };

        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(s => {
                stream = s;
                video.srcObject = s;
                video.setAttribute('playsinline', 'true'); // for iOS
                video.play();
                animationFrameId.current = requestAnimationFrame(tick);
            })
            .catch(err => {
                console.error("Error accessing camera:", err);
                setError("Could not access camera. Please check permissions and try again.");
            });

        return () => {
            if (animationFrameId.current !== null) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <h2 className="text-white text-xl font-semibold mb-4 text-center">Scan Associate's QR Code</h2>
            <div className="relative w-full max-w-sm bg-black rounded-lg overflow-hidden shadow-2xl">
                <video ref={videoRef} className="w-full h-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2/3 h-2/3 border-4 border-white border-opacity-50 rounded-lg"></div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
            </div>
            {error && <p className="text-red-400 mt-4 bg-white/10 px-3 py-1 rounded">{error}</p>}
            <button onClick={onCancel} className="mt-6 bg-white text-dark-text py-2 px-8 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors">
                Cancel
            </button>
        </div>
    );
};

const ScrollingBanner: React.FC<{
  items: React.ReactNode[];
  speed?: number;
  reverse?: boolean;
  itemClassName?: string;
}> = ({ items, speed = 60, reverse = false, itemClassName = '' }) => {
  const duplicatedItems = [...items, ...items];
  const animationStyle = {
    '--animation-duration': `${speed}s`,
  } as React.CSSProperties;

  return (
    <div className="scrolling-banner-wrapper">
      <div
        className={`scrolling-banner ${reverse ? 'scrolling-banner--reverse' : ''}`}
        style={animationStyle}
      >
        {duplicatedItems.map((item, index) => (
          <div key={index} className={`flex-shrink-0 ${itemClassName}`}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};


const ScrollingFaces: React.FC = () => {
  const faces = ['😊', '🥳', '💖', '✨', '🎉', '👍', '🙏', '😃', '🤩', '💯'];
  return (
    <ScrollingBanner
      items={faces}
      speed={40}
      reverse
      itemClassName="mx-4 text-3xl opacity-80"
    />
  );
};


const ScrollingThanks: React.FC = () => {
  const thanks = [
    'Thank you', 'Gracias', 'Merci', 'Danke', 'Grazie', 'Obrigado', 'Dank je', 'Спасибо', 'ありがとう', '谢谢',
    '감사합니다', 'شكراً', 'धन्यवाद', 'Tack', 'Asante', 'Dziękuję', 'Teşekkür ederim', 'תודה', 'Ευχαριστώ', 'நன்றி', // Tamil
    'Cảm ơn', 'Terima kasih', 'Salamat', 'Kiitos', 'Takk', 'Děkuji', 'Köszönöm', 'Mulțumesc', 'Дякую', 'Благодаря',
    'Hvala', 'Ďakujem', 'Faleminderit', 'Paldies', 'Ačiū', 'Aitäh', 'Go raibh maith agat', 'Diolch', 'Tapadh leat',
    'Grazzi', 'Gràcies', 'Eskerrik asko', 'Dankie', 'Ngiyabonga', 'Enkosi', 'Mahadsanid', 'አመሰግናለሁ', 'E dupe',
    'Daalụ', 'Na gode', 'ধন্যবাদ', 'ਧੰਨਵਾਦ', 'આભાર', 'ధన్యవాదాలు', 'ಧನ್ಯವಾದಗಳು', 'നന്ദി', 'شکریہ', 'متشکرم',
    'مننه', 'Spas', 'Շնորհակալություն', 'მადლობა', 'Təşəkkür edirəm', 'Рақмет', 'Rahmat', 'Баярлалаа', 'ཐུགས་རྗེ་ཆེ།',
    'ကျေးဇူးတင်ပါတယ်', 'អរគុណ', 'ขอบคุณ', 'ຂອບใจ', 'Matur nuwun', 'Hatur nuhun', 'Mahalo', 'Faʻafetai', 'Mālō', 'Vinaka',
    'Kia ora', 'Dankon', 'Gratias tibi ago', 'Дзякуй', 'Благодарам', 'Mahalo', 'Shukriya', 'Salamat po',
    'Mèsi', 'Takk skal du ha', 'Diolch yn fawr', 'Paldies liels', 'Labai ačiū', 'Suur tänu', 'Tack så mycket',
    'Kiitos paljon', 'Большое спасибо', 'Vielen Dank', 'Merci beaucoup', 'Muchas gracias', 'Mille grazie', 'Muito obrigado',
    'Heel erg bedankt', 'Dziękuję bardzo', 'Çok teşekkür ederim', 'Большое спасибо', 'どうもありがとう', '非常感谢', '대단히 감사합니다',
    'شكرا جزيلا', 'बहुत धन्यवाद', 'Misaotra', 'Kea leboha', 'Ua tsaug'
  ];
  return (
    <ScrollingBanner
      items={thanks}
      speed={100}
      itemClassName="mx-8 text-lg text-medium-text opacity-90"
    />
  );
};


const BravosGrid: React.FC = () => {
  const { state } = useAppContext();

  const latestBravos = useMemo(() => {
    return state.tips
      .filter(tip => tip.message && tip.message.trim().length > 10) // Get meaningful comments
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Sort by most recent
      .slice(0, 10) // Take the latest
      .map(tip => {
        const associate = state.associates.find(a => a.id === tip.associateId);
        return associate ? { tip, associate } : null;
      })
      .filter((b): b is { tip: Tip; associate: Associate } => b !== null);
  }, [state.tips, state.associates]);

  return (
    <div className="py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {latestBravos.map((bravo) => (
            <Card key={bravo.tip.id} className="flex items-center">
              <div className="flex items-center space-x-4 w-full">
                <img src={bravo.associate.avatarUrl} alt={bravo.associate.name} className="w-16 h-16 rounded-full flex-shrink-0" />
                <div className="text-left flex-grow">
                  <p className="text-lg italic text-medium-text">"{bravo.tip.message}"</p>
                  <p className="mt-2 font-semibold text-dark-text">- from {bravo.tip.customerName} to {bravo.associate.name}</p>
                </div>
              </div>
            </Card>
          ))}
            <div 
              className="relative rounded-xl shadow-md overflow-hidden bg-cover bg-center text-white hover:shadow-xl transition-shadow group min-h-[220px]"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop')" }}
            >
              <div className="absolute inset-0 bg-blue-800/70 group-hover:bg-blue-800/60 transition-colors rounded-xl"></div>
              <div className="relative z-10 p-6 flex flex-col h-full justify-between text-center">
                <div className="flex-grow">
                    <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-xl font-bold">Power Up Your Team</h3>
                    <p className="mt-2 text-blue-100">Enable Bravos for your business and see team morale soar.</p>
                </div>
                <Link to="/setup" className="mt-4 block w-full text-center bg-white/90 text-primary font-bold py-3 px-4 rounded-lg hover:bg-white transition-colors">
                    For Businesses
                </Link>
              </div>
            </div>
            <div 
              className="relative rounded-xl shadow-md overflow-hidden bg-cover bg-center text-white hover:shadow-xl transition-shadow group min-h-[220px]"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=800&auto=format&fit=crop')" }}
            >
              <div className="absolute inset-0 bg-emerald-800/70 group-hover:bg-emerald-800/60 transition-colors rounded-xl"></div>
              <div className="relative z-10 p-6 flex flex-col h-full justify-between text-center">
                <div className="flex-grow">
                    <UserIcon className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-xl font-bold">Are you a service pro?</h3>
                    <p className="mt-2 text-green-100">Get the recognition you deserve. Start receiving Bravos today!</p>
                </div>
                <Link to="/setup" className="mt-4 block w-full text-center bg-white/90 text-secondary font-bold py-3 px-4 rounded-lg hover:bg-white transition-colors">
                    For Individuals
                </Link>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  const handleScan = (data: string) => {
    setIsScanning(false);
    try {
        const url = new URL(data);
        const pathParts = url.hash.split('/customer/');
        if (pathParts.length === 2 && pathParts[1]) {
            const foundId = pathParts[1].split('/')[0].split('?')[0];
            const associate = state.associates.find(a => a.id === foundId);
            
            if (associate) {
                setScanError('');
                if (associate.isCorporate) {
                    navigate(`/customer?scanned=${associate.id}`);
                } else {
                    navigate(`/customer/${associate.id}`);
                }
            } else {
                setScanError('Associate not found from the scanned code.');
            }
        } else {
            throw new Error("Invalid format");
        }
    } catch (e) {
         setScanError('Not a valid Bravos QR code.');
    }
  };

  return (
    <>
      {isScanning && <QrScanner onScan={handleScan} onCancel={() => setIsScanning(false)} />}
      <div className="bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-extrabold text-dark-text tracking-tighter">
                  Spread Joy, <br/><span className="text-primary">Instantly.</span>
                </h1>
                <p className="mt-4 max-w-md mx-auto md:mx-0 text-lg md:text-xl text-medium-text">
                  Bravos is the simplest way to show appreciation and send tips to the people who make your day.
                </p>
                 <div className="mt-8">
                    <button
                        onClick={() => { setScanError(''); setIsScanning(true); }}
                        className="w-full max-w-sm mx-auto md:mx-0 flex items-center justify-center space-x-3 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all transform hover:scale-105"
                        aria-label="Scan to Send a Bravo"
                    >
                        <HeartIcon className="h-8 w-8" />
                        <span className="font-semibold text-2xl">Scan to Send a Bravo</span>
                    </button>
                    {scanError && (
                      <div className="mt-4 text-center md:text-left p-3 rounded-lg bg-red-100 text-red-700 max-w-sm mx-auto md:mx-0">
                          {scanError}
                      </div>
                    )}
                </div>
            </div>
            <div className="flex justify-center">
                <div className="relative w-full max-w-2xl aspect-video rounded-2xl shadow-2xl bg-gray-900 overflow-hidden">
                    <video src="/landing_video.mp4" className="w-full h-full object-cover" autoPlay loop muted playsInline />
                </div>
            </div>
          </div>
        </div>
      </div>
      
      <BravosGrid />

      <div className="bg-white py-4 space-y-4">
        <ScrollingFaces />
        <ScrollingThanks />
      </div>
    </>
  );
};

export default LandingPage;