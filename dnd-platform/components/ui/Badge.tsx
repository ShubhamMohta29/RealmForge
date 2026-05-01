interface BadgeProps {
  children: React.ReactNode
  color?: 'purple' | 'teal' | 'red' | 'amber' | 'gray' | 'green'
}

export function Badge({ children, color = 'gray' }: BadgeProps) {
  const colors = {
    purple: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    teal:   'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    red:    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    amber:  'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    gray:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    green:  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>
      {children}
    </span>
  )
}