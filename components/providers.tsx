"use client"

import React from "react"
import { GameProvider } from "@/contexts/game-context"
import { SoundProvider } from "@/contexts/sound-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GameProvider>
      <SoundProvider>
        {children}
      </SoundProvider>
    </GameProvider>
  )
} 