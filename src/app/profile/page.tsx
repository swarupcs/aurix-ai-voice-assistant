import { auth } from "@/lib/auth";
import { getUserPreferences } from "@/server/actions/preferences";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Shield, Settings2, Globe, MessageSquare, Mic, GraduationCap, Briefcase, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const preferences = await getUserPreferences();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-4 md:p-8 relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Immersive Animated Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] mix-blend-screen opacity-60 animate-pulse duration-10000" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen opacity-60 animate-pulse duration-10000" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <div className="max-w-5xl mx-auto space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-background/40 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-primary/10 rounded-2xl">
                <User className="w-6 h-6 text-primary" />
             </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Profile Details</h1>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">Manage your account and preferences</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-md border-white/10 shadow-sm rounded-xl h-11 hover:bg-background/80 hover:scale-105 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-12">
          {/* User Info Card */}
          <Card className="md:col-span-4 border-white/10 bg-background/60 backdrop-blur-xl shadow-xl h-fit overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-primary/20 via-blue-500/20 to-purple-500/20 relative">
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>
            <CardHeader className="text-center pb-2 relative mt-[-64px]">
              <div className="flex justify-center mb-4 relative group">
                <Avatar className="h-32 w-32 ring-4 ring-background shadow-2xl">
                  <AvatarImage src={user.image || ""} alt={user.name || "User avatar"} />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl font-bold">{user.name || "Unknown User"}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 mt-1">
                 <span className={`w-2 h-2 rounded-full ${user.role === 'ADMIN' ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`} />
                 {user.role === "ADMIN" ? "Administrator" : "Standard User"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors border border-transparent hover:border-white/5">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 shadow-inner">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Name</p>
                    <p className="font-semibold truncate">{user.name || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors border border-transparent hover:border-white/5">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 shadow-inner">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</p>
                    <p className="font-semibold truncate" title={user.email || ""}>{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors border border-transparent hover:border-white/5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 shadow-inner">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role Security</p>
                    <p className="font-semibold">{user.role || "USER"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card className="md:col-span-8 border-white/10 bg-background/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Settings2 className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Active Session Preferences</CardTitle>
                    <CardDescription className="mt-1 text-sm">Your currently configured voice and language environment.</CardDescription>
                  </div>
                </div>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-primary hover:text-primary/80 hover:bg-primary/10 font-semibold rounded-xl">Edit Settings</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {!preferences ? (
                <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                     <Settings2 className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-lg font-bold text-foreground">No preferences configured.</p>
                  <p className="text-sm mt-2 max-w-sm mx-auto">Start your first voice session in the dashboard to automatically save your preferred settings.</p>
                  <Link href="/dashboard">
                     <Button className="mt-6 rounded-xl shadow-lg shadow-primary/20">Launch Session</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-5 rounded-3xl border border-white/5 bg-gradient-to-br from-card/50 to-muted/30 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                       <Briefcase className="w-16 h-16 text-primary" />
                    </div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest mb-3">
                         <div className="p-1.5 bg-primary/10 rounded-md"><Briefcase className="w-3.5 h-3.5" /></div> Conversation Type
                       </div>
                       <p className="font-bold text-2xl">{preferences.conversationType || "Not set"}</p>
                    </div>
                  </div>
                  
                  <div className="p-5 rounded-3xl border border-white/5 bg-gradient-to-br from-card/50 to-muted/30 shadow-sm relative overflow-hidden group hover:border-blue-500/20 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                       <Globe className="w-16 h-16 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">
                         <div className="p-1.5 bg-blue-500/10 rounded-md"><Globe className="w-3.5 h-3.5" /></div> Language
                       </div>
                       <p className="font-bold text-2xl">
                         {preferences.languageName || "Not set"} 
                       </p>
                       <p className="text-sm font-medium text-muted-foreground mt-1">{preferences.languageRegion || "Global"}</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl border border-white/5 bg-gradient-to-br from-card/50 to-muted/30 shadow-sm relative overflow-hidden group hover:border-rose-500/20 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                       <Mic className="w-16 h-16 text-rose-500" />
                    </div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-3">
                         <div className="p-1.5 bg-rose-500/10 rounded-md"><Mic className="w-3.5 h-3.5" /></div> Voice Identity
                       </div>
                       <p className="font-bold text-2xl">{preferences.voice || "Not set"}</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl border border-white/5 bg-gradient-to-br from-card/50 to-muted/30 shadow-sm relative overflow-hidden group hover:border-purple-500/20 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                       <MessageSquare className="w-16 h-16 text-purple-500" />
                    </div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-3">
                         <div className="p-1.5 bg-purple-500/10 rounded-md"><MessageSquare className="w-3.5 h-3.5" /></div> Topic Focus
                       </div>
                       <p className="font-bold text-2xl">{preferences.topic || "Not set"}</p>
                    </div>
                  </div>

                  {preferences.proficiencyLevel && (
                    <div className="p-5 rounded-3xl border border-white/5 bg-gradient-to-br from-card/50 to-muted/30 shadow-sm relative overflow-hidden group hover:border-emerald-500/20 transition-colors sm:col-span-2">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                         <GraduationCap className="w-24 h-24 text-emerald-500" />
                      </div>
                      <div className="relative z-10">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">
                           <div className="p-1.5 bg-emerald-500/10 rounded-md"><GraduationCap className="w-3.5 h-3.5" /></div> Proficiency Level
                         </div>
                         <p className="font-bold text-2xl">{preferences.proficiencyLevel}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
