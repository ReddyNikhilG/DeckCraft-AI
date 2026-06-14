-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create presentations table
CREATE TABLE public.presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  slide_count INTEGER NOT NULL,
  theme TEXT DEFAULT 'modern',
  storage_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on presentations
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

-- Presentations policies
CREATE POLICY "Users can view their own presentations"
  ON public.presentations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own presentations"
  ON public.presentations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presentations"
  ON public.presentations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presentations"
  ON public.presentations FOR DELETE
  USING (auth.uid() = user_id);

-- Create slides table
CREATE TABLE public.slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  slide_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  layout TEXT DEFAULT 'title-content',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(presentation_id, slide_index)
);

-- Enable RLS on slides
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;

-- Slides policies
CREATE POLICY "Users can view slides of their presentations"
  ON public.slides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create slides for their presentations"
  ON public.slides FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update slides of their presentations"
  ON public.slides FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete slides of their presentations"
  ON public.slides FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slides_updated_at
  BEFORE UPDATE ON public.slides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();