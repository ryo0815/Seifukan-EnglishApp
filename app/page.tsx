"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { stages } from "@/lib/phrases"
import { 
  Shield, 
  Sword, 
  Star,
  Lock,
  Check,
  BookOpen,
  LucideIcon
} from "lucide-react"

type StageConfig = {
  [key: string]: {
    icon: LucideIcon;
    title: string;
    color: string;
  }
}

type Node = {
  type: 'title' | 'sub-stage';
  id: string;
  title: string;
  point: { x: number; y: number };
  description?: string;
  color?: string;
  parentStageId?: string;
  parentStageColor?: string;
  isLocked?: boolean;
  isCompleted?: boolean;
}


export default function Home() {
  const router = useRouter()

  const stageConfig: StageConfig = {
    'stage-0': { icon: Shield, title: '防御', color: 'blue' },
    'stage-1': { icon: Sword, title: '攻撃', color: 'orange' },
    'stage-2': { icon: Star, title: '発信', color: 'purple' }
  }

  const handleSubStageClick = (stageId: string, subStageId: string) => {
    router.push(`/stage/${stageId}/${subStageId}`)
  }

  // --- Layout & Path Calculation ---
  let subStageNodes: Node[] = []
  let yOffset = 100

  stages.forEach(stage => {
    // Stage Title Node
    subStageNodes.push({
      type: 'title',
      id: `title-${stage.id}`,
      title: stage.title,
      description: stage.description,
      point: { x: 200, y: yOffset },
      color: stageConfig[stage.id].color,
    })
    yOffset += 120

    // Sub-stage Nodes
    stage.subStages.forEach((subStage, index) => {
      let x = 200 // Center
      if (stage.subStages.length > 1) {
        if (index % 4 === 1) x = 80 // Left
        else if (index % 4 === 3) x = 320 // Right
      }
      subStageNodes.push({
        type: 'sub-stage',
        id: subStage.id,
        title: subStage.title,
        point: { x, y: yOffset },
        parentStageId: stage.id,
        parentStageColor: stageConfig[stage.id].color,
        isLocked: false, // Mock
        isCompleted: true, // Mock
      })
      yOffset += 180
    })
    yOffset += 20 // Extra space between stages
  })

  const subStagePoints = subStageNodes.filter(n => n.type === 'sub-stage').map(n => n.point)
  const pathData = subStagePoints.length > 1 ? subStagePoints.slice(1).reduce(
    (d, point, index) => {
      const prevPoint = subStagePoints[index]
      const controlPoint1 = { x: prevPoint.x, y: prevPoint.y + 90 }
      const controlPoint2 = { x: point.x, y: point.y - 90 }
      return `${d} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${point.x} ${point.y}`
    },
    `M ${subStagePoints[0].x} ${subStagePoints[0].y}`
  ) : ''
  // --- End Calculation ---

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="py-6 text-center bg-gray-50/90 backdrop-blur-sm sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-gray-800">
          学習コース
        </h1>
      </header>
      
      <main className="relative w-full max-w-[400px] mx-auto pb-20" style={{ height: `${yOffset}px` }}>
        <svg className="absolute top-0 left-0 w-full h-full z-0" viewBox={`0 0 400 ${yOffset}`} preserveAspectRatio="xMidYMid meet">
          <path d={pathData} fill="none" stroke="#D1D5DB" strokeWidth="8" strokeLinecap="round" />
        </svg>

        <div className="relative z-10">
          {subStageNodes.map((node) => {
            if (node.type === 'title') {
              const stageInfo = stageConfig[node.id.replace('title-', '')];
              if (!stageInfo) return null;
              const StageIcon = stageInfo.icon
              return (
                <div key={node.id} className="absolute w-full" style={{ top: `${node.point.y}px`, left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div className={`text-center p-4 bg-${node.color}-100 border-y-4 border-${node.color}-200`}>
                    <StageIcon className={`w-8 h-8 mx-auto text-${node.color}-500 mb-2`} />
                    <h2 className={`text-xl font-bold text-${node.color}-700`}>{node.title}</h2>
                    <p className={`text-sm text-${node.color}-600`}>{node.description}</p>
                  </div>
                </div>
              )
            }
            
            if (node.type === 'sub-stage') {
              return (
                <div key={node.id} className="absolute text-center" style={{ top: `${node.point.y}px`, left: `${node.point.x}px`, transform: 'translate(-50%, -50%)' }}>
                  <Button
                    onClick={() => handleSubStageClick(node.parentStageId!, node.id)}
                    disabled={node.isLocked}
                    className={`relative w-24 h-24 rounded-full shadow-lg border-8 border-gray-50 bg-${node.parentStageColor}-500 hover:bg-${node.parentStageColor}-600`}
                  >
                    <BookOpen className="w-10 h-10 text-white" />
                    {node.isLocked && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                    )}
                    {node.isCompleted && !node.isLocked && (
                       <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-1 border-4 border-gray-50">
                         <Check className="w-5 h-5 text-yellow-800" />
                       </div>
                    )}
                  </Button>
                  <p className="mt-2 text-sm font-semibold text-gray-600 w-32">{node.title}</p>
                </div>
              )
            }
            return null
          })}
        </div>
      </main>
    </div>
  )
}
