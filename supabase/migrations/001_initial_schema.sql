-- FactureDoc AI - Initial Schema
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    company_address TEXT,
    company_city TEXT,
    company_zip TEXT,
    company_country TEXT DEFAULT 'France',
    company_phone TEXT,
    company_email TEXT,
    company_website TEXT,
    company_siret TEXT,
    company_tva TEXT,
    company_logo_url TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'inactive',
    documents_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    zip TEXT,
    country TEXT DEFAULT 'France',
    siret TEXT,
    tva_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('devis', 'facture', 'avoir')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'paid', 'cancelled', 'overdue')),
    number TEXT NOT NULL,
    title TEXT,
    description TEXT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    validity_date DATE,
    subtotal DECIMAL(12, 2) DEFAULT 0,
    tva_rate DECIMAL(5, 2) DEFAULT 20.00,
    tva_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    payment_terms TEXT,
    notes TEXT,
    footer_text TEXT,
    view_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    sign_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    viewed_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    signature_image TEXT,
    signature_ip TEXT,
    paid_at TIMESTAMPTZ,
    stripe_payment_link TEXT,
    stripe_payment_intent_id TEXT,
    pdf_url TEXT,
    sent_at TIMESTAMPTZ,
    reminder_3_sent_at TIMESTAMPTZ,
    reminder_7_sent_at TIMESTAMPTZ,
    reminder_14_sent_at TIMESTAMPTZ,
    template_id TEXT DEFAULT 'classic',
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

-- ============================================
-- DOCUMENT LINES TABLE
-- ============================================
CREATE TABLE document_lines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 3) DEFAULT 1,
    unit TEXT DEFAULT 'unité',
    unit_price DECIMAL(12, 2) DEFAULT 0,
    tva_rate DECIMAL(5, 2) DEFAULT 20.00,
    total_ht DECIMAL(12, 2) DEFAULT 0,
    total_tva DECIMAL(12, 2) DEFAULT 0,
    total_ttc DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

-- ============================================
-- TEMPLATES TABLE
-- ============================================
CREATE TABLE templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('devis', 'facture', 'both')),
    is_system BOOLEAN DEFAULT FALSE,
    content JSONB,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

-- ============================================
-- CLAUSES TABLE
-- ============================================
CREATE TABLE clauses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'custom',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

-- ============================================
-- AI CHATS TABLE
-- ============================================
CREATE TABLE ai_chats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

-- ============================================
-- EMAIL LOGS TABLE
-- ============================================
CREATE TABLE email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('document_sent', 'reminder_3', 'reminder_7', 'reminder_14', 'payment_received', 'document_signed')),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
    resend_id TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
  );

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_view_token ON documents(view_token);
CREATE INDEX idx_documents_sign_token ON documents(sign_token);
CREATE INDEX idx_document_lines_document_id ON document_lines(document_id);
CREATE INDEX idx_ai_chats_document_id ON ai_chats(document_id);
CREATE INDEX idx_email_logs_document_id ON email_logs(document_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients RLS
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

-- Documents RLS
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view documents by token" ON documents FOR SELECT USING (view_token IS NOT NULL);

-- Document Lines RLS
CREATE POLICY "Users can view own document lines" ON document_lines FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = document_lines.document_id AND documents.user_id = auth.uid())
  );
CREATE POLICY "Users can create own document lines" ON document_lines FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = document_lines.document_id AND documents.user_id = auth.uid())
  );
CREATE POLICY "Users can update own document lines" ON document_lines FOR UPDATE USING (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = document_lines.document_id AND documents.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own document lines" ON document_lines FOR DELETE USING (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = document_lines.document_id AND documents.user_id = auth.uid())
  );

-- Templates RLS
CREATE POLICY "Users can view system and own templates" ON templates FOR SELECT USING (is_system = TRUE OR auth.uid() = user_id);
CREATE POLICY "Users can create own templates" ON templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON templates FOR DELETE USING (auth.uid() = user_id);

-- Clauses RLS
CREATE POLICY "Users can view own clauses" ON clauses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own clauses" ON clauses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clauses" ON clauses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clauses" ON clauses FOR DELETE USING (auth.uid() = user_id);

-- AI Chats RLS
CREATE POLICY "Users can view own ai chats" ON ai_chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ai chats" ON ai_chats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Email Logs RLS
CREATE POLICY "Users can view own email logs" ON email_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own email logs" ON email_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications RLS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment document number
CREATE OR REPLACE FUNCTION generate_document_number(p_user_id UUID, p_type TEXT)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_prefix TEXT;
  v_year TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_prefix := CASE p_type
    WHEN 'devis' THEN 'DEV'
    WHEN 'facture' THEN 'FAC'
    WHEN 'avoir' THEN 'AVO'
    ELSE 'DOC'
  END;

  SELECT COUNT(*) + 1 INTO v_count
  FROM documents
  WHERE user_id = p_user_id
    AND type = p_type
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system templates
INSERT INTO templates (name, description, type, is_system, content) VALUES
('Classique', 'Template classique et professionnel', 'both', TRUE, '{"style": "classic", "primaryColor": "#1A56DB"}'),
('Moderne', 'Design épuré et moderne', 'both', TRUE, '{"style": "modern", "primaryColor": "#10B981"}'),
('Élégant', 'Style élégant avec en-tête premium', 'both', TRUE, '{"style": "elegant", "primaryColor": "#7C3AED"}'),
('Minimal', 'Design minimaliste et sobre', 'both', TRUE, '{"style": "minimal", "primaryColor": "#111827"}');
