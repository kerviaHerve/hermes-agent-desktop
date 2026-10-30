import { ThreadPrimitive, useAuiState } from '@assistant-ui/react'
import { useStore } from '@nanostores/react'
import { type ComponentProps, createContext, useContext, useMemo } from 'react'

import { useComposerScope } from '@/app/chat/composer/scope'
import { $activeGatewayProfile, normalizeProfileKey } from '@/store/profile'

import { contentHasVisibleText, messageContentText, PROCESS_NOTIFICATION_RE } from './content'

interface GroupMessage {
  role: string
  content: unknown
  metadata?: { custom?: Record<string, unknown> }
}

/** Background deliveries continue the response without becoming human prompts. */
export function responseMessageRole(message: GroupMessage): string {
  const custom = message.metadata?.custom

  const background =
    message.role === 'system'
      ? Boolean(custom?.asyncResult || custom?.asyncResultKind)
      : message.role === 'user' && PROCESS_NOTIFICATION_RE.test(messageContentText(message.content))

  return background ? 'background' : message.role
}

export const ResponseMessageIds = createContext<readonly string[]>([])
export const ResponseAgentProfileContext = createContext<string | null>(null)

interface ResponseMessagesProps {
  components: ComponentProps<typeof ThreadPrimitive.MessageByIndex>['components']
  indices: readonly number[]
}

interface ResponseRow {
  index: number
  id: string
  role: string
  hasText: boolean
}

interface ResponseSection {
  key: string
  indices: number[]
  assistantIds: string[]
  response: boolean
}

/** Keep message runtimes intact; only their visual container and footer are shared. */
export function ResponseMessages({ components, indices }: ResponseMessagesProps) {
  const routedProfile = useContext(ResponseAgentProfileContext)
  const scope = useComposerScope()
  const activeProfile = useStore($activeGatewayProfile)
  const profile = normalizeProfileKey(routedProfile ?? scope.profile ?? activeProfile)
  const agentName = profile === 'default' ? 'Hermes' : profile

  const signature = useAuiState(s =>
    JSON.stringify(
      indices.flatMap(index => {
        const message = s.thread.messages[index]

        // A history replacement can notify this row before its parent updates indices.
        return message
          ? [
              {
                index,
                id: message.id,
                role: responseMessageRole(message),
                hasText: contentHasVisibleText(message.content)
              }
            ]
          : []
      })
    )
  )

  const sections = useMemo(() => {
    const rows = JSON.parse(signature) as ResponseRow[]
    const result: ResponseSection[] = []

    for (const row of rows) {
      const response = row.role === 'assistant' || row.role === 'background'
      const previous = result.at(-1)

      const section: ResponseSection =
        response && previous?.response ? previous : { key: row.id, indices: [], assistantIds: [], response }

      if (section !== previous) {
        result.push(section)
      }

      section.indices.push(row.index)

      if (row.role === 'assistant' && row.hasText) {
        section.assistantIds.push(row.id)
      }
    }

    return result
  }, [signature])

  return sections.map(section =>
    section.response ? (
      <ResponseMessageIds.Provider key={section.key} value={section.assistantIds}>
        <div className="group flex min-w-0 flex-col gap-(--scaffold-block-gap)" data-slot="aui_response-group">
          {section.assistantIds.length > 0 && (
            <div
              className="flex items-center gap-2 pl-(--message-text-indent) text-[0.6875rem] font-medium text-(--ui-text-secondary)"
              data-slot="aui_response-agent-label"
            >
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-(--theme-primary)" />
              <span className="truncate">{agentName}</span>
            </div>
          )}
          {section.indices.map(index => (
            <ThreadPrimitive.MessageByIndex components={components} index={index} key={index} />
          ))}
        </div>
      </ResponseMessageIds.Provider>
    ) : (
      <ThreadPrimitive.MessageByIndex components={components} index={section.indices[0]!} key={section.key} />
    )
  )
}
