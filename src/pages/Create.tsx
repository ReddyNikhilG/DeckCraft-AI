import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function Create() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [slideCount, setSlideCount] = useState("5");
  const [theme, setTheme] = useState("professional");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Call edge function to generate presentation
      const { data, error } = await supabase.functions.invoke("generate-presentation", {
        body: {
          topic,
          description: description.trim() || undefined,
          slideCount: parseInt(slideCount),
          theme,
        },
      });

      if (error) throw error;

      toast.success("Presentation generated successfully!");
      navigate(`/editor/${data.presentationId}`);
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate presentation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Create New Presentation</CardTitle>
                <CardDescription>
                  Let AI help you create amazing slides
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Presentation Topic</Label>
                <Input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Climate Change, Machine Learning, Marketing Strategy"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Describe what your presentation should be about
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more context about your presentation... e.g., target audience, key points to cover, specific examples to include"
                  disabled={loading}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Provide additional details to help AI generate more relevant content and images
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slideCount">Number of Slides</Label>
                <Select value={slideCount} onValueChange={setSlideCount} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select slide count" />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 7, 10, 15, 20].map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count} slides
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Presentation Theme</Label>
                <Select value={theme} onValueChange={setTheme} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional - Clean and corporate</SelectItem>
                    <SelectItem value="creative">Creative - Vibrant and artistic</SelectItem>
                    <SelectItem value="minimal">Minimal - Simple and elegant</SelectItem>
                    <SelectItem value="bold">Bold - Strong and impactful</SelectItem>
                    <SelectItem value="academic">Academic - Educational and formal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose a theme that matches your presentation style
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating your slides...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Presentation
                  </>
                )}
              </Button>

              {loading && (
                <div className="text-center text-sm text-muted-foreground animate-pulse">
                  This may take a moment. We're creating something amazing for you!
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}