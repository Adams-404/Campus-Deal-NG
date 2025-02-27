alter table conversations add constraint conversations_item_id_fkey foreign key (item_id) references items (id) on delete set null;
