import type { Actor } from '../resources/task.types'
import { ACTORS } from '../resources/task.constants'
import { Label } from '@/components/ui/label'

type ActorSelectProps = {
  value: Actor
  onChange: (actor: Actor) => void
}

export function ActorSelect({ value, onChange }: ActorSelectProps) {
  return (
    <div className="grid min-w-44 gap-2">
      <Label htmlFor="actor">Actor</Label>
      <select
        id="actor"
        value={value}
        onChange={(event) => onChange(event.target.value as Actor)}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {ACTORS.map((actorOption) => (
          <option key={actorOption} value={actorOption}>
            {actorOption}
          </option>
        ))}
      </select>
    </div>
  )
}
