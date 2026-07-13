import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateTaskMutation } from '../services/task.queries'

export function CreateTaskForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const createTaskMutation = useCreateTaskMutation()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    createTaskMutation.mutate(
      {
        title,
        description: description.trim() === '' ? undefined : description,
      },
      {
        onSuccess: () => {
          setTitle('')
          setDescription('')
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create task</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Prepare invoice"
              maxLength={120}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional context"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="justify-self-start"
            disabled={createTaskMutation.isPending}
          >
            {createTaskMutation.isPending ? 'Creating...' : 'Create task'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
