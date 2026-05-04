export function Logo({ color = "currentColor", size = 24 }) {
  return (
    <svg
      aria-label="Logo"
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M118.367 35.4609V68.8047L102.453 84.7188H94.1172L118.367 112H91.8438L66.0781 84.7188H29.7031V112H10V55.1641L50.1641 15H98.6641L118.367 35.4609ZM30.4609 36.2188V80.1719H38.0391L49.4062 68.8047L97.1484 68.0469V36.2188H30.4609Z"
        fill={color}
      />
    </svg>
  );
}
