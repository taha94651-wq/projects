import { useState } from 'react'
import { STAGES, type Stage } from '@shared/constants'
import type { Application } from '@shared/types'
import { changeStage } from '@/actions'
import { cx, STAGE_STYLE } from '../ui/Badge'
import { ApplicationCard } from './ApplicationCard'

/** Drag cards between columns (desktop) or use the card menu "Move to…" (touch). Columns snap-scroll on mobile. */
export function KanbanBoard({ apps }: { apps: Application[] }) {
  const [over, setOver] = useState<Stage | null>(null)
  return (
    <div className="scroll-thin -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0" role="list" aria-label="Application pipeline">
      {STAGES.map(stage => {
        const items = apps.filter(a => a.status === stage)
        return (
          <section key={stage} role="listitem" aria-label={`${stage}, ${items.length} applications`}
            onDragOver={e => { e.preventDefault(); setOver(stage) }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null) }}
            onDrop={e => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData('text/plain'); if (id) void changeStage(id, stage) }}
            className={cx('flex w-[82vw] max-w-80 shrink-0 snap-start flex-col rounded-xl border p-2 transition sm:w-72', over === stage ? 'border-brand-400 bg-brand-50/70' : 'border-ink-200/70 bg-ink-100/50')}>
            <header className="flex items-center gap-2 px-2 pb-2.5 pt-1.5">
              <span className={cx('size-2 rounded-full', STAGE_STYLE[stage].dot)} aria-hidden />
              <h3 className="text-[13px] font-semibold text-ink-800">{stage}</h3>
              <span className="ms-auto rounded-full bg-surface px-2 py-px text-xs font-medium text-ink-500">{items.length}</span>
            </header>
            <div className="flex min-h-24 flex-1 flex-col gap-2.5">
              {items.map(a => <ApplicationCard key={a.id} app={a} draggable showStage={false} onDragStart={e => { e.dataTransfer.setData('text/plain', a.id); e.dataTransfer.effectAllowed = 'move' }} />)}
              {!items.length && <p className="grid flex-1 place-items-center rounded-lg border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-ink-400">Drop here</p>}
            </div>
          </section>
        )
      })}
    </div>
  )
}
