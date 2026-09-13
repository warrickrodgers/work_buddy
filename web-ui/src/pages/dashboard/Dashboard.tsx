import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

function AnimatedOutlet() {
  const location = useLocation();
  const reduced = useReducedMotion();
  const [scrollLocked, setScrollLocked] = useState(false);

  return (
    <div
      className="relative flex flex-col flex-1 min-h-0"
      style={{
        overflowY: scrollLocked ? 'hidden' : 'auto',
        scrollbarGutter: 'stable',
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: reduced ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col flex-1 min-h-0"
          onAnimationStart={() => setScrollLocked(true)}
          onAnimationComplete={() => setScrollLocked(false)}
        >
          <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
            <Outlet />
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col flex-1 min-h-0">
          <AnimatedOutlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}