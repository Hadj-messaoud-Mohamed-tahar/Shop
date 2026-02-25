-- Trigger pour créer automatiquement un profil utilisateur public lors de l'inscription
-- Copiez ce code dans l'éditeur SQL de votre projet Supabase (Dashboard > SQL Editor)

-- 1. Créer la fonction qui gère le nouvel utilisateur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'customer' -- Rôle par défaut
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name;
  return new;
end;
$$;

-- 2. Créer le trigger qui se déclenche après chaque insertion dans auth.users
-- On supprime d'abord s'il existe déjà pour éviter les erreurs
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. (Optionnel) Vérifier que la table public.users a les bonnes colonnes
-- Assurez-vous que votre table 'users' existe avec : id (uuid, primary key), email (text), full_name (text), role (text)
