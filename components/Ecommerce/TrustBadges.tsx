export default function TrustBadges() {
  const badges = [
    { icon: '🔒', text: 'Secure Payment', color: 'bg-blue-50 text-blue-700' },
    { icon: '✓', text: 'Buyer Protection', color: 'bg-green-50 text-green-700' },
    { icon: '🚚', text: 'Fast Delivery', color: 'bg-orange-50 text-orange-700' },
    { icon: '↩️', text: '7-Day Returns', color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {badges.map((badge, index) => (
        <div 
          key={index} 
          className={`${badge.color} rounded-lg p-3 flex items-center gap-2 text-sm font-medium`}
        >
          <span className="text-xl">{badge.icon}</span>
          <span>{badge.text}</span>
        </div>
      ))}
    </div>
  );
}
