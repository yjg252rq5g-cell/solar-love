interface KpiCardProps {
  label: string
  value: string
  color: string
  bgColor: string
}

export function KpiCard({ label, value, color, bgColor }: KpiCardProps) {
  return (
    <div className="p-4 rounded-lg" style={{ background: bgColor, borderLeft: `4px solid ${color}` }}>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  )
}
