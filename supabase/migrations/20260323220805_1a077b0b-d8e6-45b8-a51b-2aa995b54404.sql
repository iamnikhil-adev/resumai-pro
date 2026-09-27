-- Create resumes table
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Resume',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resumes" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resumes" ON public.resumes FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create analysis table
CREATE TABLE public.analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  ats_score INTEGER,
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analysis for their resumes" ON public.analysis
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.resumes WHERE resumes.id = analysis.resume_id AND resumes.user_id = auth.uid())
  );

CREATE POLICY "Users can create analysis for their resumes" ON public.analysis
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.resumes WHERE resumes.id = analysis.resume_id AND resumes.user_id = auth.uid())
  );

CREATE POLICY "Users can delete analysis for their resumes" ON public.analysis
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.resumes WHERE resumes.id = analysis.resume_id AND resumes.user_id = auth.uid())
  );