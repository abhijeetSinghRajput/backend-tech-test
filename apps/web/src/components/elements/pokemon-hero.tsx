"use client";

import { useImageColor } from "@/hooks/use-image-color";
import { PokemonWithTooltip } from "./pokemon-with-tooltip";

export interface Pokemon {
  name: string;
  id: number;
  image: string;
}

export function PokemonHero({ pokemon }: { pokemon: Pokemon }) {
  const dominantColor = useImageColor(pokemon.image);

  // Create variations of the color with different opacities for the gradient
  const color44 = dominantColor.replace(/[\d.]+\)$/g, "0.15)"); // Subtle aura
  const color22 = dominantColor.replace(/[\d.]+\)$/g, "0.05)"); // Very faint outer glow

  return (
    <div className="relative w-full py-12 md:py-20 flex items-center justify-center overflow-visible">
      {/* Dynamic Aura Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1000"
        style={{
          background: `
            radial-gradient(circle at center, ${color44} 0%, transparent 60%),
            radial-gradient(circle at 70% 30%, ${color22} 0%, transparent 70%)
          `,
        }}
      />

      {/* Blurred Glow Layer (Optional Enhancement) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 rounded-full"
        style={{ backgroundColor: dominantColor }}
      />

      {/* The Pokemon Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex justify-center">
        <PokemonWithTooltip pokemon={pokemon} />
      </div>
    </div>
  );
}
