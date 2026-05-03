"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { FeedbackType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitFeedback } from "@/server/actions/feedback";

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<FeedbackType>("FEEDBACK");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitFeedback({ type, message });
      if (result.success) {
        toast.success("Feedback submitted successfully!");
        setOpen(false);
        setMessage("");
        setType("FEEDBACK");
      } else {
        toast.error(result.error || "Failed to submit feedback.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground font-medium text-sm rounded-xl mb-2 flex gap-3 h-11 bg-black/5 dark:bg-white/5 border border-white/10 shadow-inner">
          <MessageSquarePlus className="h-4 w-4" />
          Submit Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-white/10 shadow-2xl bg-background/95 backdrop-blur-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              We'd love to hear your thoughts, ideas, or any issues you've encountered.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-semibold">Type</Label>
              <Select
                value={type}
                onValueChange={(val) => setType(val as FeedbackType)}
              >
                <SelectTrigger className="w-full rounded-xl bg-background/50 border-white/10 h-10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
                  <SelectItem value="FEEDBACK" className="rounded-lg cursor-pointer my-1">
                    General Feedback
                  </SelectItem>
                  <SelectItem value="ISSUE" className="rounded-lg cursor-pointer my-1">
                    Report an Issue
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-semibold">Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us what you think..."
                className="min-h-[120px] resize-none rounded-xl bg-background/50 border-white/10"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl bg-primary/90 hover:bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
