'use client'

const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
]

interface XPBarProps {
  currentXp: number
  level: number
  height?: string
}

export function XPBar({ currentXp, level, height = 'h-1.5' }: XPBarProps) {
  const nextLevelXp = XP_THRESHOLDS[level] || XP_THRESHOLDS[XP_THRESHOLDS.length - 1]
  const prevLevelXp = XP_THRESHOLDS[level - 1] || 0
  
  // Progress within the current level
  const progressInLevel = currentXp - prevLevelXp
  const neededForNextLevel = nextLevelXp - prevLevelXp
  
  const pct = neededForNextLevel > 0 
    ? Math.max(0, Math.min(100, Math.round((progressInLevel / neededForNextLevel) * 100))) 
    : 100

  return (
    <div className="space-y-1.5">
      <div className={`w-full bg-gray-200 dark:bg-gray-800 rounded-full ${height} overflow-hidden shadow-inner`}>
        <div
          className={`${height} bg-amber-main rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
        <span>Level {level}</span>
        <span className="text-amber-highlight/80">{currentXp} / {nextLevelXp} XP</span>
        <span>Level {level + 1}</span>
      </div>
    </div>
  )
}
