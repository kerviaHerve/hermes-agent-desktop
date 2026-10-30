import { LOCAL_CONNECTION_ID } from '@hermes/shared'
import { useStore } from '@nanostores/react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tip } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n'
import { Users } from '@/lib/icons'
import { $connectionsRegistry } from '@/store/connection-registry-state'
import { $activeConnectionId } from '@/store/connections'
import { setSidebarGrouping } from '@/store/layout'
import {
  $activeGatewayProfile,
  $profileOrder,
  $profiles,
  $profileScope,
  ALL_PROFILES,
  normalizeProfileKey,
  profileLabel,
  selectProfile,
  sortByProfileOrder
} from '@/store/profile'

/** A compact orientation point above the list. The full fleet and connection
 *  controls remain in the status bar; this menu gives the common local agent
 *  switch a visible home without reproducing their management actions. */
export function useSidebarConnectionLabel() {
  const { t } = useI18n()
  const activeConnectionId = useStore($activeConnectionId)
  const registry = useStore($connectionsRegistry)

  const connection = registry?.connections.find(
    connection => connection.id === (activeConnectionId ?? LOCAL_CONNECTION_ID)
  )

  return connection?.id === LOCAL_CONNECTION_ID && connection.label === 'This device'
    ? t.sidebar.localHermes
    : (connection?.label ?? t.settings.gateway.webappHostTitle)
}

export function SidebarContext() {
  const { t } = useI18n()
  const connectionLabel = useSidebarConnectionLabel()
  const activeProfile = useStore($activeGatewayProfile)
  const profileScope = useStore($profileScope)
  const profiles = useStore($profiles)
  const profileOrder = useStore($profileOrder)

  const selected = profiles.find(profile => normalizeProfileKey(profile.name) === normalizeProfileKey(activeProfile))

  const profileName =
    profileScope === ALL_PROFILES ? t.profiles.allProfiles : selected ? profileLabel(selected) : activeProfile

  const defaultProfile = profiles.find(profile => profile.is_default)

  const named = sortByProfileOrder(
    profiles.filter(profile => !profile.is_default),
    profileOrder
  )

  const choices = defaultProfile ? [defaultProfile, ...named] : named

  return (
    <div className="flex h-8 min-w-0 items-center gap-1 px-1" data-sidebar-context>
      <span className="mr-auto min-w-0 truncate text-[0.8125rem] font-semibold text-(--ui-text-primary)">
        {connectionLabel}
      </span>
      {choices.length > 1 ? (
        <DropdownMenu>
          <Tip label={`${t.profiles.title}: ${profileName}`}>
            <DropdownMenuTrigger asChild>
              <Button aria-label={`${t.profiles.title}: ${profileName}`} size="icon-xs" variant="ghost">
                <Users aria-hidden="true" className="size-4" strokeWidth={1.75} />
              </Button>
            </DropdownMenuTrigger>
          </Tip>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuRadioGroup
              onValueChange={value => {
                if (value === ALL_PROFILES) {
                  setSidebarGrouping('profile')
                } else {
                  selectProfile(value)
                }
              }}
              value={profileScope}
            >
              <DropdownMenuRadioItem value={ALL_PROFILES}>{t.profiles.allProfiles}</DropdownMenuRadioItem>
              {choices.map(profile => (
                <DropdownMenuRadioItem key={profile.name} value={normalizeProfileKey(profile.name)}>
                  {profileLabel(profile)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Tip label={`${t.profiles.title}: ${profileName}`}>
          <span
            aria-label={`${t.profiles.title}: ${profileName}`}
            className="grid size-6 shrink-0 place-items-center text-(--ui-text-tertiary)"
            role="img"
          >
            <Users aria-hidden="true" className="size-4" strokeWidth={1.75} />
          </span>
        </Tip>
      )}
    </div>
  )
}
