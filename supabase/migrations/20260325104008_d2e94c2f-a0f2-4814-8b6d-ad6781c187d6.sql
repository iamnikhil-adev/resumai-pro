
CREATE TABLE public.lens_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_description text NOT NULL,
  match_score integer,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lens_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create lens analyses for their resumes"
  ON public.lens_analyses FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.resumes WHERE resumes.id = lens_analyses.resume_id AND resumes.user_id = auth.uid()
  ));

CREATE POLICY "Users can view lens analyses for their resumes"
  ON public.lens_analyses FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.resumes WHERE resumes.id = lens_analyses.resume_id AND resumes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete lens analyses for their resumes"
  ON public.lens_analyses FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM public.resumes WHERE resumes.id = lens_analyses.resume_id AND resumes.user_id = auth.uid()
  ));
