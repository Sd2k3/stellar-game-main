
import React from "react";
import { cn } from "@/lib/utils";

interface AsteroidProps {
  position: { x: number; y: number };
  rotation: number;
  size: number;
  type: "small" | "medium" | "large";
  className?: string;
}

const Asteroid: React.FC<AsteroidProps> = ({
  position,
  rotation,
  size,
  type,
  className,
}) => {
  const colors = {
    small: "fill-space-asteroid-gray",
    medium: "fill-stone-500",
    large: "fill-stone-600",
  };

  return (
    <div
      className={cn("absolute transition-transform", className)}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
        width: size,
        height: size,
      }}
    >
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path
          className={colors[type]}
          d="M50 10 L70 20 L90 40 L85 70 L60 90 L30 85 L10 60 L15 30 Z"
          stroke="#64748B"
          strokeWidth="4"
        />
        <circle cx="40" cy="30" r="5" className="fill-gray-400" />
        <circle cx="70" cy="60" r="8" className="fill-gray-400" />
        <circle cx="35" cy="70" r="6" className="fill-gray-400" />
      </svg>
    </div>
  );
};

export default Asteroid;
