import { Input as HeroInput } from '@heroui/react/input'
import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { Codicon } from '@/components/ui/codicon'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/i18n'
import { Search } from '@/lib/icons'
import { cn } from '@/lib/utils'

import type { SearchAge } from './search-filters'

interface SidebarSearchControlsProps {
  connectionLabel: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onAgeChange: (age: SearchAge) => void
  onProfileChange: (profile: string) => void
  onQueryChange: (query: string) => void
  onTechnicalChange: (include: boolean) => void
  age: SearchAge
  includeTechnical: boolean
  profile: string
  profileOptions: readonly { id: string; label: string }[]
  query: string
  showTechnical: boolean
}

export function SidebarSearchControls({
  age,
  connectionLabel,
  includeTechnical,
  inputRef,
  onAgeChange,
  onProfileChange,
  onQueryChange,
  onTechnicalChange,
  profile,
  profileOptions,
  query,
  showTechnical
}: SidebarSearchControlsProps) {
  const { t } = useI18n()
  const copy = t.sidebar.searchFilters
  const active = age !== 'all' || profile !== 'all' || includeTechnical
  const keepOpen = (event: Event) => event.preventDefault()

  return (
    <div className="flex shrink-0 items-center gap-1 px-2 pb-0.5 pt-0.5" data-sidebar-search-controls="">
      <div className="heroui-v2-search relative w-full min-w-0">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-(--ui-text-tertiary)" />
        <HeroInput
          aria-label={`${t.sidebar.searchAria} : ${connectionLabel}`}
          className="h-8 w-full rounded-xl border border-(--ui-stroke-tertiary) bg-(--ui-bg-quinary) pr-2.5 pl-8 text-[0.8125rem] text-foreground placeholder:text-(--ui-text-tertiary)"
          onChange={event => onQueryChange(event.target.value)}
          placeholder={t.sidebar.searchIn(connectionLabel)}
          ref={inputRef}
          value={query}
          variant="secondary"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={copy.title}
            className={cn('shrink-0', active && 'bg-(--ui-control-active-background) text-foreground')}
            size="icon-xs"
            variant="ghost"
          >
            <Codicon name="list-filter" size="0.8125rem" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {profileOptions.length > 1 && (
            <>
              <DropdownMenuLabel>{copy.agent}</DropdownMenuLabel>
              <DropdownMenuRadioGroup onValueChange={onProfileChange} value={profile}>
                <DropdownMenuRadioItem onSelect={keepOpen} value="all">
                  {copy.allAgents}
                </DropdownMenuRadioItem>
                {profileOptions.map(option => (
                  <DropdownMenuRadioItem key={option.id} onSelect={keepOpen} value={option.id}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel>{copy.date}</DropdownMenuLabel>
          <DropdownMenuRadioGroup onValueChange={value => onAgeChange(value as SearchAge)} value={age}>
            <DropdownMenuRadioItem onSelect={keepOpen} value="all">
              {copy.anyDate}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem onSelect={keepOpen} value="week">
              {copy.lastWeek}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem onSelect={keepOpen} value="month">
              {copy.lastMonth}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          {showTechnical && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={includeTechnical}
                onCheckedChange={checked => onTechnicalChange(checked === true)}
                onSelect={keepOpen}
              >
                {copy.technical}
              </DropdownMenuCheckboxItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
