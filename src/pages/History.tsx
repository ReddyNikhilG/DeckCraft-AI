import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Edit, FileText, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Presentation {
  id: string;
  title: string;
  topic: string;
  slide_count: number;
  created_at: string;
  updated_at: string;
}

export default function History() {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPresentations(data || []);
    } catch (error: any) {
      toast.error("Failed to load presentations");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this presentation?")) return;

    try {
      const { error } = await supabase
        .from("presentations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Presentation deleted");
      loadPresentations();
    } catch (error: any) {
      toast.error("Failed to delete presentation");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Presentations</h1>
          <p className="text-muted-foreground">
            {presentations.length} presentation{presentations.length !== 1 ? "s" : ""} created
          </p>
        </div>

        {presentations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No presentations yet. Create your first one!
              </p>
              <Button onClick={() => navigate("/create")}>
                Create Presentation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {presentations.map((presentation) => (
              <Card key={presentation.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{presentation.title || presentation.topic}</CardTitle>
                      <CardDescription className="mt-2">
                        {presentation.slide_count} slides • Created{" "}
                        {formatDistanceToNow(new Date(presentation.created_at), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/editor/${presentation.id}`)}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(presentation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}