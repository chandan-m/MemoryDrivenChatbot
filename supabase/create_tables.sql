create table users (
  id uuid primary key default gen_random_uuid(),
  name text,
  age int,
  gender text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  role text,
  content text,
  timestamp timestamp default now()
);