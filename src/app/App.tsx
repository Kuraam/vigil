import { MotionConfig } from 'motion/react'
import { RouterProvider } from 'react-router'
import { router } from './router'

export function App() {
  return (
    // reducedMotion="user": transforms are dropped when the OS asks for reduced motion.
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  )
}
