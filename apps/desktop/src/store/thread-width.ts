import { type Codec, persistentAtom } from '@/lib/persisted'

export type ThreadWidth = 'focused' | 'balanced' | 'wide' | 'full'

const codec: Codec<ThreadWidth> = {
  decode: raw => (raw === 'focused' || raw === 'wide' || raw === 'full' ? raw : 'balanced'),
  encode: value => (value === 'balanced' ? null : value)
}

// Reading width belongs to this Desktop installation, independent of the
// selected Hermes gateway, agent, or conversation.
export const $threadWidth = persistentAtom<ThreadWidth>('hermes.desktop.threadWidth', 'balanced', codec)

export const setThreadWidth = (width: ThreadWidth): void => $threadWidth.set(width)
