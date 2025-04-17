"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu, User, LogOut, Settings, X } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"

// Add named export alongside default export
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const { theme } = useTheme()

  // Check if user is logged in from localStorage on component mount and when pathname changes
  useEffect(() => {
    const checkLoginStatus = () => {
      if (typeof window !== "undefined") {
        // Only run on client side
        const userLoggedIn =
          localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true"
        setIsLoggedIn(userLoggedIn)

        // Get user info
        const userFromLocal = localStorage.getItem("user")
        const userFromSession = sessionStorage.getItem("user")
        const userInfo = userFromLocal || userFromSession

        if (userInfo) {
          setUser(JSON.parse(userInfo))
        } else {
          setUser(null)
        }
      }
    }

    checkLoginStatus()

    // Add event listener for storage changes
    window.addEventListener("storage", checkLoginStatus)

    // Custom event for login/logout
    window.addEventListener("auth-change", checkLoginStatus)

    return () => {
      window.removeEventListener("storage", checkLoginStatus)
      window.removeEventListener("auth-change", checkLoginStatus)
    }
  }, [pathname])

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const isActive = (path: string) => {
    return pathname === path ? "text-primary font-medium" : "text-foreground/80 hover:text-primary"
  }

  const handleLogout = () => {
    localStorage.setItem("isLoggedIn", "false")
    localStorage.removeItem("user")
    sessionStorage.setItem("isLoggedIn", "false")
    sessionStorage.removeItem("user")

    setIsLoggedIn(false)
    setUser(null)

    // Dispatch custom event
    window.dispatchEvent(new Event("auth-change"))

    window.location.href = "/"
  }

  return (
    <header className="border-b bg-background z-50 sticky top-0">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold">
              DocuDigitize
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/upload" className={`text-sm ${isActive("/upload")}`}>
              Upload
            </Link>
            <Link href="/documents" className={`text-sm ${isActive("/documents")}`}>
              Documents
            </Link>
            {isLoggedIn && (
              <>
                <Link href="/dashboard" className={`text-sm ${isActive("/dashboard")}`}>
                  Dashboard
                </Link>
                <Link href="/activity" className={`text-sm ${isActive("/activity")}`}>
                  Activity
                </Link>
              </>
            )}
            <Link href="/how-it-works" className={`text-sm ${isActive("/how-it-works")}`}>
              How It Works
            </Link>
            <Link href="/about" className={`text-sm ${isActive("/about")}`}>
              About
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <ModeToggle />
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user?.name || "User"}</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-500">
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="ml-2">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t bg-background mobile-menu overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link
                href="/upload"
                className={`block text-base py-2 ${isActive("/upload")}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Upload
              </Link>
              <Link
                href="/documents"
                className={`block text-base py-2 ${isActive("/documents")}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Documents
              </Link>
              {isLoggedIn && (
                <>
                  <Link
                    href="/dashboard"
                    className={`block text-base py-2 ${isActive("/dashboard")}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/activity"
                    className={`block text-base py-2 ${isActive("/activity")}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Activity
                  </Link>
                </>
              )}
              <Link
                href="/how-it-works"
                className={`block text-base py-2 ${isActive("/how-it-works")}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/about"
                className={`block text-base py-2 ${isActive("/about")}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <div className="pt-4 border-t flex flex-col space-y-2">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center mb-2">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm font-medium">{user?.name || "User"}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild className="justify-start">
                      <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-red-500"
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="justify-start" asChild>
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button variant="default" size="sm" className="justify-start" asChild>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        Register
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

// Keep the default export for backward compatibility
export default Header
