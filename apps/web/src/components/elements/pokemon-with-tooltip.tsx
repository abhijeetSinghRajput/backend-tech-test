"use client";

import Image from "next/image";
import { useState } from "react";

interface Pokemon {
  name: string;
  id: number;
  image: string;
}

export function PokemonWithTooltip({ pokemon }: { pokemon: Pokemon }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  return (
    <figure
      className="relative w-full flex justify-center cursor-none lg:cursor-auto"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={(e) => {
        setPos({ x: e.clientX, y: e.clientY });
      }}
    >
      <div className="relative group/poke-image">
        <Image
          src={pokemon.image}
          alt={pokemon.name}
          width={500}
          height={500}
          priority
          className="h-auto max-h-[320px] w-auto object-contain transition-transform duration-500 group-hover/poke-image:scale-105 drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)] group-hover/poke-image:drop-shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
        />
      </div>

      {/* Cursor-following Tooltip (Smooth Trailing) */}
      <div
        className={`
          pointer-events-none fixed top-0 left-0 z-[100]
          px-4 py-2 rounded-xl border border-border/50
          bg-background/90 backdrop-blur-xl
          shadow-[0_20px_50px_rgba(0,0,0,0.3)]
          transition-[opacity,transform,scale] duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]
          flex flex-col gap-0.5
          ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
        style={{
          transform: `translate3d(${pos.x + 24}px, ${pos.y + 24}px, 0)`,
        }}
      >
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest leading-none">
          #{String(pokemon.id).padStart(3, "0")}
        </div>
        <div className="text-sm font-bold capitalize text-foreground leading-tight">
          {pokemon.name}
        </div>

        {/* Subtle decorative element */}
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0.5 h-1/2 bg-primary rounded-full opacity-50" />
      </div>
    </figure>
  );
}
