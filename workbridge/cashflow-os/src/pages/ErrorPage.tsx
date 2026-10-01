import { Link, isRouteErrorResponse, useRouteError } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/states'

/** Route-level error boundary so a runtime error shows a recoverable screen, not a blank page. */
export function ErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'An unexpected error occurred.'

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <EmptyState
          icon={AlertTriangle}
          title="Something went wrong"
          description={message}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload page
              </Button>
              <Button asChild>
                <Link to="/">Back to homepage</Link>
              </Button>
            </div>
          }
        />
      </Card>
    </div>
  )
}
