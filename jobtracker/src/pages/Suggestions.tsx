import { useState } from 'react'
import { PageHeader, Tabs } from '@/components/ui/misc'
import { SuggestionsList, useSuggestions } from '@/components/features/SuggestionsPanel'

export default function Suggestions() {
  const { items, snooze } = useSuggestions({ all: false })
  const [tab, setTab] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const count = (s: string) => items.filter(i => i.severity === s).length
  const shown = tab === 'all' ? items : items.filter(i => i.severity === tab)
  return (
    <>
      <PageHeader title="Suggestions" subtitle="Your recruitment coach — practical next steps based on your own data, with ready-to-send messages" />
      <Tabs label="Priority" value={tab} onChange={setTab} tabs={[
        { value: 'all', label: 'All', count: items.length }, { value: 'high', label: 'Do now', count: count('high'), tone: 'danger' },
        { value: 'medium', label: 'Soon', count: count('medium') }, { value: 'low', label: 'When you can', count: count('low') },
      ]} />
      <div className="mt-4 max-w-4xl"><SuggestionsList items={shown} onSnooze={snooze} /></div>
    </>
  )
}
