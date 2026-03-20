import Dexie, { type EntityTable } from 'dexie'

/** Serializable story record for IndexedDB storage */
export interface StoryRecord {
  id: string
  title: string
  synopsis: string
  narratorStyleJson: string
  chaptersJson: string
  charactersJson: string
  worldStateJson: string
  plotGraphJson: string
  loreEntriesJson: string
  createdAt: string
  updatedAt: string
  currentSceneId: string
}

export interface CharacterRecord {
  id: string
  storyId: string
  identityJson: string
  stateJson: string
  importSourceJson?: string
}

export interface SettingsRecord {
  key: string
  value: string
}

const db = new Dexie('FableDB') as Dexie & {
  stories: EntityTable<StoryRecord, 'id'>
  characters: EntityTable<CharacterRecord, 'id'>
  settings: EntityTable<SettingsRecord, 'key'>
}

db.version(1).stores({
  stories: 'id, title, updatedAt',
  characters: 'id, storyId',
  settings: 'key',
})

export { db }
