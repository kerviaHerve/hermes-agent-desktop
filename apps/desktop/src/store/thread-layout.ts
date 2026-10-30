import { type Codec, persistentAtom } from '@/lib/persisted'

export type ThreadLayout = 'editorial' | 'dialogue'

const codec: Codec<ThreadLayout> = {
  decode: raw => (raw === 'dialogue' ? 'dialogue' : 'editorial'),
  encode: value => (value === 'editorial' ? null : value)
}

// Presentation belongs to this Desktop installation, not the gateway or session.
export const $threadLayout = persistentAtom<ThreadLayout>('hermes.desktop.threadLayout', 'editorial', codec)

export const toggleThreadLayout = (): void =>
  $threadLayout.set($threadLayout.get() === 'editorial' ? 'dialogue' : 'editorial')
