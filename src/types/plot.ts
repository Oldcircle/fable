export interface PlotGraph {
  nodes: Map<string, PlotNode>
  edges: PlotEdge[]
  currentNodeId: string
}

export interface PlotNode {
  id: string
  sceneId: string
  label: string
  type: 'normal' | 'choice' | 'merge' | 'ending'
  isVisited: boolean
}

export interface PlotEdge {
  from: string
  to: string
  label?: string
  choiceOptionId?: string
  isTraversed: boolean
}
