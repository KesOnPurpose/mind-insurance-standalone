-- Enable RLS on knowledge chunk tables
ALTER TABLE nette_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE me_knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for edge functions to read)
CREATE POLICY "Service role has full access to nette chunks"
ON nette_knowledge_chunks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role has full access to me chunks"
ON me_knowledge_chunks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read (for RAG queries)
CREATE POLICY "Authenticated users can read nette chunks"
ON nette_knowledge_chunks
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Authenticated users can read me chunks"
ON me_knowledge_chunks
FOR SELECT
TO authenticated
USING (is_active = true);