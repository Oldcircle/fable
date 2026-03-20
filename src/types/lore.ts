export interface LoreEntry {
  id: string
  name: string
  content: string
  triggerKeywords: string[]
  isConstant: boolean
  probability: number
  group?: string
  groupWeight?: number
  requiresKnowledge?: boolean
  sourceUid?: string
}
