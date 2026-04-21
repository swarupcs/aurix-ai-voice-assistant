import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mic, Globe, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="bg-primary/10 p-1 rounded-md">
            <Mic className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">Aurix AI</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
            Sign In
          </Link>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/login">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-24 md:py-32 lg:py-48 xl:py-56 relative overflow-hidden flex justify-center items-center">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
          <div className="absolute h-full w-full bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          <div className="container px-4 md:px-6 relative z-10 mx-auto text-center flex flex-col items-center">
            <div className="inline-flex items-center rounded-full border border-border/40 bg-muted/50 px-3 py-1 text-sm font-medium backdrop-blur-sm mb-8">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              <span>Now with Gemini Live API integration</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl/none max-w-4xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mb-6">
              Speak Naturally with Your Next-Gen AI Tutor
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mb-10 leading-relaxed">
              Experience seamless, low-latency voice conversations. Learn new languages, practice interviews, or just chat with an AI that understands context and nuance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="rounded-full h-12 px-8 text-base">
                <Link href="/login">Start Talking Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-8 text-base bg-background/50 backdrop-blur-sm border-border/50 hover:bg-muted/50">
                <Link href="#features">Explore Features</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-24 md:py-32 bg-muted/30 border-y border-border/50 flex justify-center">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Powered by Advanced Audio Processing</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Aurix uses the latest in Web Audio API and Google&apos;s Gemini models to deliver a truly conversational experience.
                </p>
                </div>
                <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-3">
                <div className="flex flex-col justify-center space-y-4 p-6 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Visual Feedback</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Interactive audio visualizers respond to both your voice and the AI&apos;s, creating an engaging, immersive environment.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4 p-6 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Polyglot Tutor</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Practice over 20 languages. Aurix adapts to your proficiency level, correcting grammar and pronunciation on the fly.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4 p-6 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Visual Feedback</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Interactive audio visualizers respond to both your voice and the AI&apos;s, creating an engaging, immersive environment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border/40 bg-background">
        <p className="text-xs text-muted-foreground">© 2026 Aurix AI. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
