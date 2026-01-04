"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/studio", icon: LayoutDashboard },
  { name: "Upload", href: "/studio/upload", icon: Upload },
  { name: "Settings", href: "/studio/settings", icon: Settings },
];

export function StudioLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-40 h-screen w-[280px] border-r border-border bg-surface lg:relative lg:translate-x-0"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex h-16 items-center justify-between border-b border-border px-6">
                <h2 className="font-serif text-xl text-primary">Studio</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 px-4 py-6">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.name} href={item.href}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ type: "spring", stiffness: 400 }}
                        className={cn(
                          "flex items-center gap-3 rounded-none px-4 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-background text-primary"
                            : "text-primary/70 hover:bg-background/50 hover:text-primary"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        {!sidebarOpen && (
          <header className="flex h-16 items-center border-b border-border bg-surface px-4 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </header>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

