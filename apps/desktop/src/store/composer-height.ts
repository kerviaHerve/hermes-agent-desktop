import { type Codec, persistentAtom } from '@/lib/persisted'

export type ComposerHeight = 'compact' | 'comfort' | 'expanded'

const codec: Codec<ComposerHeight> = {
  decode: raw => (raw === 'comfort' || raw === 'expanded' ? raw : 'compact'),
  encode: value => (value === 'compact' ? null : value)
}

// This is a reading/writing preference of this Desktop installation, shared
// by its chat panes and independent of whichever Hermes gateway owns a turn.
export const $composerHeight = persistentAtom<ComposerHeight>('hermes.desktop.composerHeight', 'compact', codec)

export const setComposerHeight = (height: ComposerHeight): void => $composerHeight.set(height)
