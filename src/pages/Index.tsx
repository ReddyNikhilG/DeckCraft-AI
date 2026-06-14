import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, FileText, History } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-60" />
        
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Powered by AI</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
              Create Stunning Presentations in Seconds
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your ideas into professional presentations with the power of AI. 
              No design skills required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to create amazing presentations
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-lg transition-all">
              <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-lg w-fit mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Generation</h3>
              <p className="text-muted-foreground">
                Just provide a topic and slide count. Our AI generates professional content and finds perfect images.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-lg transition-all">
              <div className="p-3 bg-gradient-to-br from-accent to-secondary rounded-lg w-fit mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Editing</h3>
              <p className="text-muted-foreground">
                Edit text manually or let AI help you refine your content. Full control at your fingertips.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-lg transition-all">
              <div className="p-3 bg-gradient-to-br from-secondary to-primary rounded-lg w-fit mb-4">
                <History className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">History & Downloads</h3>
              <p className="text-muted-foreground">
                Access all your presentations anytime. Download as PowerPoint with one click.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-primary via-secondary to-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to create your first presentation?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of users creating professional presentations with AI
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Start Creating Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
