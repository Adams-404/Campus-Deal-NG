alter table conversations add column item_id uuid references items(id) on delete set null;
