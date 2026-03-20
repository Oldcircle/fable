import { describe, it, expect } from 'vitest'
import { createDefaultPlotGraph } from './defaults'
import {
  addNode,
  addEdge,
  traverseEdge,
  getOutgoingEdges,
  getIncomingEdges,
  getVisitedPath,
  wouldCreateCycle,
  removeNode,
} from './plot-graph'

function buildTestGraph() {
  const graph = createDefaultPlotGraph()
  const n1 = addNode(graph, 'scene-1', '开始')
  const n2 = addNode(graph, 'scene-2', '遇到守卫', 'choice')
  const n3 = addNode(graph, 'scene-3', '战斗')
  const n4 = addNode(graph, 'scene-4', '说服')
  if (!n1.ok || !n2.ok || !n3.ok || !n4.ok) throw new Error('Failed to create nodes')
  addEdge(graph, n1.value.id, n2.value.id, '走向城门')
  addEdge(graph, n2.value.id, n3.value.id, '拔剑', 'opt-fight')
  addEdge(graph, n2.value.id, n4.value.id, '谈判', 'opt-talk')
  return { graph, n1: n1.value, n2: n2.value, n3: n3.value, n4: n4.value }
}

describe('addNode', () => {
  it('adds a node and sets it as current if first', () => {
    const graph = createDefaultPlotGraph()
    const result = addNode(graph, 'scene-1', '开始')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(graph.nodes.size).toBe(1)
      expect(graph.currentNodeId).toBe(result.value.id)
      expect(result.value.isVisited).toBe(false)
    }
  })

  it('does not override currentNodeId for subsequent nodes', () => {
    const graph = createDefaultPlotGraph()
    const first = addNode(graph, 'scene-1', '开始')
    addNode(graph, 'scene-2', '第二幕')
    if (first.ok) {
      expect(graph.currentNodeId).toBe(first.value.id)
    }
  })
})

describe('addEdge', () => {
  it('adds an edge between existing nodes', () => {
    const { graph } = buildTestGraph()
    expect(graph.edges.length).toBe(3)
  })

  it('fails for non-existent source node', () => {
    const graph = createDefaultPlotGraph()
    addNode(graph, 'scene-1', '开始')
    const result = addEdge(graph, 'fake', 'also-fake')
    expect(result.ok).toBe(false)
  })

  it('rejects duplicate edges', () => {
    const { graph, n1, n2 } = buildTestGraph()
    const result = addEdge(graph, n1.id, n2.id)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('already exists')
    }
  })
})

describe('traverseEdge', () => {
  it('moves current node and marks visited', () => {
    const { graph, n1, n2 } = buildTestGraph()
    const result = traverseEdge(graph, n1.id, n2.id)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.isVisited).toBe(true)
      expect(graph.currentNodeId).toBe(n2.id)
    }
    // Edge should be marked as traversed
    const edge = graph.edges.find(e => e.from === n1.id && e.to === n2.id)
    expect(edge?.isTraversed).toBe(true)
  })

  it('fails for non-existent edge', () => {
    const { graph, n1, n3 } = buildTestGraph()
    const result = traverseEdge(graph, n1.id, n3.id)
    expect(result.ok).toBe(false)
  })
})

describe('getOutgoingEdges', () => {
  it('returns edges from a choice node', () => {
    const { graph, n2 } = buildTestGraph()
    const edges = getOutgoingEdges(graph, n2.id)
    expect(edges.length).toBe(2)
    expect(edges.map(e => e.label)).toContain('拔剑')
    expect(edges.map(e => e.label)).toContain('谈判')
  })
})

describe('getIncomingEdges', () => {
  it('returns edges leading to a node', () => {
    const { graph, n2 } = buildTestGraph()
    const edges = getIncomingEdges(graph, n2.id)
    expect(edges.length).toBe(1)
  })
})

describe('getVisitedPath', () => {
  it('returns only visited nodes', () => {
    const { graph, n1, n2 } = buildTestGraph()
    traverseEdge(graph, n1.id, n2.id)
    const visited = getVisitedPath(graph)
    expect(visited.length).toBe(1) // only n2 is visited (n1 was never traversed to)
    expect(visited[0].id).toBe(n2.id)
  })
})

describe('wouldCreateCycle', () => {
  it('detects cycle in A→B→C→A', () => {
    const graph = createDefaultPlotGraph()
    const a = addNode(graph, 's1', 'A')
    const b = addNode(graph, 's2', 'B')
    const c = addNode(graph, 's3', 'C')
    if (!a.ok || !b.ok || !c.ok) throw new Error('setup failed')
    addEdge(graph, a.value.id, b.value.id)
    addEdge(graph, b.value.id, c.value.id)
    // Adding C→A would create a cycle
    expect(wouldCreateCycle(graph, c.value.id, a.value.id)).toBe(true)
  })

  it('returns false for valid DAG edge', () => {
    const { graph, n1, n3 } = buildTestGraph()
    // n1→n3 doesn't exist, and n3 has no path back to n1
    expect(wouldCreateCycle(graph, n1.id, n3.id)).toBe(false)
  })
})

describe('removeNode', () => {
  it('removes node and its edges', () => {
    const { graph, n2 } = buildTestGraph()
    const edgesBefore = graph.edges.length
    const result = removeNode(graph, n2.id)
    expect(result.ok).toBe(true)
    expect(graph.nodes.has(n2.id)).toBe(false)
    expect(graph.edges.length).toBeLessThan(edgesBefore)
    // No edges should reference n2
    expect(graph.edges.some(e => e.from === n2.id || e.to === n2.id)).toBe(false)
  })

  it('resets currentNodeId if removed', () => {
    const graph = createDefaultPlotGraph()
    const n = addNode(graph, 's1', 'A')
    if (!n.ok) throw new Error('setup failed')
    expect(graph.currentNodeId).toBe(n.value.id)
    removeNode(graph, n.value.id)
    expect(graph.currentNodeId).toBe('')
  })

  it('fails for non-existent node', () => {
    const graph = createDefaultPlotGraph()
    const result = removeNode(graph, 'fake')
    expect(result.ok).toBe(false)
  })
})
