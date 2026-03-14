import { Outlet } from '@tanstack/react-router'

export function ProfileLayout() {
  return (
    <div className="max-w-4xl mx-auto pb-24">
      <Outlet />
    </div>
  )
}
