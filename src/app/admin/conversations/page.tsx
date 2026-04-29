import { getAllConversations } from "@/server/actions/admin";
import { ConversationTable } from "./conversation-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export const metadata = {
  title: "Admin Panel - Conversations",
};

export default async function AdminConversationsPage() {
  const conversations = await getAllConversations();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Conversation History</h2>
        <p className="text-muted-foreground mt-2">
          Review all voice sessions, transcripts, and interactions between users and the AI.
        </p>
      </div>

      <Card className="border-white/10 bg-background/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 pb-6">
          <div className="flex items-center gap-2">
             <div className="p-2.5 bg-blue-500/10 rounded-xl">
               <MessageSquare className="w-5 h-5 text-blue-500" />
             </div>
             <div>
                <CardTitle className="text-xl">Global Transcript Directory</CardTitle>
                <CardDescription className="mt-1">
                  {conversations.length} total sessions recorded across the platform.
                </CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ConversationTable conversations={conversations} />
        </CardContent>
      </Card>
    </div>
  );
}
