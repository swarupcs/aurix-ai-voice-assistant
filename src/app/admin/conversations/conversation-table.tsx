"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Eye, MessageSquare, Clock } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function ConversationTable({ conversations }: { conversations: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) => 
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by topic, user name or email..."
            className="pl-10 h-10 bg-background/50 border-white/10 rounded-xl focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
          Showing <span className="text-foreground">{filteredConversations.length}</span> sessions
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/50 shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-white/10">
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[250px]">Topic / Title</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">User</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Language</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Messages</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConversations.map((conv) => (
                <TableRow key={conv.id} className="hover:bg-muted/50 transition-colors border-white/10">
                  <TableCell>
                    <div className="font-semibold text-sm truncate max-w-[250px]">
                      {conv.title || "Untitled Session"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 py-1">
                      <Avatar className="h-8 w-8 border border-background shadow-sm">
                        <AvatarImage src={conv.user?.image || ""} alt={conv.user?.name || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{conv.user?.name?.charAt(0) || conv.user?.email?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{conv.user?.name || "Unknown"}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{conv.user?.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-background/50 border-white/10">
                      {conv.language || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="font-mono text-xs font-medium">{conv._count?.messages || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">
                         {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/conversations/${conv.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Conversation</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filteredConversations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 rounded-full bg-muted/50">
                         <Search className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium">No conversations found matching your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
