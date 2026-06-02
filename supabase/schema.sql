-- Create bookmarks table for fxtwitter URLs
CREATE TABLE public.bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    original_url TEXT NOT NULL,
    fxtwitter_url TEXT,
    author_name TEXT,
    author_handle TEXT,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create alcohol_logs table
CREATE TABLE public.alcohol_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    amount_ml INTEGER NOT NULL,
    beverage_type TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create memos table for wall-hitting
CREATE TABLE public.memos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create mental_logs table
CREATE TABLE public.mental_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    level INTEGER CHECK (level >= 1 AND level <= 5) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alcohol_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookmarks" ON public.bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own alcohol_logs" ON public.alcohol_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alcohol_logs" ON public.alcohol_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alcohol_logs" ON public.alcohol_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alcohol_logs" ON public.alcohol_logs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own memos" ON public.memos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memos" ON public.memos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memos" ON public.memos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memos" ON public.memos FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own mental_logs" ON public.mental_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mental_logs" ON public.mental_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mental_logs" ON public.mental_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mental_logs" ON public.mental_logs FOR DELETE USING (auth.uid() = user_id);
