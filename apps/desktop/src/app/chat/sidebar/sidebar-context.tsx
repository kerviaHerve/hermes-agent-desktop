import { LOCAL_CONNECTION_ID } from '@hermes/shared'
import { useStore } from '@nanostores/react'
import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/i18n'
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
export function SidebarContext() {
  const { t } = useI18n()
  const activeConnectionId = useStore($activeConnectionId)
  const registry = useStore($connectionsRegistry)
  const activeProfile = useStore($activeGatewayProfile)
  const profileScope = useStore($profileScope)
  const profiles = useStore($profiles)
  const profileOrder = useStore($profileOrder)

  const connectionLabel =
    registry?.connections.find(connection => connection.id === (activeConnectionId ?? LOCAL_CONNECTION_ID))?.label ??
    t.settings.gateway.webappHostTitle

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
    <div className="flex min-w-0 items-center justify-between gap-2 px-2 pb-1 pt-1" data-sidebar-context>
      <span className="min-w-0 truncate text-xs font-semibold text-(--ui-text-primary)">{connectionLabel}</span>
      {choices.length > 1 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`${t.profiles.title}: ${profileName}`}
              className="min-w-0 shrink-0 gap-1"
              size="xs"
              variant="outline"
            >
              <span className="max-w-22 truncate">{profileName}</span>
              <ChevronDown aria-hidden="true" className="size-3" strokeWidth={1.75} />
            </Button>
          </DropdownMenuTrigger>
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
        <span className="max-w-22 truncate text-[0.6875rem] text-(--ui-text-tertiary)">{profileName}</span>
      )}
    </div>
  )
}
