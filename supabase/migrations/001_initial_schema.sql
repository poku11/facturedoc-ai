-- FactureDoc AI - Initial Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL, full_name TEXT, company_name TEXT,
  company_address TEXT, company_city TEXT, company_postal_code TEXT,
  company_country TEXT DEFAULT 'France', company_phone TEXT,
  company_email TEXT, company_siret TEXT, company_vat_number TEXT,
  company_logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
  stripe_customer_id TEXT, stripe_subscription_id TEXT, stripe_subscription_status TEXT,
  documents_count INTEGER DEFAULT 0, ai_credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, email TEXT, phone TEXT, company TEXT,
  address TEXT, city TEXT, postal_code TEXT, country TEXT DEFAULT 'France',
  siret TEXT, vat_number TEXT, notes TEXT,
  total_invoiced DECIMAL(12,2) DEFAULT 0, documents_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT,
  type TEXT NOT NULL CHECK (type IN ('invoice', 'quote')),
  content JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE, is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('invoice', 'quote')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','signed','paid','overdue','cancelled')),
  number TEXT NOT NULL, title TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE, due_date DATE,
  currency TEXT DEFAULT 'EUR',
  subtotal DECIMAL(12,2) DEFAULT 0, tax_rate DECIMAL(5,2) DEFAULT 20,
  tax_amount DECIMAL(12,2) DEFAULT 0, discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  notes TEXT, terms TEXT, payment_instructions TEXT,
  view_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  sign_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  viewed_at TIMESTAMPTZ, signed_at TIMESTAMPTZ,
  signature_data TEXT, signature_ip TEXT, paid_at TIMESTAMPTZ,
  stripe_payment_link_id TEXT, stripe_payment_link_url TEXT, pdf_url TEXT,
  ai_generated BOOLEAN DEFAULT FALSE, sent_count INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ, reminder_count INTEGER DEFAULT 0, last_reminder_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0, description TEXT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1, unit TEXT DEFAULT 'unite',
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 20, discount_percent DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, content TEXT NOT NULL,
  type TEXT CHECK (type IN ('payment','delivery','warranty','confidentiality','other')),
  is_default BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL, subject TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('document_sent','reminder_d3','reminder_d7','reminder_d14','payment_confirmed')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','bounced')),
  resend_id TEXT, error_message TEXT, sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, title TEXT NOT NULL, message TEXT,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_view_token ON documents(view_token);
CREATE INDEX idx_documents_due_date ON documents(due_date);
CREATE INDEX idx_document_lines_document_id ON document_lines(document_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_ai_chats_document_id ON ai_chats(document_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS
$$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS
$$ BEGIN INSERT INTO public.profiles (id, email, full_name) VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name'); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can CRUD own clients" ON clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own documents" ON documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view documents by token" ON documents FOR SELECT USING (view_token IS NOT NULL);
CREATE POLICY "Users can CRUD own document lines" ON document_lines FOR ALL USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_lines.document_id AND documents.user_id = auth.uid()));
CREATE POLICY "Users can view own and public templates" ON templates FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can CRUD own templates" ON templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own clauses" ON clauses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own ai chats" ON ai_chats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own email logs" ON email_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert email logs" ON email_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can CRUD own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
