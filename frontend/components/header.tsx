"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SettingsModal } from "@/components/settings-modal"

const navigation = [
  { name: "Milestones", href: "/" },
  { name: "Despliegue Personalizado", href: "/custom" },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/wetcom-logo.png"
              alt="Wetcom"
              width={140}
              height={40}
              className="h-8 w-auto"
              priority
            />
            <div className="hidden sm:block h-6 w-px bg-border" />
            <span className="hidden sm:block text-sm font-medium text-muted-foreground">
              Labs
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="h-4 w-px bg-border" />
          <SettingsModal />
        </div>
      </div>
    </header>
  )
}

