-- ==============================================
-- ENUMS - Tipos de dados enumerados
-- ==============================================

-- Tipos de papéis dos usuários no sistema
CREATE TYPE public.app_role AS ENUM ('admin', 'tecnico', 'cliente');

-- Status possíveis do chamado
CREATE TYPE public.ticket_status AS ENUM (
  'open',              -- Aberto (recém criado)
  'waiting_ai',        -- Aguardando resposta da IA
  'ai_responded',      -- IA respondeu
  'assigned_to_tech',  -- Atribuído a um técnico
  'in_progress',       -- Em atendimento
  'resolved',          -- Resolvido
  'closed'             -- Fechado
);

-- Tipos de mensagens no ticket
CREATE TYPE public.message_type AS ENUM ('user', 'ai', 'tech', 'system');

-- ==============================================
-- TABELA: profiles
-- Armazena informações adicionais dos usuários
-- ==============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================
-- TABELA: user_roles
-- Gerencia os papéis dos usuários (evita recursão RLS)
-- ==============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- ==============================================
-- TABELA: tickets
-- Armazena os chamados do sistema
-- ==============================================
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status ticket_status NOT NULL DEFAULT 'open',
  
  -- Relacionamentos
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_tech_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Controle de IA
  ai_attempted BOOLEAN NOT NULL DEFAULT false,
  ai_resolved BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- ==============================================
-- TABELA: ticket_messages
-- Histórico de mensagens/interações do ticket
-- ==============================================
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message_type message_type NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================
-- TABELA: ticket_assignments
-- Histórico de atribuições de técnicos
-- ==============================================
CREATE TABLE public.ticket_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  tech_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ==============================================
-- ÍNDICES - Melhoram performance das consultas
-- ==============================================
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_tickets_assigned_tech_id ON public.tickets(assigned_tech_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- ==============================================
-- FUNÇÃO: has_role
-- Verifica se um usuário tem um papel específico
-- Security definer para evitar recursão em RLS
-- ==============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ==============================================
-- FUNÇÃO: is_admin
-- Atalho para verificar se é admin
-- ==============================================
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- ==============================================
-- FUNÇÃO: is_tecnico
-- Atalho para verificar se é técnico
-- ==============================================
CREATE OR REPLACE FUNCTION public.is_tecnico(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'tecnico')
$$;

-- ==============================================
-- FUNÇÃO: update_updated_at_column
-- Atualiza automaticamente o campo updated_at
-- ==============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ==============================================
-- FUNÇÃO: handle_new_user
-- Cria profile automaticamente quando usuário se registra
-- ==============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email
  );
  
  -- Define role padrão como 'cliente'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');
  
  RETURN NEW;
END;
$$;

-- ==============================================
-- TRIGGERS - Automações do banco
-- ==============================================

-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em tickets
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar profile quando usuário se registra
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- ENABLE RLS - Ativa segurança em nível de linha
-- ==============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_assignments ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- RLS POLICIES: profiles
-- ==============================================

-- Todos podem ver todos os perfis (necessário para ver nomes)
CREATE POLICY "Profiles são visíveis para usuários autenticados"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Admins podem atualizar qualquer perfil
CREATE POLICY "Admins podem atualizar qualquer perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ==============================================
-- RLS POLICIES: user_roles
-- ==============================================

-- Todos podem ver roles (necessário para verificações)
CREATE POLICY "Roles são visíveis para usuários autenticados"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem inserir roles
CREATE POLICY "Admins podem inserir roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Apenas admins podem deletar roles
CREATE POLICY "Admins podem deletar roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ==============================================
-- RLS POLICIES: tickets
-- ==============================================

-- Clientes veem apenas seus próprios tickets
-- Técnicos e Admins veem todos
CREATE POLICY "Usuários podem ver tickets apropriados"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    public.is_tecnico(auth.uid()) OR
    public.is_admin(auth.uid())
  );

-- Apenas clientes podem criar tickets (via web)
CREATE POLICY "Clientes podem criar tickets"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Técnicos e Admins podem atualizar tickets
CREATE POLICY "Técnicos e Admins podem atualizar tickets"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (
    public.is_tecnico(auth.uid()) OR
    public.is_admin(auth.uid())
  );

-- Apenas Admins podem deletar tickets
CREATE POLICY "Admins podem deletar tickets"
  ON public.tickets FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ==============================================
-- RLS POLICIES: ticket_messages
-- ==============================================

-- Usuários podem ver mensagens dos tickets que têm acesso
CREATE POLICY "Usuários podem ver mensagens de seus tickets"
  ON public.ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND (
        tickets.user_id = auth.uid() OR
        tickets.assigned_tech_id = auth.uid() OR
        public.is_admin(auth.uid())
      )
    )
  );

-- Usuários autenticados podem inserir mensagens em tickets que participam
CREATE POLICY "Usuários podem inserir mensagens em seus tickets"
  ON public.ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND (
        tickets.user_id = auth.uid() OR
        tickets.assigned_tech_id = auth.uid() OR
        public.is_admin(auth.uid())
      )
    )
  );

-- ==============================================
-- RLS POLICIES: ticket_assignments
-- ==============================================

-- Técnicos e Admins podem ver atribuições
CREATE POLICY "Técnicos e Admins podem ver atribuições"
  ON public.ticket_assignments FOR SELECT
  TO authenticated
  USING (
    public.is_tecnico(auth.uid()) OR
    public.is_admin(auth.uid())
  );

-- Técnicos e Admins podem criar atribuições
CREATE POLICY "Técnicos e Admins podem criar atribuições"
  ON public.ticket_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_tecnico(auth.uid()) OR
    public.is_admin(auth.uid())
  );