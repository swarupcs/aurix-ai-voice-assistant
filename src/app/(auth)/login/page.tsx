import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth";
import { Sparkles, Languages, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background selection:bg-primary/20">
      {/* Left Side: Visual/Branding */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-zinc-900 p-12 text-white">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        </div>

        {/* Logo/Brand */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary-foreground shadow-lg shadow-primary/25 overflow-hidden p-1">
            <Image src="/logo.png" alt="Aurix AI Logo" width={40} height={40} className="object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight">Aurix AI</span>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold leading-tight tracking-tighter sm:text-5xl">
              Master any language, <br />
              <span className="text-primary">one conversation</span> at a time.
            </h2>
            <p className="max-w-[450px] text-lg text-zinc-400">
              Aurix uses state-of-the-art AI to provide real-time voice feedback, 
              helping you speak with confidence and clarity.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10 transition-colors hover:bg-white/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Real-time Feedback</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10 transition-colors hover:bg-white/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                <Languages className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">50+ Languages</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-sm text-zinc-500 font-medium">
          © 2026 Aurix AI Inc. Built for the modern learner.
        </div>
      </div>

      {/* Right Side: Form Area */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-muted/50">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary-foreground overflow-hidden p-0.5">
            <Image src="/logo.png" alt="Aurix AI Logo" width={32} height={32} className="object-contain" />
          </div>
          <span className="text-lg font-bold tracking-tight">Aurix AI</span>
        </div>

        {/* Glow Effects for Mobile/Tablet */}
        <div className="absolute top-[-20%] right-[-20%] h-[60%] w-[60%] rounded-full bg-primary/10 blur-[100px] lg:hidden" />

        <div className="w-full max-w-[400px] space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-muted-foreground">Choose your preferred sign-in method to continue your journey.</p>
          </div>

          <div className="grid gap-4 pt-4">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <Button 
                variant="outline" 
                className="w-full h-14 rounded-2xl bg-background/60 backdrop-blur-md border-border/60 hover:bg-background hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <svg className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-semibold text-base">Continue with Google</span>
              </Button>
            </form>

            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <Button 
                variant="outline" 
                className="w-full h-14 rounded-2xl bg-background/60 backdrop-blur-md border-border/60 hover:bg-background hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <svg className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300 fill-foreground" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold text-base">Continue with GitHub</span>
              </Button>
            </form>
          </div>

          <div className="pt-6 border-t border-border/50 text-center space-y-4">
             <div className="flex items-center gap-4 justify-center py-2 px-4 rounded-full bg-zinc-100 dark:bg-zinc-800/50 w-fit mx-auto border border-border/40">
                <Zap className="h-4 w-4 text-primary fill-primary/20" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ready for the next level?</span>
             </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              By continuing, you agree to our <Link href="#" className="underline underline-offset-4 hover:text-primary transition-colors">Terms of Service</Link> and <Link href="#" className="underline underline-offset-4 hover:text-primary transition-colors">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
