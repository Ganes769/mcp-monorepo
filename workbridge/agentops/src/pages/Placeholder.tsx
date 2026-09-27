import { ArrowLeft, Construction } from 'lucide-react'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'

export function Placeholder({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <Panel className="flex min-h-[420px] flex-col items-center justify-center p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Construction className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h2 className="mt-4 text-lg font-bold tracking-[-0.03em] text-slate-950">{title}</h2>
      <p className="mt-1 max-w-sm text-[13px] text-slate-500">
        This view isn't part of the dashboard prototype yet. Everything on the Dashboard is fully interactive.
      </p>
      <Button className="mt-5" size="md" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>
    </Panel>
  )
}
