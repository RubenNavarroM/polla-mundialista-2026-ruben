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

-- private_groups: cualquier usuario autenticado puede leer (necesario para buscar por invite_code)
CREATE POLICY "authenticated can view groups" ON private_groups
  FOR SELECT TO authenticated USING (true);

-- private_groups: el creador puede insertar
CREATE POLICY "users can create groups" ON private_groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- private_groups: el creador puede actualizar nombre/descripción
CREATE POLICY "creators can update their group" ON private_groups
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- group_members: usuarios pueden ver sus propias membresías y las del grupo si son miembros aprobados
CREATE POLICY "users can view memberships" ON group_members
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.status = 'approved'
    )
  );

-- group_members: los usuarios pueden solicitar unirse (insertar su propia fila)
CREATE POLICY "users can request to join" ON group_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- group_members: el admin del grupo puede aprobar/rechazar miembros
CREATE POLICY "group admins can update members" ON group_members
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
        AND gm.status = 'approved'
    )
  );

-- group_members: los usuarios pueden salir; el admin del grupo puede expulsar
CREATE POLICY "users can leave or admins can remove" ON group_members
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
        AND gm.status = 'approved'
    )
  );

-- Función SECURITY DEFINER para que el app-admin cambie el status del grupo
-- (bypasses RLS; la restricción de email se hace en el Server Action)
CREATE OR REPLACE FUNCTION update_private_group_status(p_group_id UUID, p_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('active', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;
  UPDATE private_groups SET status = p_status WHERE id = p_group_id;
END;
$$;
