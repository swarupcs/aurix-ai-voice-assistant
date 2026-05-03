import { getFeedbackList } from "@/server/actions/feedback";
import { FeedbackTable } from "./feedback-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag } from "lucide-react";

export const metadata = {
  title: "Admin Panel - Feedback",
};

export default async function AdminFeedbackPage() {
  const feedbackList = await getFeedbackList();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Feedback & Issues</h2>
        <p className="text-muted-foreground mt-2">
          Review user feedback, suggestions, and reported issues.
        </p>
      </div>

      <Card className="border-white/10 bg-background/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 pb-6">
          <div className="flex items-center gap-2">
             <div className="p-2.5 bg-blue-500/10 rounded-xl">
               <Flag className="w-5 h-5 text-blue-500" />
             </div>
             <div>
                <CardTitle className="text-xl">User Submissions</CardTitle>
                <CardDescription className="mt-1">
                  {feedbackList.length} total entries recorded.
                </CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <FeedbackTable feedbackList={feedbackList} />
        </CardContent>
      </Card>
    </div>
  );
}
