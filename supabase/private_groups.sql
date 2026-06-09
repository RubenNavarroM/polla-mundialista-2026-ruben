-- Grupos privados
CREATE TABLE IF NOT EXISTS private_groups (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  created_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code  TEXT UNIQUE NOT NULL DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Miembros de grupos
CREATE TABLE IF NOT EXISTS group_members (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id   UUID NOT NULL REFERENCES private_groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- RLS
ALTER TABLE private_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members   ENABLE ROW LEVEL SECURITY;

-- private_groups policies
CREATE POLICY "authenticated can view groups" ON private_groups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "users can create groups" ON private_groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "creators can update their group" ON private_groups
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "creators can delete their group" ON private_groups
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Funciones SECURITY DEFINER para evitar recursión en las policies de group_members
CREATE OR REPLACE FUNCTION user_is_approved_in_group(p_group_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = auth.uid() AND status = 'approved'
  )
$$;

CREATE OR REPLACE FUNCTION user_is_group_admin(p_group_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = auth.uid() AND role = 'admin' AND status = 'approved'
  )
$$;

-- group_members policies (sin self-referencia)
CREATE POLICY "users see own memberships" ON group_members
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "group members see group memberships" ON group_members
  FOR SELECT TO authenticated USING (user_is_approved_in_group(group_id));

CREATE POLICY "users can request to join" ON group_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "group admins can update members" ON group_members
  FOR UPDATE TO authenticated USING (user_is_group_admin(group_id));

CREATE POLICY "users can leave or admins can remove" ON group_members
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id OR user_is_group_admin(group_id)
  );

-- Función SECURITY DEFINER para que el app-admin cambie el status del grupo
CREATE OR REPLACE FUNCTION update_private_group_status(p_group_id UUID, p_status TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_status NOT IN ('active', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;
  UPDATE private_groups SET status = p_status WHERE id = p_group_id;
END;
$$;
