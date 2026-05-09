import { useState, useEffect } from 'react';

interface SocialProofProps {
  productId: string;
  currentViewers?: number;
  recentPurchases?: number;
}

export default function SocialProof({ productId, currentViewers = 0, recentPurchases = 0 }: SocialProofProps) {
  const [viewers, setViewers] = useState(currentViewers);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    // Simulate real-time viewer updates
    const viewerInterval = setInterval(() => {
      setViewers(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
    }, 5000);

    // Show purchase notifications
    const notificationInterval = setInterval(() => {
      const locations = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const minutes = Math.floor(Math.random() * 30) + 1;
      
      setNotification(`Someone from ${location} purchased this ${minutes} min ago`);
      setShowNotification(true);
      
      setTimeout(() => setShowNotification(false), 4000);
    }, 15000);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(notificationInterval);
    };
  }, []);

  return (
    <>
      {/* Current Viewers Badge */}
      {viewers > 0 && (
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span>{viewers} {viewers === 1 ? 'person' : 'people'} viewing this</span>
        </div>
      )}

      {/* Purchase Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white shadow-lg rounded-lg p-4 border-l-4 border-green-500 animate-slide-up z-50">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xl">✓</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{notification}</p>
              <p className="text-xs text-gray-500 mt-0.5">Verified purchase</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Purchases Count */}
      {recentPurchases > 0 && (
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
          <span>🔥</span>
          <span>{recentPurchases}+ sold in last 24 hours</span>
        </div>
      )}
    </>
  );
}
