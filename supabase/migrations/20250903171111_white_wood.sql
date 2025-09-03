/*
  # Chatify Database Schema

  1. New Tables
    - `chatbots` - Main chatbot configurations and metadata
    - `chatbot_pages` - Scraped website pages with content and embeddings
    - `chatbot_qa` - Generated Q&A pairs with embeddings for RAG
    - `chatbot_interactions` - User interactions and analytics

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Add indexes for performance

  3. Extensions
    - Enable vector extension for embeddings
    - Add similarity search functions
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Create chatbots table
CREATE TABLE IF NOT EXISTS chatbots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_url text NOT NULL,
  website_name text NOT NULL,
  bot_type text NOT NULL DEFAULT 'general',
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  progress integer DEFAULT 0,
  pages_scraped integer DEFAULT 0,
  qa_pairs_generated integer DEFAULT 0,
  summary text DEFAULT '',
  error_message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create chatbot_pages table for scraped content
CREATE TABLE IF NOT EXISTS chatbot_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text DEFAULT '',
  description text DEFAULT '',
  content text NOT NULL,
  headings jsonb DEFAULT '[]',
  nav_links jsonb DEFAULT '[]',
  word_count integer DEFAULT 0,
  embedding vector(1536),
  scraped_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create chatbot_qa table for Q&A pairs
CREATE TABLE IF NOT EXISTS chatbot_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  keywords text[] DEFAULT '{}',
  confidence real DEFAULT 0.0,
  source_pages text[] DEFAULT '{}',
  embedding vector(1536),
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create chatbot_interactions table for analytics
CREATE TABLE IF NOT EXISTS chatbot_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES chatbots(id) ON DELETE CASCADE,
  user_query text NOT NULL,
  bot_response text NOT NULL,
  confidence real DEFAULT 0.0,
  sources text[] DEFAULT '{}',
  session_id text DEFAULT '',
  user_feedback integer DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing public access for demo purposes)
-- In production, you should restrict these based on user authentication

CREATE POLICY "Allow public read access to chatbots"
  ON chatbots FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to chatbots"
  ON chatbots FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to chatbots"
  ON chatbots FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete to chatbots"
  ON chatbots FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public access to chatbot_pages"
  ON chatbot_pages FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow public access to chatbot_qa"
  ON chatbot_qa FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow public access to chatbot_interactions"
  ON chatbot_interactions FOR ALL
  TO public
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatbots_status ON chatbots(status);
CREATE INDEX IF NOT EXISTS idx_chatbots_created_at ON chatbots(created_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_pages_chatbot_id ON chatbot_pages(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_qa_chatbot_id ON chatbot_qa(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_qa_category ON chatbot_qa(category);
CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_chatbot_id ON chatbot_interactions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_created_at ON chatbot_interactions(created_at);

-- Create vector similarity search functions
CREATE OR REPLACE FUNCTION search_similar_qa(
  chatbot_id uuid,
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_limit int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  category text,
  keywords text[],
  confidence real,
  source_pages text[],
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    id,
    question,
    answer,
    category,
    keywords,
    confidence,
    source_pages,
    1 - (embedding <=> query_embedding) AS similarity
  FROM chatbot_qa
  WHERE chatbot_qa.chatbot_id = search_similar_qa.chatbot_id
    AND 1 - (embedding <=> query_embedding) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_limit;
$$;

CREATE OR REPLACE FUNCTION search_similar_pages(
  chatbot_id uuid,
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_limit int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  url text,
  title text,
  description text,
  content text,
  word_count integer,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    id,
    url,
    title,
    description,
    content,
    word_count,
    1 - (embedding <=> query_embedding) AS similarity
  FROM chatbot_pages
  WHERE chatbot_pages.chatbot_id = search_similar_pages.chatbot_id
    AND 1 - (embedding <=> query_embedding) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_limit;
$$;