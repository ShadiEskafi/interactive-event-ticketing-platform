-- Migration 20261012_12_admin_user_provisioning.sql
-- Enables atomic provisioning of users and gate staff into Supabase auth.users,
-- auth.identities, and public.profiles with bcrypt hashed passwords.

-- 1. Update handle_new_user trigger to dynamically read role and assignment metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_event_id TEXT;
  v_date DATE;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', NEW.raw_app_meta_data->>'role', 'attendee');
  IF NEW.email = 'shadieskafi@gmail.com' THEN
    v_role := 'super_admin';
  END IF;

  IF NEW.raw_user_meta_data->>'assigned_event_id' IS NOT NULL AND NEW.raw_user_meta_data->>'assigned_event_id' <> '' THEN
    v_event_id := NEW.raw_user_meta_data->>'assigned_event_id';
  END IF;

  IF NEW.raw_user_meta_data->>'assigned_date' IS NOT NULL AND NEW.raw_user_meta_data->>'assigned_date' <> '' THEN
    BEGIN
      v_date := (NEW.raw_user_meta_data->>'assigned_date')::DATE;
    EXCEPTION WHEN OTHERS THEN
      v_date := NULL;
    END;
  END IF;

  INSERT INTO public.profiles (id, email, role, assigned_event_id, assigned_date)
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    v_event_id,
    v_date
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN profiles.email = 'shadieskafi@gmail.com' THEN 'super_admin' ELSE EXCLUDED.role END,
    assigned_event_id = COALESCE(EXCLUDED.assigned_event_id, profiles.assigned_event_id),
    assigned_date = COALESCE(EXCLUDED.assigned_date, profiles.assigned_date);
  RETURN NEW;
END;
$$;

-- 2. Deploy admin_provision_user Postgres Function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION admin_provision_user(
  p_email TEXT,
  p_password TEXT,
  p_role TEXT DEFAULT 'attendee',
  p_full_name TEXT DEFAULT NULL,
  p_assigned_event_id TEXT DEFAULT NULL,
  p_assigned_date TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
  v_norm_email TEXT;
  v_role TEXT;
  v_full_name TEXT;
  v_event_id TEXT;
  v_date DATE;
BEGIN
  v_norm_email := LOWER(TRIM(p_email));
  v_role := COALESCE(p_role, 'attendee');
  IF v_norm_email = 'shadieskafi@gmail.com' THEN
    v_role := 'super_admin';
  END IF;

  v_full_name := COALESCE(p_full_name, split_part(v_norm_email, '@', 1));
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  -- Safely sanitize assigned event ID
  v_event_id := NULLIF(TRIM(p_assigned_event_id), '');

  -- Safely parse assigned date
  IF p_assigned_date IS NOT NULL AND TRIM(p_assigned_date) <> '' THEN
    BEGIN
      v_date := (TRIM(p_assigned_date))::DATE;
    EXCEPTION WHEN OTHERS THEN
      v_date := NULL;
    END;
  ELSE
    v_date := NULL;
  END IF;

  -- Check if user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = v_norm_email;

  IF v_user_id IS NOT NULL THEN
    -- Update existing user password and metadata
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        raw_user_meta_data = jsonb_build_object(
          'sub', v_user_id::text,
          'email', v_norm_email,
          'full_name', v_full_name,
          'role', v_role,
          'assigned_event_id', v_event_id,
          'assigned_date', v_date,
          'email_verified', true
        ),
        updated_at = NOW(),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = v_user_id;

    -- Update profile
    UPDATE public.profiles
    SET role = v_role,
        assigned_event_id = v_event_id,
        assigned_date = v_date
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'updated',
      'user_id', v_user_id,
      'email', v_norm_email,
      'role', v_role,
      'assigned_event_id', v_event_id,
      'assigned_date', v_date
    );
  ELSE
    -- Generate new UUID for the user
    v_user_id := gen_random_uuid();

    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_sso_user,
      is_anonymous
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_norm_email,
      v_encrypted_pw,
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_norm_email,
        'full_name', v_full_name,
        'role', v_role,
        'assigned_event_id', v_event_id,
        'assigned_date', v_date,
        'email_verified', true
      ),
      NOW(),
      NOW(),
      false,
      false
    );

    -- Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_norm_email),
      'email',
      v_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );

    -- Insert into profiles
    INSERT INTO public.profiles (
      id,
      email,
      role,
      assigned_event_id,
      assigned_date
    ) VALUES (
      v_user_id,
      v_norm_email,
      v_role,
      v_event_id,
      v_date
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      assigned_event_id = EXCLUDED.assigned_event_id,
      assigned_date = EXCLUDED.assigned_date;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'created',
      'user_id', v_user_id,
      'email', v_norm_email,
      'role', v_role,
      'assigned_event_id', v_event_id,
      'assigned_date', v_date
    );
  END IF;
END;
$$;

-- Grant execution to client roles
GRANT EXECUTE ON FUNCTION admin_provision_user TO public, anon, authenticated, service_role;

-- 3. Pre-provision Core Administrative & Gate Staff Accounts
SELECT admin_provision_user('shadieskafi@gmail.com', '1234567899', 'super_admin', 'Shadi Askafi');
SELECT admin_provision_user('gate1.symphony@ticketcraft.com', 'GatePass1!', 'gate_staff', 'Gate 1 Operator');
SELECT admin_provision_user('gate2.symphony@ticketcraft.com', 'GatePass2!', 'gate_staff', 'Gate 2 Operator');
SELECT admin_provision_user('vipgate.symphony@ticketcraft.com', 'VIPPass2026!', 'gate_staff', 'VIP Gate Operator');
