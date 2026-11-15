export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#0f5132" />
      <path d="M6 7 H12 L17 12 V18" stroke="#d8ad52" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="7" r="2.2" fill="#d8ad52" />
      <circle cx="6" cy="7" r="0.9" fill="#0b0d10" />
      <circle cx="17" cy="18" r="2.2" fill="#d8ad52" />
      <circle cx="17" cy="18" r="0.9" fill="#0b0d10" />
    </svg>
  )
}
