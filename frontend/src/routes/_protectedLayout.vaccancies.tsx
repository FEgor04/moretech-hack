import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protectedLayout/vaccancies')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protectedLayout/vaccancies"!</div>
}
