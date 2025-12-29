-- NOTE: change to your own passwords for production environments
\set pguser `echo "$POSTGRES_USER"`

alter user :"pguser" with password :'POSTGRES_PASSWORD';

create role anon                nologin noinherit;
create role authenticated       nologin noinherit; -- "logged in" user: web_user, app_user, etc
create role service_role        nologin noinherit bypassrls; -- allow developers to create JWT tokens that bypass their policies

create user authenticator noinherit;
grant anon              to authenticator;
grant authenticated     to authenticator;
grant service_role      to authenticator;

grant usage                     on schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

-- Allow postgres to read from HTTP, the future home of the Web-based CRDT and other database superpowers
create user supabase_admin noinherit createrole createdb replication bypassrls;
create user supabase_auth_admin noinherit createrole createdb;
create user supabase_storage_admin noinherit createrole createdb;
create user supabase_read_only_user;

grant anon              to supabase_admin;
grant authenticated     to supabase_admin;
grant service_role      to supabase_admin;

grant supabase_auth_admin   to supabase_admin;
grant supabase_storage_admin to supabase_admin;
grant supabase_read_only_user to supabase_admin;

alter user supabase_admin with password :'POSTGRES_PASSWORD';
alter user supabase_auth_admin with password :'POSTGRES_PASSWORD';
alter user supabase_storage_admin with password :'POSTGRES_PASSWORD';
alter user supabase_read_only_user with password :'POSTGRES_PASSWORD';

create user supabase_realtime_admin;
alter user supabase_realtime_admin with password :'POSTGRES_PASSWORD';
grant all on database :"POSTGRES_DB" to supabase_realtime_admin;

create user supabase_replication_admin noinherit login replication;
alter user supabase_replication_admin with password :'POSTGRES_PASSWORD';

grant all on database :"POSTGRES_DB" to supabase_replication_admin;
