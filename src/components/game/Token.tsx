
import React from "react";

interface TokenProps {
  position: { x: number; y: number };
  collected: boolean;
  special?: boolean;
}

const Token: React.FC<TokenProps> = ({ position, collected, special = false }) => {
  if (collected) return null;

  return (
    <div
      className={`absolute transition-transform ${special ? "animate-pulse" : ""}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: 30,
        height: 30,
        filter: special ? "drop-shadow(0 0 8px #FFC107)" : "drop-shadow(0 0 3px #FBBF24)",
      }}
    >
      <svg
        className={`w-full h-full ${special ? "text-amber-400" : "text-space-nova-yellow"}`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <circle cx="12" cy="12" r="10" />
        <path
          fill="white"
          d="M12 6l1.5 4.5h4.5l-3.6 2.7 1.4 4.3-3.8-2.8-3.8 2.8 1.4-4.3-3.6-2.7h4.5z"
        />
      </svg>
    </div>
  );
};

export default Token;
