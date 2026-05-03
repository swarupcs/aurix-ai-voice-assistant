"use client";

import { useState, useTransition } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Clock, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateFeedbackStatus } from "@/server/actions/feedback";
import { toast } from "sonner";
import { FeedbackType } from "@prisma/client";

export function FeedbackTable({ feedbackList }: { feedbackList: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredFeedback = feedbackList.filter((fb) => 
    fb.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fb.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fb.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = (id: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED") => {
    startTransition(async () => {
      try {
        const result = await updateFeedbackStatus(id, status);
        if (result.success) {
          toast.success("Status updated successfully.");
        } else {
          toast.error("Failed to update status.");
        }
      } catch (e) {
        toast.error("An error occurred while updating status.");
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "RESOLVED": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case "IN_PROGRESS": return <AlertCircle className="w-3.5 h-3.5 text-blue-500" />;
      default: return <Circle className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by message, user name or email..."
            className="pl-10 h-10 bg-background/50 border-white/10 rounded-xl focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
          Showing <span className="text-foreground">{filteredFeedback.length}</span> entries
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/50 shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-white/10">
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">User</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/2">Message</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedback.map((fb) => (
                <TableRow key={fb.id} className="hover:bg-muted/50 transition-colors border-white/10">
                  <TableCell>
                    {fb.user ? (
                      <div className="flex items-center gap-3 py-1">
                        <Avatar className="h-8 w-8 border border-background shadow-sm">
                          <AvatarImage src={fb.user.image || ""} alt={fb.user.name || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {fb.user.name?.charAt(0) || fb.user.email?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{fb.user.name || "Unknown"}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{fb.user.email}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">Anonymous</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={fb.type === "ISSUE" ? "destructive" : "secondary"} className="text-[10px] uppercase font-bold tracking-wider">
                      {fb.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm line-clamp-3 whitespace-pre-wrap">{fb.message}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">
                         {formatDistanceToNow(new Date(fb.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={fb.status}
                      onValueChange={(val) => handleStatusChange(fb.id, val as any)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-8 text-xs border-white/10 bg-background/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(fb.status)}
                          <span>{fb.status.replace("_", " ")}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
                        <SelectItem value="OPEN" className="text-xs cursor-pointer my-1 rounded-lg">OPEN</SelectItem>
                        <SelectItem value="IN_PROGRESS" className="text-xs cursor-pointer my-1 rounded-lg">IN PROGRESS</SelectItem>
                        <SelectItem value="RESOLVED" className="text-xs cursor-pointer my-1 rounded-lg">RESOLVED</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFeedback.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 rounded-full bg-muted/50">
                         <Search className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium">No feedback entries found matching your search.</p>
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
