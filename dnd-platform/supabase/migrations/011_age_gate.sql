-- Add date_of_birth to user profiles
alter table public.users add column if not exists date_of_birth date;

-- Update the new-user trigger to capture DOB from auth signup metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name, date_of_birth)
  values (
    new.id,
    new.email,
    (new.raw_user_meta_data->>'date_of_birth')::date
  );
  return new;
end;
$$ language plpgsql security definer;
