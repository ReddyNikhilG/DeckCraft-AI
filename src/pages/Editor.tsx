import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Download, Edit, Wand2, Save, ImageIcon } from "lucide-react";
import pptxgen from "pptxgenjs";

interface Slide {
  id: string;
  title: string;
  content: string;
  image_url: string;
  slide_index: number;
}

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [presentation, setPresentation] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedImageUrl, setEditedImageUrl] = useState("");
  const [isAiEditMode, setIsAiEditMode] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Theme-based styles
  const getThemeStyles = (theme: string) => {
    const themes: Record<string, { bg: string; text: string; accent: string; border: string }> = {
      professional: { bg: "bg-gradient-to-br from-slate-50 to-slate-100", text: "text-slate-900", accent: "text-blue-700", border: "border-slate-300" },
      creative: { bg: "bg-gradient-to-br from-purple-50 to-pink-50", text: "text-purple-900", accent: "text-pink-600", border: "border-purple-300" },
      minimal: { bg: "bg-white", text: "text-gray-900", accent: "text-gray-700", border: "border-gray-200" },
      bold: { bg: "bg-gradient-to-br from-orange-100 to-red-100", text: "text-red-900", accent: "text-orange-700", border: "border-red-300" },
      academic: { bg: "bg-gradient-to-br from-blue-50 to-indigo-50", text: "text-indigo-900", accent: "text-blue-800", border: "border-indigo-300" }
    };
    return themes[theme] || themes.professional;
  };

  useEffect(() => {
    fetchPresentation();
  }, [id]);

  const fetchPresentation = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch presentation
      const { data: presentationData, error: presentationError } = await supabase
        .from("presentations")
        .select("*")
        .eq("id", id)
        .single();

      if (presentationError) throw presentationError;
      setPresentation(presentationData);

      // Fetch slides
      const { data: slidesData, error: slidesError } = await supabase
        .from("slides")
        .select("*")
        .eq("presentation_id", id)
        .order("slide_index");

      if (slidesError) throw slidesError;
      setSlides(slidesData || []);
    } catch (error: any) {
      console.error("Error fetching presentation:", error);
      toast.error("Failed to load presentation");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      setIsEditing(false);
      setIsAiEditMode(false);
    }
  };

  const startEditing = () => {
    const slide = slides[currentSlide];
    setEditedTitle(slide.title);
    setEditedContent(slide.content);
    setEditedImageUrl(slide.image_url);
    setIsEditing(true);
  };

  const saveEdit = async () => {
    try {
      const slide = slides[currentSlide];
      const { error } = await supabase
        .from("slides")
        .update({
          title: editedTitle,
          content: editedContent,
          image_url: editedImageUrl,
        })
        .eq("id", slide.id);

      if (error) throw error;

      // Update local state
      const updatedSlides = [...slides];
      updatedSlides[currentSlide] = {
        ...slide,
        title: editedTitle,
        content: editedContent,
        image_url: editedImageUrl,
      };
      setSlides(updatedSlides);
      setIsEditing(false);
      toast.success("Slide updated successfully");
    } catch (error: any) {
      console.error("Error saving slide:", error);
      toast.error("Failed to save changes");
    }
  };

  const fetchAiSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const slide = slides[currentSlide];
      const { data, error } = await supabase.functions.invoke("ai-edit-suggestions", {
        body: {
          title: slide.title,
          content: slide.content,
          topic: presentation?.topic,
        },
      });

      if (error) throw error;
      setAiSuggestions(data);
      setIsAiEditMode(true);
    } catch (error: any) {
      console.error("Error fetching AI suggestions:", error);
      toast.error("Failed to get AI suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applySuggestion = async (suggestion: any) => {
    setEditedTitle(suggestion.title);
    setEditedContent(suggestion.content);
    if (suggestion.imageQuery) {
      setEditedImageUrl(`https://source.unsplash.com/800x450/?${encodeURIComponent(suggestion.imageQuery)}`);
    }
    setIsAiEditMode(false);
    setIsEditing(true);
  };

  const downloadPPT = async () => {
    try {
      const pptx = new pptxgen();
      
      // Set presentation properties
      pptx.author = "SlideWizard AI";
      pptx.title = presentation?.title || "Presentation";
      pptx.subject = presentation?.topic || "";
      pptx.layout = "LAYOUT_16x9";

      // Professional theme-based color schemes
      const themeColors: Record<string, { 
        bg1: string; 
        bg2: string; 
        bg3: string;
        title: string; 
        text: string; 
        accent: string;
        shadow: string;
      }> = {
        professional: { 
          bg1: "0F172A", 
          bg2: "FFFFFF", 
          bg3: "E0E7FF",
          title: "0F172A", 
          text: "1E293B", 
          accent: "3B82F6",
          shadow: "94A3B8"
        },
        creative: { 
          bg1: "581C87", 
          bg2: "FFFFFF", 
          bg3: "F3E8FF",
          title: "581C87", 
          text: "6B21A8", 
          accent: "A855F7",
          shadow: "C084FC"
        },
        minimal: { 
          bg1: "1F2937", 
          bg2: "FFFFFF", 
          bg3: "F3F4F6",
          title: "111827", 
          text: "374151", 
          accent: "6B7280",
          shadow: "9CA3AF"
        },
        bold: { 
          bg1: "7F1D1D", 
          bg2: "FFFFFF", 
          bg3: "FEE2E2",
          title: "7F1D1D", 
          text: "991B1B", 
          accent: "EF4444",
          shadow: "FCA5A5"
        },
        academic: { 
          bg1: "1E3A8A", 
          bg2: "FFFFFF", 
          bg3: "DBEAFE",
          title: "1E3A8A", 
          text: "1E40AF", 
          accent: "3B82F6",
          shadow: "93C5FD"
        }
      };

      const theme = presentation?.theme || 'professional';
      const colors = themeColors[theme] || themeColors.professional;

      // ========== TITLE SLIDE (with image layout matching other slides) ==========
      const titleSlide = pptx.addSlide();
      
      // Randomly decide if image is on left or right for title slide
      const titleImageOnLeft = Math.random() > 0.5;

      if (titleImageOnLeft) {
        // IMAGE ON LEFT - Title Slide
        // Left section - Image background (35% of slide)
        titleSlide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 3.5,
          h: 5.625,
          fill: { color: colors.bg1 }
        });

        // Add title-specific image on the left
        if (slides.length > 0 && slides[0].image_url) {
          // Use the first slide's generated image for title (it was generated based on topic)
          try {
            titleSlide.addImage({
              data: slides[0].image_url,
              x: 0.3,
              y: 0.7,
              w: 2.9,
              h: 4.2,
              sizing: { type: 'cover', w: 2.9, h: 4.2 }
            });
          } catch (error) {
            console.error("Error adding title slide image:", error);
          }
        }

        // Right section - Title content background (65% of slide)
        titleSlide.addShape(pptx.ShapeType.rect, {
          x: 3.5,
          y: 0,
          w: 6.5,
          h: 5.625,
          fill: { color: colors.bg2 }
        });

        // Vertical accent bar divider
        titleSlide.addShape(pptx.ShapeType.rect, {
          x: 3.5,
          y: 0,
          w: 0.1,
          h: 5.625,
          fill: { color: colors.accent }
        });

        // Colored accent box behind title
        titleSlide.addShape(pptx.ShapeType.rect, {
          x: 4.0,
          y: 2.0,
          w: 5.5,
          h: 1.8,
          fill: { color: colors.bg3 },
          line: { color: colors.accent, width: 3 }
        });

        // Main title on the right
        titleSlide.addText(presentation?.title || presentation?.topic || "Presentation", {
          x: 4.2,
          y: 2.2,
          w: 5.1,
          h: 1.4,
          fontSize: 38,
          bold: true,
          color: colors.title,
          fontFace: "Arial",
          align: "center",
          valign: "middle"
        });
      } else {
        // IMAGE ON RIGHT - Title Slide
        // Left section - Title content background (65% of slide)
        titleSlide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 6.5,
          h: 5.625,
          fill: { color: colors.bg2 }
        });

        // Right section - Image background (35% of slide)
        titleSlide.addShape(pptx.ShapeType.rect, {
          x: 6.5,
          y: 0,
          w: 3.5,
          h: 5.625,
          fill: { color: colors.bg1 }
        });

        // Vertical accent bar divider
        titleSlide.addShape(pptx.ShapeType.rect, {
          x: 6.4,
          y: 0,
          w: 0.1,
          h: 5.625,
          fill: { color: colors.accent }
        });

        // Add title-specific image on the right
        if (slides.length > 0 && slides[0].image_url) {
          // Use the first slide's generated image for title (it was generated based on topic)
          try {
            titleSlide.addImage({
              data: slides[0].image_url,
              x: 6.8,
              y: 0.7,
              w: 2.9,
              h: 4.2,
              sizing: { type: 'cover', w: 2.9, h: 4.2 }
            });
          } catch (error) {
            console.error("Error adding title slide image:", error);
          }
        }

        // Colored accent box behind title
        titleSlide.addShape(pptx.ShapeType.rect, {
          x: 0.5,
          y: 2.0,
          w: 5.5,
          h: 1.8,
          fill: { color: colors.bg3 },
          line: { color: colors.accent, width: 3 }
        });

        // Main title on the left
        titleSlide.addText(presentation?.title || presentation?.topic || "Presentation", {
          x: 0.7,
          y: 2.2,
          w: 5.1,
          h: 1.4,
          fontSize: 38,
          bold: true,
          color: colors.title,
          fontFace: "Arial",
          align: "center",
          valign: "middle"
        });
      }

      // Add content slides
      for (let index = 0; index < slides.length; index++) {
        const slideData = slides[index];
        const slide = pptx.addSlide();
        
        // Randomly determine if image should be on left or right (35% image, 65% content)
        const imageOnLeft = index % 2 === 0; // Alternate between left and right
        
        if (slideData.image_url) {
          // ========== IMAGE SLIDE LAYOUT (35% image / 65% content) ==========
          
          if (imageOnLeft) {
            // IMAGE ON LEFT LAYOUT
            // Left section - Image background
            slide.addShape(pptx.ShapeType.rect, {
              x: 0,
              y: 0,
              w: 3.5,
              h: 5.625,
              fill: { color: colors.bg1 }
            });

            // Add image with proper sizing (35% of slide)
            if (slideData.image_url) {
              try {
                slide.addImage({
                  data: slideData.image_url, // Use 'data' for base64 images
                  x: 0.3,
                  y: 0.7,
                  w: 2.9,
                  h: 4.2,
                  sizing: { type: 'cover', w: 2.9, h: 4.2 }
                });
              } catch (error) {
                console.error("Error adding image to slide:", error);
              }
            }

            // Right section - Content background (65% of slide)
            slide.addShape(pptx.ShapeType.rect, {
              x: 3.5,
              y: 0,
              w: 6.5,
              h: 5.625,
              fill: { color: colors.bg2 }
            });

            // Vertical accent bar divider
            slide.addShape(pptx.ShapeType.rect, {
              x: 3.5,
              y: 0,
              w: 0.1,
              h: 5.625,
              fill: { color: colors.accent }
            });

            // Title with proper spacing (prevent overlap)
            slide.addText(slideData.title, {
              x: 3.8,
              y: 0.4,
              w: 6.0,
              h: 0.8,
              fontSize: 24,
              bold: true,
              color: colors.title,
              fontFace: "Arial",
              align: "left",
              valign: "top",
              lineSpacing: 26
            });

            // Content bullets (remove markdown **)
            if (slideData.content) {
              const bulletPoints = slideData.content
                .split(/[•\n]/)
                .map(line => line.trim().replace(/\*\*/g, ''))
                .filter(line => line.length > 0);
              
              slide.addText(
                bulletPoints.map(point => ({
                  text: point,
                  options: { bullet: true, breakLine: true }
                })),
                {
                  x: 3.8,
                  y: 1.4,
                  w: 5.9,
                  h: 3.8,
                  fontSize: 12,
                  color: colors.text,
                  fontFace: "Arial",
                  align: "left",
                  valign: "top",
                  lineSpacing: 18
                }
              );
            }
          } else {
            // IMAGE ON RIGHT LAYOUT
            // Left section - Content background (65% of slide)
            slide.addShape(pptx.ShapeType.rect, {
              x: 0,
              y: 0,
              w: 6.5,
              h: 5.625,
              fill: { color: colors.bg2 }
            });

            // Right section - Image background (35% of slide)
            slide.addShape(pptx.ShapeType.rect, {
              x: 6.5,
              y: 0,
              w: 3.5,
              h: 5.625,
              fill: { color: colors.bg1 }
            });

            // Vertical accent bar divider
            slide.addShape(pptx.ShapeType.rect, {
              x: 6.4,
              y: 0,
              w: 0.1,
              h: 5.625,
              fill: { color: colors.accent }
            });

            // Add image with proper sizing (35% of slide)
            if (slideData.image_url) {
              try {
                slide.addImage({
                  data: slideData.image_url, // Use 'data' for base64 images
                  x: 6.8,
                  y: 0.7,
                  w: 2.9,
                  h: 4.2,
                  sizing: { type: 'cover', w: 2.9, h: 4.2 }
                });
              } catch (error) {
                console.error("Error adding image to slide:", error);
              }
            }

            // Title with proper spacing (prevent overlap)
            slide.addText(slideData.title, {
              x: 0.4,
              y: 0.4,
              w: 5.8,
              h: 0.8,
              fontSize: 24,
              bold: true,
              color: colors.title,
              fontFace: "Arial",
              align: "left",
              valign: "top",
              lineSpacing: 26
            });

            // Content bullets (remove markdown **)
            if (slideData.content) {
              const bulletPoints = slideData.content
                .split(/[•\n]/)
                .map(line => line.trim().replace(/\*\*/g, ''))
                .filter(line => line.length > 0);
              
              slide.addText(
                bulletPoints.map(point => ({
                  text: point,
                  options: { bullet: true, breakLine: true }
                })),
                {
                  x: 0.4,
                  y: 1.4,
                  w: 5.8,
                  h: 3.8,
                  fontSize: 12,
                  color: colors.text,
                  fontFace: "Arial",
                  align: "left",
                  valign: "top",
                  lineSpacing: 18
                }
              );
            }
          }

        } else {
          // ========== FULL CONTENT SLIDE LAYOUT ==========
          // Professional full-width design
          
          // Main background
          slide.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: 10,
            h: 5.625,
            fill: { color: colors.bg2 }
          });

          // Top accent stripe
          slide.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: 10,
            h: 0.08,
            fill: { color: colors.accent }
          });

          // Colored header section with subtle gradient effect
          slide.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0.08,
            w: 10,
            h: 1.5,
            fill: { color: colors.bg1 }
          });

          // Title in header section (prevent overlap)
          slide.addText(slideData.title, {
            x: 0.6,
            y: 0.4,
            w: 8.8,
            h: 1.0,
            fontSize: 32,
            bold: true,
            color: "FFFFFF",
            fontFace: "Arial",
            align: "left",
            valign: "middle",
            lineSpacing: 36
          });

          // Content area with light background
          slide.addShape(pptx.ShapeType.rect, {
            x: 0.5,
            y: 1.9,
            w: 9.0,
            h: 3.2,
            fill: { color: colors.bg3 },
            line: { color: colors.shadow, width: 0.5 }
          });

          // Left accent bar for content area
          slide.addShape(pptx.ShapeType.rect, {
            x: 0.5,
            y: 1.9,
            w: 0.08,
            h: 3.2,
            fill: { color: colors.accent }
          });

          // Content bullets with professional spacing (remove markdown **)
          if (slideData.content) {
            const bulletPoints = slideData.content
              .split(/[•\n]/)
              .map(line => line.trim().replace(/\*\*/g, '')) // Remove ** markdown
              .filter(line => line.length > 0);
            
            slide.addText(
              bulletPoints.map(point => ({
                text: point,
                options: { bullet: true, breakLine: true }
              })),
              {
                x: 1.1,
                y: 2.2,
                w: 8.1,
                h: 2.6,
                fontSize: 15,
                color: colors.text,
                fontFace: "Arial",
                align: "left",
                valign: "top",
                lineSpacing: 22
              }
            );
          }
        }

        // Professional footer (no page numbers)
        slide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 5.55,
          w: 10,
          h: 0.075,
          fill: { color: colors.accent }
        });
      }

      // ========== THANK YOU SLIDE ==========
      const thankYouSlide = pptx.addSlide();
      
      // Background
      thankYouSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 10,
        h: 5.625,
        fill: { color: colors.bg1 }
      });

      // Accent elements
      thankYouSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 10,
        h: 0.3,
        fill: { color: colors.accent }
      });

      thankYouSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 5.325,
        w: 10,
        h: 0.3,
        fill: { color: colors.accent }
      });

      // Thank you message (centered, no subtitle)
      thankYouSlide.addText("Thank You!!", {
        x: 1,
        y: 2.2,
        w: 8,
        h: 1.5,
        fontSize: 64,
        bold: true,
        color: "FFFFFF",
        fontFace: "Arial",
        align: "center",
        valign: "middle"
      });

      // Save presentation
      const fileName = `${presentation?.title || "presentation"}.pptx`;
      await pptx.writeFile({ fileName });
      toast.success("Presentation downloaded successfully!");
    } catch (error: any) {
      console.error("Error creating PPT:", error);
      toast.error("Failed to download presentation");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="container mx-auto max-w-6xl py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">{presentation?.title}</h1>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Slide {currentSlide + 1} of {slides.length}
            </div>
            <Button onClick={downloadPPT} variant="default">
              <Download className="mr-2 h-4 w-4" />
              Download PPT
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                {slide && (
                  <div className="space-y-6">
                    {isEditing ? (
                      <>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Image URL</label>
                            <div className="flex gap-2">
                              <Input
                                value={editedImageUrl}
                                onChange={(e) => setEditedImageUrl(e.target.value)}
                                placeholder="Image URL"
                              />
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="icon">
                                    <ImageIcon className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Change Image</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                      Enter a search term to find a new image from Unsplash:
                                    </p>
                                  <Input
                                    placeholder="e.g., technology, nature, business"
                                    onKeyDown={async (e) => {
                                      if (e.key === "Enter") {
                                        const query = e.currentTarget.value;
                                        if (query.trim()) {
                                          toast.info("Generating image...");
                                          try {
                                            const { data, error } = await supabase.functions.invoke("generate-slide-image", {
                                              body: { query },
                                            });
                                            
                                            if (error) throw error;
                                            if (data?.imageUrl) {
                                              setEditedImageUrl(data.imageUrl);
                                              toast.success("Image generated successfully!");
                                            }
                                          } catch (error: any) {
                                            console.error("Error generating image:", error);
                                            toast.error("Failed to generate image");
                                          }
                                        }
                                      }
                                    }}
                                  />
                                    <p className="text-xs text-muted-foreground">
                                      Press Enter to update the image
                                    </p>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          {editedImageUrl && (
                            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                              <img
                                src={editedImageUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop";
                                }}
                              />
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Title</label>
                            <Input
                              value={editedTitle}
                              onChange={(e) => setEditedTitle(e.target.value)}
                              placeholder="Slide title"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Content</label>
                            <Textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              placeholder="Slide content"
                              rows={8}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={saveEdit}>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`p-8 rounded-xl border-2 ${getThemeStyles(presentation?.theme || 'professional').bg} ${getThemeStyles(presentation?.theme || 'professional').border} shadow-lg`}>
                          {slide.image_url && (
                            <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-6 shadow-md">
                              <img
                                src={slide.image_url}
                                alt={slide.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop";
                                }}
                              />
                            </div>
                          )}
                          <div>
                            <h2 className={`text-4xl font-bold mb-6 ${getThemeStyles(presentation?.theme || 'professional').accent}`}>
                              {slide.title}
                            </h2>
                            <div className={`text-lg leading-relaxed ${getThemeStyles(presentation?.theme || 'professional').text}`}>
                              {slide.content.split('•').filter(line => line.trim()).map((line, i) => (
                                <div key={i} className="flex items-start gap-3 mb-3">
                                  <span className="text-2xl">•</span>
                                  <p className="flex-1">{line.trim()}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Edit Options</h3>
                <div className="space-y-2">
                  <Button
                    onClick={startEditing}
                    variant="outline"
                    className="w-full"
                    disabled={isEditing}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Manual Edit
                  </Button>
                  <Button
                    onClick={fetchAiSuggestions}
                    variant="outline"
                    className="w-full"
                    disabled={loadingSuggestions}
                  >
                    {loadingSuggestions ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    AI Edit Suggestions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isAiEditMode && aiSuggestions && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">AI Suggestions</h3>
                  <div className="space-y-4">
                    {aiSuggestions.suggestions?.map((suggestion: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg space-y-2">
                        <h4 className="font-medium text-sm">{suggestion.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {suggestion.content}
                        </p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => applySuggestion(suggestion)}
                          className="w-full"
                        >
                          Apply This
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <div className="flex gap-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSlide(idx);
                  setIsEditing(false);
                  setIsAiEditMode(false);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentSlide ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
