import { auth } from "@/lib/auth";
import { getUserPreferences } from "@/server/actions/preferences";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Shield, Settings2, Globe, MessageSquare, Mic, GraduationCap, Briefcase } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile Details</h1>
            <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-md">
              <ArrowLeft className="w-4 h-4" /> Back to App
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* User Info Card */}
          <Card className="md:col-span-1 border-white/10 bg-background/50 backdrop-blur-xl shadow-xl h-fit">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24 ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-lg">
                  <AvatarImage src={user.image || ""} alt={user.name || "User avatar"} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">{user.name || "Unknown User"}</CardTitle>
              <CardDescription>{user.role === "ADMIN" ? "Administrator" : "Standard User"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator className="bg-border/40" />
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">Account Name</p>
                    <p className="text-muted-foreground truncate">{user.name || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">Email Address</p>
                    <p className="text-muted-foreground truncate" title={user.email || ""}>{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">Role</p>
                    <p className="text-muted-foreground">{user.role || "USER"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card className="md:col-span-2 border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Session Preferences</CardTitle>
                  <CardDescription className="mt-1">Your current voice and language settings.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!preferences ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                  <Settings2 className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-foreground">No preferences set yet.</p>
                  <p className="text-sm mt-1">Start a session in the dashboard to save your preferences.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-2xl border border-white/5 bg-card/50 shadow-sm space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      <Briefcase className="w-3.5 h-3.5" /> Conversation Type
                    </div>
                    <p className="font-semibold text-lg">{preferences.conversationType || "Not set"}</p>
                  </div>
                  
                  <div className="p-4 rounded-2xl border border-white/5 bg-card/50 shadow-sm space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      <Globe className="w-3.5 h-3.5" /> Language
                    </div>
                    <p className="font-semibold text-lg">
                      {preferences.languageName || "Not set"} 
                      {preferences.languageRegion && <span className="text-sm font-normal text-muted-foreground ml-2 opacity-70">({preferences.languageRegion})</span>}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-white/5 bg-card/50 shadow-sm space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      <Mic className="w-3.5 h-3.5" /> Voice
                    </div>
                    <p className="font-semibold text-lg">{preferences.voice || "Not set"}</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-white/5 bg-card/50 shadow-sm space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      <MessageSquare className="w-3.5 h-3.5" /> Topic
                    </div>
                    <p className="font-semibold text-lg">{preferences.topic || "Not set"}</p>
                  </div>

                  {preferences.proficiencyLevel && (
                    <div className="p-4 rounded-2xl border border-white/5 bg-card/50 shadow-sm space-y-1 sm:col-span-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        <GraduationCap className="w-3.5 h-3.5" /> Proficiency Level
                      </div>
                      <p className="font-semibold text-lg">{preferences.proficiencyLevel}</p>
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
