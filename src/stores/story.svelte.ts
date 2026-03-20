import type { Story, Chapter, Scene } from '../types/story'
import type { Character } from '../types/character'
import { createStory, createChapter, createScene, createCharacter } from '../engine/defaults'
import { db } from '../db/index'
import { storyToRecord, recordToStory } from '../db/serialization'

interface StoryStore {
  current: Story | null
  stories: Array<{ id: string; title: string; updatedAt: string }>
  loading: boolean
  error: string | null
}

let state = $state<StoryStore>({
  current: null,
  stories: [],
  loading: false,
  error: null,
})

async function saveCurrentStory(): Promise<void> {
  if (!state.current) return
  state.current.metadata.updatedAt = new Date().toISOString()
  const record = storyToRecord(state.current)
  await db.stories.put(record)
}

export function useStoryStore() {
  return {
    get current() { return state.current },
    get stories() { return state.stories },
    get loading() { return state.loading },
    get error() { return state.error },

    async loadStoryList() {
      state.loading = true
      try {
        const records = await db.stories.orderBy('updatedAt').reverse().toArray()
        state.stories = records.map(r => ({ id: r.id, title: r.title, updatedAt: r.updatedAt }))
      } catch (e) {
        state.error = e instanceof Error ? e.message : 'Failed to load stories'
      } finally {
        state.loading = false
      }
    },

    async createNewStory(title: string): Promise<Story> {
      const story = createStory({ title })
      const chapter = createChapter({ title: '第一章', order: 0 })
      const scene = createScene(chapter.id)
      chapter.scenes.push(scene)
      story.chapters.push(chapter)
      story.metadata.currentSceneId = scene.id
      story.metadata.totalScenes = 1

      state.current = story
      await saveCurrentStory()
      return story
    },

    async loadStory(id: string): Promise<void> {
      state.loading = true
      try {
        const record = await db.stories.get(id)
        if (!record) {
          state.error = `Story ${id} not found`
          return
        }
        state.current = recordToStory(record)
      } catch (e) {
        state.error = e instanceof Error ? e.message : 'Failed to load story'
      } finally {
        state.loading = false
      }
    },

    async save(): Promise<void> {
      await saveCurrentStory()
    },

    addCharacter(overrides?: Partial<Character>): Character | null {
      if (!state.current) return null
      const char = createCharacter(overrides)
      state.current.characters.set(char.id, char)
      return char
    },

    addChapter(title: string): Chapter | null {
      if (!state.current) return null
      const chapter = createChapter({
        title,
        order: state.current.chapters.length,
      })
      state.current.chapters.push(chapter)
      return chapter
    },

    addScene(chapterId: string): Scene | null {
      if (!state.current) return null
      const chapter = state.current.chapters.find(c => c.id === chapterId)
      if (!chapter) return null
      const scene = createScene(chapterId)
      chapter.scenes.push(scene)
      state.current.metadata.totalScenes += 1
      return scene
    },

    getCurrentScene(): Scene | null {
      if (!state.current) return null
      const sceneId = state.current.metadata.currentSceneId
      for (const chapter of state.current.chapters) {
        const scene = chapter.scenes.find(s => s.id === sceneId)
        if (scene) return scene
      }
      return null
    },

    setCurrent(s: Story): void {
      state.current = s
    },

    async deleteStory(id: string): Promise<void> {
      await db.stories.delete(id)
      if (state.current?.id === id) {
        state.current = null
      }
      state.stories = state.stories.filter(s => s.id !== id)
    },
  }
}
