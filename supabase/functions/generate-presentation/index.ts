import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, description, slideCount, theme = 'professional' } = await req.json();
    
    if (!topic || !slideCount) {
      return new Response(
        JSON.stringify({ error: "Topic and slide count are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating presentation for user ${user.id}: ${topic} (${slideCount} slides, theme: ${theme})`);

    // Define theme-specific styling instructions
    const themeInstructions: Record<string, string> = {
      professional: "Clean, corporate style with formal language and structured bullet points. Use business-appropriate imagery.",
      creative: "Vibrant, artistic style with engaging language and colorful imagery. Be innovative and eye-catching.",
      minimal: "Simple, elegant style with concise text and clean imagery. Focus on clarity and whitespace.",
      bold: "Strong, impactful style with powerful statements and striking imagery. Use assertive language.",
      academic: "Educational, formal style with detailed explanations and scholarly imagery. Be informative and precise."
    };

    // Generate slide content using AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build user message with description if provided
    const userPrompt = description 
      ? `Create ${slideCount} ${theme} slides about: ${topic}\n\nAdditional context: ${description}\n\nUse this context to generate more relevant and targeted content and images.`
      : `Create ${slideCount} ${theme} slides about: ${topic}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional presentation creator. Generate ${slideCount} slides about "${topic}" in a ${theme} style.
            
            Theme guidance: ${themeInstructions[theme] || themeInstructions.professional}
            
            Return a JSON array with exactly ${slideCount} objects, each with:
            - title: slide title (max 65 chars, theme-appropriate, clear and concise)
            - content: main content/bullets (6-8 bullet points separated by • , each bullet 75-95 chars with substantial detail)
            - imageQuery: detailed description for AI image generation (describe the style, mood, and subject in 10-15 words)
            
            CRITICAL FORMATTING RULES:
            - Content should be comprehensive and informative (6-8 bullet points per slide)
            - Each bullet point should be a complete, detailed sentence (75-95 characters)
            - Provide substantial detail to fill the content area effectively without overlapping
            - Do NOT use markdown formatting like ** or __ anywhere in the content
            - Make it engaging, well-structured, and perfectly aligned with the ${theme} theme
            - Content must fill approximately 65% of the slide space properly
            ${description ? '- Use the provided additional context to tailor the content and imagery' : ''}`,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    let slides;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiContent.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      slides = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Failed to parse AI generated content");
    }

    // Create presentation in database
    const { data: presentation, error: presentationError } = await supabase
      .from("presentations")
      .insert({
        user_id: user.id,
        title: topic,
        topic: topic,
        slide_count: slideCount,
        theme: theme,
      })
      .select()
      .single();

    if (presentationError) {
      console.error("Database error:", presentationError);
      throw presentationError;
    }

    // Generate images using AI for each slide
    const slidesWithImages = await Promise.all(
      slides.slice(0, slideCount).map(async (slide: any, index: number) => {
        let imageUrl = "";
        
        try {
          // Generate image using Lovable AI with theme-specific styling
          const imageQuery = slide.imageQuery || slide.title;
          console.log(`Generating ${theme} themed image for slide ${index}: ${imageQuery}`);
          
          const imageStyleInstructions: Record<string, string> = {
            professional: "Corporate, clean, professional stock photo style with muted colors and business aesthetic",
            creative: "Vibrant, artistic, colorful and imaginative visual with creative composition",
            minimal: "Minimal, clean, simple composition with lots of whitespace and subtle colors",
            bold: "Strong, dramatic, high-contrast visual with bold colors and striking composition",
            academic: "Educational, informative, scholarly illustration style with clear visual hierarchy"
          };
          
          const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image-preview",
              messages: [
                {
                  role: "user",
                  content: `Generate a high-quality 16:9 aspect ratio image for a ${theme} presentation slide. Style: ${imageStyleInstructions[theme] || imageStyleInstructions.professional}. Subject: ${imageQuery}. Make it visually stunning and perfectly aligned with the ${theme} aesthetic.`,
                },
              ],
              modalities: ["image", "text"],
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (generatedImage) {
              imageUrl = generatedImage;
              console.log(`Successfully generated image for slide ${index}`);
            }
          } else {
            console.error(`Failed to generate image for slide ${index}`);
          }
        } catch (error) {
          console.error("Image generation error:", error);
        }

        return {
          presentation_id: presentation.id,
          slide_index: index,
          title: slide.title,
          content: slide.content,
          image_url: imageUrl,
          layout: "title-content",
        };
      })
    );

    // Insert all slides
    const { error: slidesError } = await supabase
      .from("slides")
      .insert(slidesWithImages);

    if (slidesError) {
      console.error("Slides insert error:", slidesError);
      throw slidesError;
    }

    console.log(`Successfully created presentation ${presentation.id}`);

    return new Response(
      JSON.stringify({ 
        presentationId: presentation.id,
        slides: slidesWithImages,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-presentation:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
