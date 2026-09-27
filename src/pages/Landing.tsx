import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Target, Download, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { icon: Sparkles, title: "AI-Powered Polish", desc: "Let AI refine your resume language for maximum impact." },
  { icon: Target, title: "ATS Score Checker", desc: "Get instant feedback on how well your resume passes ATS filters." },
  { icon: Download, title: "Export as PDF", desc: "Download beautifully formatted, print-ready resumes." },
];

const benefits = [
  "Multiple resume templates",
  "Real-time live preview",
  "Drag & reorder sections",
  "Keyword optimization",
  "Section-wise AI feedback",
  "One-click PDF export",
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    navigate(user ? "/dashboard" : "/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Resum<span className="text-primary">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
                <Button onClick={() => navigate("/auth")}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5 text-sm text-primary mb-6">
          <Sparkles className="h-3.5 w-3.5" /> AI-Powered Resume Builder
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight max-w-3xl mx-auto">
          AI Resume Optimizer <br className="hidden md:block" />
          <span className="text-primary">&amp; ATS Checker</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
          Build professional, ATS-optimized resumes in minutes. Get AI-powered feedback and land more interviews.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button size="lg" onClick={handleCTA} className="gap-2 text-base px-8">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={handleCTA} className="gap-2 text-base px-8">
            Upload Resume
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-8">Everything you need</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ResumAI. Built for job seekers.
      </footer>
    </div>
  );
}
