import { useStore } from '@nanostores/react'

import { useComposerScope } from '@/app/chat/composer/scope'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tip } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n'
import { ArrowsHorizontal, Layers3, LayoutList, Messages, PanelBottom } from '@/lib/icons'
import { usageContextLabel } from '@/lib/statusbar'
import { useStoreSelector } from '@/lib/use-session-slice'
import { $composerHeight, type ComposerHeight, setComposerHeight } from '@/store/composer-height'
import { $activeGatewayProfile, normalizeProfileKey } from '@/store/profile'
import { $gatewayState } from '@/store/session'
import { $sessionStates } from '@/store/session-states'
import { $threadLayout, toggleThreadLayout } from '@/store/thread-layout'
import { $threadWidth, setThreadWidth, type ThreadWidth } from '@/store/thread-width'

interface ComposerChromeProps {
  activity: boolean
  collapsed: boolean
  controls: string
  desktopLayout?: boolean
  onToggleActivity: () => void
  profile?: null | string
  sessionId: null | string
}

export function ComposerChrome({
  activity,
  collapsed,
  controls,
  desktopLayout = false,
  onToggleActivity,
  profile,
  sessionId
}: ComposerChromeProps) {
  const { t } = useI18n()
  const scope = useComposerScope()
  const activeProfile = useStore($activeGatewayProfile)
  const gatewayState = useStore($gatewayState)
  const profileKey = normalizeProfileKey(profile ?? scope.profile ?? activeProfile)
  const agentName = profileKey === 'default' ? 'Hermes' : profileKey.charAt(0).toUpperCase() + profileKey.slice(1)
  const usage = useStoreSelector($sessionStates, states => (sessionId ? states[sessionId]?.usage : null))
  const tokenLabel = usage ? usageContextLabel(usage) : ''

  return (
    <div
      className="flex min-h-7 items-center gap-2 px-2 pb-1 text-[0.6875rem] text-(--ui-text-tertiary)"
      data-slot="composer-chrome"
    >
      {desktopLayout && (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-(--theme-primary)"
          data-slot="composer-status-dot"
        />
      )}
      <span className="max-w-32 truncate font-medium text-(--ui-text-secondary)">{agentName}</span>
      {desktopLayout && gatewayState === 'open' && <span>{t.composer.ready}</span>}
      {tokenLabel && (
        <Tip label={t.composer.contextTokens} placement="control">
          <span className="shrink-0 tabular-nums">
            {desktopLayout ? `${t.composer.context} · ` : '· '}
            {tokenLabel}
          </span>
        </Tip>
      )}
      {!desktopLayout && (
        <ComposerDisplayControls
          activity={activity}
          collapsed={collapsed}
          controls={controls}
          desktopLayout={false}
          onToggleActivity={onToggleActivity}
        />
      )}
    </div>
  )
}

type ComposerDisplayControlsProps = Pick<
  ComposerChromeProps,
  'activity' | 'collapsed' | 'controls' | 'desktopLayout' | 'onToggleActivity'
>

export function ComposerDisplayControls({
  activity,
  collapsed,
  controls,
  desktopLayout = false,
  onToggleActivity
}: ComposerDisplayControlsProps) {
  const { t } = useI18n()
  const height = useStore($composerHeight)
  const threadLayout = useStore($threadLayout)
  const threadWidth = useStore($threadWidth)

  const sizes: { label: string; value: ComposerHeight }[] = [
    { label: t.composer.heightCompact, value: 'compact' },
    { label: t.composer.heightComfort, value: 'comfort' },
    { label: t.composer.heightExpanded, value: 'expanded' }
  ]

  const sizeLabel = sizes.find(size => size.value === height)?.label ?? sizes[0]!.label

  const widths: { label: string; value: ThreadWidth }[] = [
    { label: t.composer.threadWidthFocused, value: 'focused' },
    { label: t.composer.threadWidthBalanced, value: 'balanced' },
    { label: t.composer.threadWidthWide, value: 'wide' },
    { label: t.composer.threadWidthFull, value: 'full' }
  ]

  const widthLabel = widths.find(width => width.value === threadWidth)?.label ?? widths[1]!.label

  const layoutLabel = threadLayout === 'editorial' ? t.composer.threadLayoutEditorial : t.composer.threadLayoutDialogue

  const nextLayoutLabel =
    threadLayout === 'editorial' ? t.composer.threadLayoutDialogue : t.composer.threadLayoutEditorial

  return (
    <div
      className={`flex shrink-0 items-center gap-0.5 p-0.5${desktopLayout ? '' : ' ml-auto'}`}
      data-slot="composer-display-controls"
    >
      <DropdownMenu>
        <Tip label={`${t.composer.height}: ${sizeLabel}`} placement="control">
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`${t.composer.height}: ${sizeLabel}`}
              className="size-7"
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <PanelBottom className="size-[1.0625rem]" />
            </Button>
          </DropdownMenuTrigger>
        </Tip>
        <DropdownMenuContent align="end" side="top" sideOffset={6}>
          <DropdownMenuLabel>{t.composer.height}</DropdownMenuLabel>
          <DropdownMenuRadioGroup onValueChange={value => setComposerHeight(value as ComposerHeight)} value={height}>
            {sizes.map(size => (
              <DropdownMenuRadioItem key={size.value} value={size.value}>
                {size.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {desktopLayout && (
        <>
          <DropdownMenu>
            <Tip label={`${t.composer.threadWidth}: ${widthLabel}`} placement="control">
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={`${t.composer.threadWidth}: ${widthLabel}`}
                  className="size-7"
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <ArrowsHorizontal className="size-[1.0625rem]" />
                </Button>
              </DropdownMenuTrigger>
            </Tip>
            <DropdownMenuContent align="end" side="top" sideOffset={6}>
              <DropdownMenuLabel>{t.composer.threadWidth}</DropdownMenuLabel>
              <DropdownMenuRadioGroup onValueChange={value => setThreadWidth(value as ThreadWidth)} value={threadWidth}>
                {widths.map(width => (
                  <DropdownMenuRadioItem key={width.value} value={width.value}>
                    {width.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tip label={t.composer.threadLayoutToggle(layoutLabel, nextLayoutLabel)} placement="control">
            <Button
              aria-label={t.composer.threadLayoutToggle(layoutLabel, nextLayoutLabel)}
              className="size-7"
              onClick={toggleThreadLayout}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              {threadLayout === 'editorial' ? (
                <LayoutList className="size-[1.0625rem]" />
              ) : (
                <Messages className="size-[1.0625rem]" />
              )}
            </Button>
          </Tip>
        </>
      )}
      <Tip label={t.composer.activityAndQueue} placement="control">
        <Button
          aria-controls={controls}
          aria-expanded={!collapsed}
          aria-label={t.composer.activityAndQueue}
          className="size-7"
          onClick={onToggleActivity}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Layers3 className="size-[1.0625rem]" />
          {activity && <span className="absolute right-0.5 top-0.5 size-1 rounded-full bg-(--theme-primary)" />}
        </Button>
      </Tip>
    </div>
  )
}
