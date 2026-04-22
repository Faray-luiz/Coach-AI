-- Initial Schema for Simi Treinadora

-- 1. Mentors table
CREATE TABLE mentors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  total_sessions INTEGER DEFAULT 0,
  average_mes DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  mentee_name TEXT,
  topic TEXT,
  recording_url TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Analyses table
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  mes_score INTEGER CHECK (mes_score >= 0 AND mes_score <= 100),
  
  -- Framework dimensions
  clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 100),
  depth_score INTEGER CHECK (depth_score >= 0 AND depth_score <= 100),
  connection_score INTEGER CHECK (connection_score >= 0 AND connection_score <= 100),
  efficiency_score INTEGER CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  consistency_score INTEGER CHECK (consistency_score >= 0 AND consistency_score <= 100),
  
  -- Feedback
  strengths TEXT[],
  improvements TEXT[],
  micro_adjustments JSONB, -- Specific suggestions with snippets
  conversation_blocks JSONB, -- Abertura, Exploração, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
