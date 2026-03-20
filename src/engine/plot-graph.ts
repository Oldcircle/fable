import type { PlotGraph, PlotNode, PlotEdge } from '../types/plot'
import { generateId } from '../utils/id'

export type PlotGraphResult<T> = { ok: true; value: T } | { ok: false; error: string }

export function addNode(
  graph: PlotGraph,
  sceneId: string,
  label: string,
  type: PlotNode['type'] = 'normal',
): PlotGraphResult<PlotNode> {
  const node: PlotNode = {
    id: generateId(),
    sceneId,
    label,
    type,
    isVisited: false,
  }
  graph.nodes.set(node.id, node)
  if (!graph.currentNodeId) {
    graph.currentNodeId = node.id
  }
  return { ok: true, value: node }
}

export function addEdge(
  graph: PlotGraph,
  from: string,
  to: string,
  label?: string,
  choiceOptionId?: string,
): PlotGraphResult<PlotEdge> {
  if (!graph.nodes.has(from)) {
    return { ok: false, error: `Source node ${from} not found` }
  }
  if (!graph.nodes.has(to)) {
    return { ok: false, error: `Target node ${to} not found` }
  }

  // Check for duplicate edges
  const duplicate = graph.edges.find(e => e.from === from && e.to === to)
  if (duplicate) {
    return { ok: false, error: `Edge from ${from} to ${to} already exists` }
  }

  const edge: PlotEdge = {
    from,
    to,
    label,
    choiceOptionId,
    isTraversed: false,
  }
  graph.edges.push(edge)
  return { ok: true, value: edge }
}

export function traverseEdge(graph: PlotGraph, from: string, to: string): PlotGraphResult<PlotNode> {
  const edge = graph.edges.find(e => e.from === from && e.to === to)
  if (!edge) {
    return { ok: false, error: `No edge from ${from} to ${to}` }
  }

  const targetNode = graph.nodes.get(to)
  if (!targetNode) {
    return { ok: false, error: `Target node ${to} not found` }
  }

  edge.isTraversed = true
  targetNode.isVisited = true
  graph.currentNodeId = to

  return { ok: true, value: targetNode }
}

export function getOutgoingEdges(graph: PlotGraph, nodeId: string): PlotEdge[] {
  return graph.edges.filter(e => e.from === nodeId)
}

export function getIncomingEdges(graph: PlotGraph, nodeId: string): PlotEdge[] {
  return graph.edges.filter(e => e.to === nodeId)
}

export function getVisitedPath(graph: PlotGraph): PlotNode[] {
  const visited: PlotNode[] = []
  for (const node of graph.nodes.values()) {
    if (node.isVisited) {
      visited.push(node)
    }
  }
  return visited
}

/** Detect if adding an edge from→to would create a cycle */
export function wouldCreateCycle(graph: PlotGraph, from: string, to: string): boolean {
  // BFS from 'to' — if we can reach 'from', adding from→to creates a cycle
  const visited = new Set<string>()
  const queue = [to]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === from) return true
    if (visited.has(current)) continue
    visited.add(current)

    for (const edge of graph.edges) {
      if (edge.from === current && !visited.has(edge.to)) {
        queue.push(edge.to)
      }
    }
  }
  return false
}

export function removeNode(graph: PlotGraph, nodeId: string): PlotGraphResult<void> {
  if (!graph.nodes.has(nodeId)) {
    return { ok: false, error: `Node ${nodeId} not found` }
  }

  graph.nodes.delete(nodeId)
  graph.edges = graph.edges.filter(e => e.from !== nodeId && e.to !== nodeId)

  if (graph.currentNodeId === nodeId) {
    graph.currentNodeId = ''
  }

  return { ok: true, value: undefined }
}
