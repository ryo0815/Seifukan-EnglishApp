"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface SoundContextType {
  isSoundEnabled: boolean
  toggleSound: () => void
  playSound: (soundType: "correct" | "incorrect" | "click" | "complete") => void
}

const SoundContext = createContext<SoundContextType | null>(null)

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled)
    localStorage.setItem("owllearn-sound-enabled", JSON.stringify(!isSoundEnabled))
  }

  const playSound = (soundType: "correct" | "incorrect" | "click" | "complete") => {
    if (!isSoundEnabled) return

    // Create audio context for sound effects
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      const frequencies = {
        correct: [523.25, 659.25, 783.99], // C5, E5, G5 chord
        incorrect: [220, 196], // A3, G3
        click: [800],
        complete: [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6
      }

      frequencies[soundType].forEach((freq, index) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
        oscillator.type = "sine"

        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime + index * 0.1)
        oscillator.stop(audioContext.currentTime + 0.3 + index * 0.1)
      })
    } catch (error) {
      console.log("Audio not supported:", error)
    }
  }

  return <SoundContext.Provider value={{ isSoundEnabled, toggleSound, playSound }}>{children}</SoundContext.Provider>
}

export function useSound() {
  const context = useContext(SoundContext)
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider")
  }
  return context
}
