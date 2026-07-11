/**
 * The FSSAI food-type mark every Indian diner scans for before reading the
 * dish name: green square + dot = veg, brown square + triangle = non-veg.
 */
export function FssaiMark({ isVeg, className = "" }: { isVeg: boolean; className?: string }) {
  const color = isVeg ? "#1a8f3c" : "#9c3c1e";
  return (
    <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 shrink-0 ${className}`} aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"} role="img">
      <rect x="1" y="1" width="14" height="14" rx="1.5" fill="none" stroke={color} strokeWidth="1.6" />
      {isVeg ? (
        <circle cx="8" cy="8" r="3.2" fill={color} />
      ) : (
        <path d="M8 4.4 L12 11.2 L4 11.2 Z" fill={color} />
      )}
    </svg>
  );
}
