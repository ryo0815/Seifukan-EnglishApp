"use client"

import type React from "react"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

interface GameState {
  hearts: number
  xp: number
  streak: number
  currentStage: number
  currentSubStage: number
  completedLessons: Set<string>
  lastPlayDate: string | null
  gems: number
  totalXp: number
}

type GameAction =
  | { type: "LOSE_HEART" }
  | { type: "GAIN_XP"; amount: number }
  | { type: "COMPLETE_LESSON"; lessonId: string }
  | { type: "UPDATE_STREAK" }
  | { type: "REFILL_HEARTS" }
  | { type: "SPEND_GEMS"; amount: number }
  | { type: "EARN_GEMS"; amount: number }
  | { type: "ADVANCE_STAGE" }
  | { type: "LOAD_STATE"; state: Partial<GameState> }
  | { type: "GAIN_HEART"; amount: number }
  | { type: "GAIN_GEMS"; amount: number }
  | { type: "SYNC_FROM_DATABASE"; payload: Partial<GameState> }

const initialState: GameState = {
  hearts: 5,
  xp: 0,
  streak: 0,
  currentStage: 1,
  currentSubStage: 1,
  completedLessons: new Set(),
  lastPlayDate: null,
  gems: 100,
  totalXp: 0,
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "GAIN_XP":
      return {
        ...state,
        xp: state.xp + action.amount,
        totalXp: state.totalXp + action.amount,
      }
    case "LOSE_HEART":
      return {
        ...state,
        hearts: Math.max(0, state.hearts - 1),
      }
    case "GAIN_HEART":
      return {
        ...state,
        hearts: Math.min(5, state.hearts + 1),
      }
    case "GAIN_GEMS":
      return {
        ...state,
        gems: state.gems + action.amount,
      }
    case "SPEND_GEMS":
      return {
        ...state,
        gems: Math.max(0, state.gems - action.amount),
      }
    case "UPDATE_STREAK":
      const today = new Date().toDateString()
      const lastPlayDate = state.lastPlayDate
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
      
      let newStreak = state.streak
      if (lastPlayDate !== today) {
        if (lastPlayDate === yesterday) {
          newStreak = state.streak + 1
        } else {
          newStreak = 1
        }
      }
      
      return {
        ...state,
        streak: newStreak,
        lastPlayDate: today,
      }
    case "COMPLETE_LESSON":
      const newCompletedLessons = new Set(state.completedLessons)
      newCompletedLessons.add(action.lessonId)
      
      // Parse current stage and substage from lesson ID
      const [currentStage, currentSubStage] = action.lessonId.split('-').map(Number)
      
      // Calculate next stage/substage
      const subStagesPerStage = 5 // Number of substages per stage
      let newStage = state.currentStage
      let newSubStage = state.currentSubStage
      
      // If this lesson is the current lesson, advance
      if (currentStage === state.currentStage && currentSubStage === state.currentSubStage) {
        if (currentSubStage < subStagesPerStage) {
          newSubStage = currentSubStage + 1
        } else {
          newStage = currentStage + 1
          newSubStage = 1
        }
      }
      
      return {
        ...state,
        completedLessons: newCompletedLessons,
        currentStage: newStage,
        currentSubStage: newSubStage,
        gems: state.gems + 5, // Bonus gems for completing lessons
      }

    case "REFILL_HEARTS":
      return { ...state, hearts: 5 }

    case "ADVANCE_STAGE":
      const subStagesPerStageAdvance = 5
      let nextStage = state.currentStage
      let nextSubStage = state.currentSubStage
      
      if (state.currentSubStage < subStagesPerStageAdvance) {
        nextSubStage = state.currentSubStage + 1
      } else {
        nextStage = state.currentStage + 1
        nextSubStage = 1
      }
      
      return {
        ...state,
        currentStage: nextStage,
        currentSubStage: nextSubStage,
      }

    case "LOAD_STATE":
      return {
        ...state,
        ...action.state,
        completedLessons: new Set(action.state.completedLessons || []),
      }

    case "SYNC_FROM_DATABASE":
      return {
        ...state,
        hearts: action.payload.hearts ?? state.hearts,
        xp: action.payload.xp ?? state.xp,
        totalXp: action.payload.totalXp ?? state.totalXp,
        streak: action.payload.streak ?? state.streak,
        gems: action.payload.gems ?? state.gems,
        lastPlayDate: new Date().toDateString(),
      }

    default:
      return state
  }
}

const GameContext = createContext<{
  state: GameState
  dispatch: React.Dispatch<GameAction>
} | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("owllearn-game-state")
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        dispatch({
          type: "LOAD_STATE",
          state: {
            ...parsed,
            completedLessons: parsed.completedLessons || [],
          },
        })
      } catch (error) {
        console.error("Failed to load game state:", error)
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      ...state,
      completedLessons: Array.from(state.completedLessons),
    }
    localStorage.setItem("owllearn-game-state", JSON.stringify(stateToSave))
  }, [state])

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
