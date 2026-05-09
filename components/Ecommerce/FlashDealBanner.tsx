import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FlashDeal {
  id: string;
  title: string;
  flash_price: number;
  original_price: number;
  discount_percentage: number;
  remaining_quantity: number;
  total_quantity: number;
  ends_at: string;
  product: {
    id: string;
    name: string;
    image_url?: string;
  };
}

interface FlashDealBannerProps {
  slug: string;
  deals: FlashDeal[];
}

export default function FlashDealBanner({ slug, deals }: FlashDealBannerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (deals.length === 0) return;

    const calculateTimeLeft = () => {
      const endTime = new Date(deals[0].ends_at).getTime();
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [deals]);

  if (deals.length === 0) return null;

  const percentSold = ((deals[0].total_quantity - deals[0].remaining_quantity) / deals[0].total_quantity) * 100;

  return (
    <div className="bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl animate-pulse">⚡</div>
            <div>
              <h2 className="text-2xl font-bold">FLASH SALE</h2>
              <p className="text-sm opacity-90">Limited time offer - Hurry up!</p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-3">
            <span className="text-sm">Ends in:</span>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg text-center min-w-[60px]">
                <div className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-xs">Hours</div>
              </div>
              <span className="text-2xl">:</span>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg text-center min-w-[60px]">
                <div className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="text-xs">Mins</div>
              </div>
              <span className="text-2xl">:</span>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg text-center min-w-[60px]">
                <div className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className="text-xs">Secs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Deal */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {deals.slice(0, 4).map((deal) => (
            <Link key={deal.id} href={`/shop/${slug}/product/${deal.product.id}`}>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition cursor-pointer">
                <div className="aspect-square bg-white rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {deal.product.image_url ? (
                    <img src={deal.product.image_url} alt={deal.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">📦</span>
                  )}
                </div>
                <div className="text-sm line-clamp-2 mb-2">{deal.product.name}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold">KES{deal.flash_price.toLocaleString()}</span>
                  <span className="text-sm line-through opacity-75">KES{deal.original_price.toLocaleString()}</span>
                </div>
                <div className="bg-white/20 rounded-full h-2 mb-1">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${percentSold}%` }}
                  />
                </div>
                <div className="text-xs opacity-90">{deal.remaining_quantity} left • {percentSold.toFixed(0)}% sold</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
