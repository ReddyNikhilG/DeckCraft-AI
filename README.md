# 🧠 Slide Wizard – AI-Powered Presentation Generator

An AI-driven platform that automatically creates professional PowerPoint presentations from just a topic and slide count. Save hours of work with intelligent content and design generation.

## 🔗 Live Demo

**[https://slide-wizard-smoky.vercel.app/](https://slide-wizard-smoky.vercel.app/)**

## 🚀 What It Does

Slide Wizard is a full-stack AI-powered presentation creator.
Users simply enter a topic, optional description, and number of slides — and the app generates:

- Professionally written content
- Relevant AI-generated images
- Consistent themed designs
- Downloadable .pptx presentations

## 🧩 Core Features

### 1. 🪄 AI Presentation Generation

- Generates complete presentations from topic and slide count
- Produces 6–8 detailed bullet points per slide (75–95 characters each)
- Uses Google Gemini image generation for slide visuals
- Unique title slide with topic-relevant imagery
- Random left/right image placement (35% image, 65% content layout)

### 2. 🎨 Theme Support

Choose from five professional themes:

- **Professional** – Corporate, formal style
- **Creative** – Vibrant, artistic design
- **Minimal** – Clean, elegant simplicity
- **Bold** – Strong, impactful visuals
- **Academic** – Educational, scholarly format

### 3. 👤 User Management

- Email authentication with auto-confirm
- User profiles and personalized dashboards
- Presentation history tracking
- Secure session management

### 4. ✏️ Editing Capabilities

- Manual text editing for all slides
- AI-powered edit suggestions
- Real-time preview updates
- Title and content modification support

### 5. 📦 Export & Download

- Export presentations as PowerPoint (.pptx) files
- Preserves formatting, images, and themes
- Professionally structured slide layouts

## 🧠 AI Integration

- Google Gemini 2.5 Flash for content generation
- Google Gemini 2.5 Flash Image Preview for image generation
- Structured AI output with tool-calling
- Theme-specific prompting for stylistic consistency

## ⚙️ Technology Stack

### 🖥️ Frontend

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS with a custom design system
- React Router for navigation
- TanStack Query for data fetching
- Shadcn UI components
- PptxGenJS for PowerPoint file generation

### 🧩 Backend (Supabase)

- PostgreSQL database with Row Level Security (RLS)
- Supabase Auth for authentication
- Edge Functions for serverless logic
- AI generation powered by Google Gemini models

## 🗃️ Database Schema

### Tables

- **profiles**: User information (linked to auth.users)
- **presentations**: Presentation metadata (title, topic, theme, slide count)
- **slides**: Individual slide data (title, content, images, layout)

### Security

- RLS policies ensure users access only their own data
- Secure authentication and protected API endpoints

## 🔄 Key Workflows

### 1. Creating a Presentation

User Input → Edge Function → AI Content Generation → AI Image Generation → Database Storage → UI Display

### 2. Downloading PPT

Fetch Slides → Process Images (Base64) → Generate PPTX → Download File

### 3. Editing

User Edits → Database Update → Real-Time UI Refresh

## ⚡ Edge Functions

### 1. generate-presentation

- Main AI generation engine
- Takes topic, description, slide count, and theme
- Generates content and images
- Stores results in the database

### 2. ai-edit-suggestions

- Provides AI-powered content enhancement suggestions

### 3. generate-slide-image

- Regenerates individual slide images

## 🧱 File Structure

```
/src/pages               → Main routes (Index, Auth, Dashboard, Create, Editor, History)
/src/components          → Reusable UI components
/supabase/functions      → Backend Edge Functions
/src/integrations/supabase → Supabase client integration
```

## 🎨 Design System

- Custom HSL color tokens for consistent theming
- Responsive, accessible layouts
- Optimized for both light and dark modes
- Professional, presentation-ready visual design

## ⚡ Summary

Slide Wizard reduces presentation creation time from hours to seconds using cutting-edge AI for both content and visuals.

Perfect for professionals, students, and creators who want beautiful, data-driven presentations — instantly.
