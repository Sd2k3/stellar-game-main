
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ShipProps {
  position: { x: number; y: number };
  rotation: number;
  className?: string;
  size?: number;
}

const Ship: React.FC<ShipProps> = ({ position, rotation, className, size = 40 }) => {
  return (
    <div
      className={cn("absolute transition-transform glow", className)}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
        width: size,
        height: size,
        zIndex: 10,
      }}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M50 10 L80 80 L50 65 L20 80 Z"
          fill="#0EA5E9"
          stroke="#D946EF"
          strokeWidth="2"
        />
        <circle cx="50" cy="45" r="8" fill="#FBBF24" />
      </svg>
      <div
        className="absolute bottom-0 left-1/2 w-4 h-12 bg-gradient-to-t from-orange-500 to-transparent opacity-80 animate-pulse"
        style={{
          transform: "translate(-50%, 100%)",
          borderRadius: "0 0 20px 20px",
        }}
      />
    </div>
  );
};

export default Ship;
