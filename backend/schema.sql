create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  hashed_password text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  full_name text
);

create table if not exists categories (
  id bigserial primary key,
  name text not null,
  slug text not null unique
);

create table if not exists products (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10,2) not null,
  brand text,
  category_id bigint not null references categories(id),
  stock integer not null default 0,
  image_url text,
  socket text,
  form_factor text,
  memory_type text,
  power_draw integer,
  performance_score integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_price on products(price);
create index if not exists idx_products_brand on products(brand);

create table if not exists orders (
  id bigserial primary key,
  user_id uuid not null references users(id),
  status text not null default 'pending',
  total_amount numeric(10,2) not null,
  payment_intent_id text,
  shipping_address jsonb,
  billing_address jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_user on orders(user_id);

create table if not exists order_items (
  id bigserial primary key,
  order_id bigint not null references orders(id) on delete cascade,
  product_id bigint not null references products(id),
  quantity integer not null,
  unit_price numeric(10,2) not null
);

create table if not exists carts (
  id bigserial primary key,
  user_id uuid not null unique references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cart_items (
  id bigserial primary key,
  cart_id bigint not null references carts(id) on delete cascade,
  product_id bigint not null references products(id),
  quantity integer not null
);

create table if not exists pc_builds (
  id bigserial primary key,
  user_id uuid not null references users(id),
  name text not null,
  total_price numeric(10,2) not null default 0,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pc_builds_user on pc_builds(user_id);

create table if not exists pc_build_items (
  id bigserial primary key,
  pc_build_id bigint not null references pc_builds(id) on delete cascade,
  product_id bigint not null references products(id),
  slot_type text not null,
  quantity integer not null default 1
);

create table if not exists reviews (
  id bigserial primary key,
  product_id bigint not null references products(id) on delete cascade,
  user_id uuid not null references users(id),
  rating integer not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint rating_range check (rating between 1 and 5)
);

create index if not exists idx_reviews_product on reviews(product_id);
create index if not exists idx_reviews_user on reviews(user_id);
