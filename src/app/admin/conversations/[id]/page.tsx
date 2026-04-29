import { getAdminConversationById } from "@/server/actions/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Clock, User, Calendar, Trash2, Bot } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Admin Panel - Transcript",
};

export default async function AdminConversationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const conversation = await getAdminConversationById(id);

  if (!conversation) {
    notFound();
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Session Transcript</h2>
          <p className="text-muted-foreground mt-2">
            Detailed view of the voice interaction.
          </p>
        </div>
        <Link href="/admin/conversations">
          <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-md rounded-xl h-11 border-border/50">
            <ArrowLeft className="w-4 h-4" /> Back to List
          </Button>
        </Link>
      </div>

      {/* Meta Info Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-background/60 backdrop-blur-xl shadow-xl p-6">
           <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                <AvatarImage src={conversation.user?.image || ""} alt={conversation.user?.name || "User"} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{conversation.user?.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <div>
                 <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Session Owner</p>
                 <p className="text-xl font-bold">{conversation.user?.name || "Unknown User"}</p>
                 <p className="text-sm text-muted-foreground">{conversation.user?.email}</p>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/40">
              <div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Language</p>
                 <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20">{conversation.language || "Unknown"}</Badge>
              </div>
              <div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Messages</p>
                 <p className="font-mono font-medium">{conversation.messages.length} messages</p>
              </div>
           </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-card/50 to-muted/30 shadow-sm p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <MessageSquare className="w-32 h-32 text-primary" />
           </div>
           <div className="relative z-10 h-full flex flex-col justify-between">
             <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-2 flex items-center gap-2">
                   <div className="p-1 bg-primary/10 rounded"><MessageSquare className="w-3 h-3" /></div>
                   Topic Discussed
                </p>
                <h3 className="text-2xl font-bold leading-tight">{conversation.title || "Untitled Session"}</h3>
             </div>
             
             <div className="pt-6 border-t border-border/40 mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Calendar className="w-4 h-4" />
                   {format(new Date(conversation.createdAt), "MMM d, yyyy")}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Clock className="w-4 h-4" />
                   {format(new Date(conversation.createdAt), "h:mm a")}
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Transcript Log */}
      <div className="rounded-3xl border border-white/10 bg-background/60 backdrop-blur-xl shadow-xl overflow-hidden mt-8">
        <div className="bg-muted/30 border-b border-border/40 px-6 py-4 flex items-center justify-between">
           <h3 className="font-bold text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Complete Transcript
           </h3>
           <Badge variant="outline" className="bg-background/50 border-white/10">{conversation.messages.length} turns</Badge>
        </div>
        <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 dark:bg-zinc-950/50">
          {conversation.messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                 <MessageSquare className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-medium">No messages recorded in this session.</p>
            </div>
          ) : (
            conversation.messages.map((message, idx) => (
              <div 
                key={message.id} 
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'model' && (
                   <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-md">
                         <Bot className="w-4 h-4 text-white" />
                      </div>
                   </div>
                )}
                
                <div 
                  className={`relative max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm
                    ${message.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-background border border-border/40 shadow-sm rounded-tl-sm'
                    }
                  `}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Subtle timestamp */}
                  <div className={`text-[10px] mt-2 font-medium opacity-60 ${message.role === 'user' ? 'text-right text-primary-foreground/80' : 'text-left text-muted-foreground'}`}>
                     {format(new Date(message.createdAt), "h:mm:ss a")}
                  </div>
                </div>

                {message.role === 'user' && (
                   <div className="flex-shrink-0 mt-1">
                      <Avatar className="h-8 w-8 shadow-sm">
                        <AvatarImage src={conversation.user?.image || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{conversation.user?.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                   </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
