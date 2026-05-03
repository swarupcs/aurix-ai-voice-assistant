import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mic, Globe, Sparkles, Zap, Shield, Rocket } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50 selection:bg-primary/20 overflow-hidden">
      {/* Abstract Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] h-[60%] w-[60%] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-blue-500/5 blur-[140px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      </div>

      <header className="px-6 h-20 flex items-center border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2 group" href="/">
          <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <Mic className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tighter">Aurix AI</span>
        </Link>
        <nav className="ml-auto flex gap-8 items-center">
          <Link className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white transition-colors" href="#features">
            Features
          </Link>
          {!isLoggedIn && (
            <Link className="text-sm font-medium text-zinc-400 hover:text-white transition-colors" href="/login">
              Sign In
            </Link>
          )}
          <Button asChild size="lg" className="rounded-full font-semibold px-6 shadow-xl shadow-primary/10">
            <Link href={isLoggedIn ? "/dashboard" : "/login"}>
              {isLoggedIn ? "Dashboard" : "Get Started"}
            </Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 flex justify-center items-center">
          <div className="container px-6 relative mx-auto text-center flex flex-col items-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-400 backdrop-blur-md mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
              <Sparkles className="mr-2 h-4 w-4 fill-primary/20" />
              <span>Now with Gemini Live Integration</span>
            </div>
            
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl md:text-8xl lg:text-[100px] leading-[0.9] max-w-5xl mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              Master speech <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/60">without limits.</span>
            </h1>
            
            <p className="mx-auto max-w-[750px] text-zinc-400 text-lg md:text-xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
              Aurix provides high-fidelity, real-time voice interaction to help you conquer language barriers and speak with absolute confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Button asChild size="lg" className="rounded-full h-16 px-10 text-lg font-bold shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                <Link href={isLoggedIn ? "/dashboard" : "/login"}>
                  {isLoggedIn ? "Go to Dashboard" : "Start Talking Now"}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-16 px-10 text-lg font-bold bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
                <Link href="#features">Explore Technology</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-32 flex justify-center border-t border-white/5 bg-zinc-950/30">
          <div className="container px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-24">
              <div className="h-1 w-20 bg-primary rounded-full mb-4" />
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">The Future of <br className="sm:hidden" /> Voice AI</h2>
              <p className="max-w-[800px] text-zinc-400 text-lg md:text-xl font-medium">
                Built on the latest Web Audio infrastructure and Gemini 2.0 to deliver zero-latency, human-like conversations.
              </p>
            </div>

            <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/5">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary group-hover:scale-110 transition-transform duration-500">
                  <Zap className="h-7 w-7 fill-primary/20" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">Ultra-Low Latency</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Powered by custom Web Audio worklets and Google&apos;s fastest models for near-instant responses.
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:shadow-2xl hover:shadow-blue-500/5">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform duration-500">
                  <Globe className="h-7 w-7 fill-blue-500/20" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">50+ Local Dialects</h3>
                <p className="text-zinc-400 leading-relaxed">
                  From slang to formal prose, practice in dozens of languages with regional accuracy and native nuance.
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:shadow-2xl hover:shadow-emerald-500/5">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform duration-500">
                  <Shield className="h-7 w-7 fill-emerald-500/20" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">Private & Secure</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Your voice data is processed using ephemeral tokens. Conversations are encrypted and never sold to third parties.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 flex justify-center">
           <div className="container px-6 mx-auto">
              <div className="relative rounded-[48px] bg-primary p-12 md:p-24 overflow-hidden flex flex-col items-center text-center text-primary-foreground group">
                 {/* Inner Glow */}
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                 
                 <div className="relative z-10 space-y-8 max-w-3xl">
                    <Rocket className="h-16 w-16 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none">Ready to start <br /> speaking?</h2>
                    <p className="text-primary-foreground/80 text-xl md:text-2xl font-medium">
                       Join thousands of learners mastering languages through the power of AI voice interaction.
                    </p>
                    <Button asChild size="lg" variant="secondary" className="rounded-full h-20 px-12 text-2xl font-black shadow-2xl hover:scale-110 transition-transform">
                       <Link href={isLoggedIn ? "/dashboard" : "/login"}>
                         {isLoggedIn ? "Go to Dashboard" : "Get Started Now"}
                       </Link>
                    </Button>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <footer className="relative z-10 py-12 px-6 md:px-12 border-t border-white/5 bg-zinc-950">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
             <div className="flex items-center gap-2">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <Mic className="h-5 w-5 text-primary" />
                </div>
                <span className="font-bold text-lg tracking-tight">Aurix AI</span>
             </div>
             <p className="text-zinc-500 text-sm font-medium">© 2026 Aurix AI. Speech perfected.</p>
          </div>
          
          <nav className="flex gap-10">
            <Link className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors" href="#">
              Terms
            </Link>
            <Link className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors" href="#">
              Privacy
            </Link>
            <Link className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors" href="#">
              Twitter
            </Link>
            <Link className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors" href="#">
              GitHub
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
