"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HelpCircle, Mic } from "lucide-react"

export function VoiceCommandHelp() {
  const [open, setOpen] = useState(false)

  const commands = [
    { command: "Go to documents", description: "Navigate to the documents page" },
    { command: "Open upload page", description: "Navigate to the upload page" },
    { command: "Go to dashboard", description: "Navigate to your dashboard" },
    { command: "Open settings", description: "Navigate to settings page" },
    { command: "Go to about", description: "Navigate to about page" },
    { command: "Open contact page", description: "Navigate to contact page" },
    { command: "Go to FAQ", description: "Navigate to FAQ page" },
    { command: "Upload document", description: "Navigate to upload page" },
    { command: "Translate document", description: "Navigate to documents page" },
    { command: "Logout", description: "Sign out of your account" },
    { command: "Help", description: "Get information about available commands" },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Voice Commands</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Commands
          </DialogTitle>
          <DialogDescription>Use these voice commands to navigate and control the application</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto pr-2">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the microphone button in the bottom right corner to activate voice commands, then speak one of the
              following:
            </p>
            <div className="grid gap-2">
              {commands.map((cmd, i) => (
                <div key={i} className="flex justify-between py-2 border-b last:border-0">
                  <span className="font-medium">"{cmd.command}"</span>
                  <span className="text-sm text-muted-foreground">{cmd.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
