import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GamificationWidgetProps {
  slug: string;
  customerId?: string;
}

interface UserCoins {
  total_coins: number;
  current_streak: number;
  last_check_in: string;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  coin_reward: number;
  target_count: number;
  current_count: number;
  completed: boolean;
}

export default function GamificationWidget({ slug, customerId }: GamificationWidgetProps) {
  const [coins, setCoins] = useState<UserCoins | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [showMissions, setShowMissions] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchGamificationData();
    }
  }, [customerId]);

  const fetchGamificationData = async () => {
    try {
      // Fetch user coins and missions
      // This would be implemented in the API
      setCoins({
        total_coins: 1250,
        current_streak: 5,
        last_check_in: new Date().toISOString()
      });

      setMissions([
        {
          id: '1',
          title: 'View 5 products',
          description: 'Browse and view 5 different products',
          coin_reward: 10,
          target_count: 5,
          current_count: 3,
          completed: false
        },
        {
          id: '2',
          title: 'Add to cart',
          description: 'Add any product to your cart',
          coin_reward: 15,
          target_count: 1,
          current_count: 0,
          completed: false
        },
        {
          id: '3',
          title: 'Daily check-in',
          description: 'Visit the shop today',
          coin_reward: 5,
          target_count: 1,
          current_count: 1,
          completed: true
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
    }
  };

  if (!customerId) return null;

  return (
    <>
      {/* Floating Coin Widget */}
      <div className="fixed bottom-24 right-4 z-40">
        <button
          onClick={() => setShowMissions(!showMissions)}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <div className="text-left">
              <div className="text-xs font-medium">Your Coins</div>
              <div className="text-lg font-bold">{coins?.total_coins || 0}</div>
            </div>
          </div>
        </button>
      </div>

      {/* Missions Panel */}
      {showMissions && (
        <div className="fixed bottom-48 right-4 w-80 bg-white rounded-lg shadow-2xl border z-40 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Daily Missions</h3>
                <p className="text-xs opacity-90">Complete tasks to earn coins</p>
              </div>
              <button onClick={() => setShowMissions(false)} className="text-2xl">×</button>
            </div>
            
            {/* Streak Counter */}
            <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <div className="text-xs">Current Streak</div>
                <div className="font-bold">{coins?.current_streak || 0} days</div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {missions.map((mission) => (
              <div 
                key={mission.id} 
                className={`border rounded-lg p-3 ${mission.completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{mission.title}</h4>
                    <p className="text-xs text-gray-600">{mission.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600 font-bold text-sm">
                    <span>🪙</span>
                    <span>{mission.coin_reward}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {!mission.completed && (
                  <div>
                    <div className="bg-gray-200 rounded-full h-2 mb-1">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${(mission.current_count / mission.target_count) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {mission.current_count} / {mission.target_count}
                    </div>
                  </div>
                )}

                {mission.completed && (
                  <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <span>✓</span>
                    <span>Completed!</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Rewards Shop Link */}
          <div className="p-4 border-t">
            <Link href={`/shop/${slug}/rewards`}>
              <button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-2 rounded-lg font-medium hover:shadow-lg transition">
                Visit Rewards Shop
              </button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
