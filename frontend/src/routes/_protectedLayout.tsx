import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protectedLayout')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protectedLayout"!</div>
}
