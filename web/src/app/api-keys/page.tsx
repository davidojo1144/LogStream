"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Copy, Key, Loader2, Plus, Trash2, ArrowLeft } from "lucide-react"
import useSWR from "swr"
import { format } from "date-fns"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  active: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ApiKeysPage() {
  const { data: session } = useSession()
  const { data: keys, mutate, isLoading } = useSWR<ApiKey[]>("/api/keys", fetcher)
  const [newKeyName, setNewKeyName] = useState("")
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const createKey = async () => {
    if (!newKeyName) return
    setCreating(true)
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      })
      if (!res.ok) throw new Error("Failed to create key")
      await mutate()
      setOpen(false)
      setNewKeyName("")
      toast({
        title: "Success",
        description: "API Key created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const deleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return
    try {
      await fetch(`/api/keys?id=${id}`, { method: "DELETE" })
      await mutate()
      toast({
        title: "Deleted",
        description: "API Key deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "API Key copied to clipboard",
    })
  }

  return (
    <div className="container max-w-4xl mx-auto py-10 space-y-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
            <p className="text-muted-foreground mt-2">
              Manage authentication keys for sending logs to the Collector.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" /> Create New Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Give your key a name to identify the source (e.g., "Production Backend").
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Key Name
                  </label>
                  <Input
                    id="name"
                    placeholder="e.g. My App Prod"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <Button onClick={createKey} disabled={creating} className="w-full">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Key"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Keys List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </Card>
        ) : keys?.length === 0 ? (
          <Card className="flex flex-col justify-center items-center h-64 text-center p-6 border-dashed">
            <div className="bg-muted/50 p-4 rounded-full mb-4">
              <Key className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No API keys found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Create your first API key to start sending logs to the platform securely.
            </p>
          </Card>
        ) : (
          keys?.map((key) => (
            <Card key={key.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 bg-muted/30">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold flex items-center gap-3">
                    {key.name}
                    <Badge variant={key.active ? "default" : "secondary"} className={key.active ? "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-500/20" : ""}>
                      {key.active ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Created on {format(new Date(key.createdAt), "MMMM dd, yyyy")}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                  onClick={() => deleteKey(key.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/50 rounded-md px-3 py-2.5 font-mono text-sm truncate border shadow-sm">
                    {key.key}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(key.key)}
                    className="shrink-0 h-10 w-10"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
