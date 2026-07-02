insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-images', 'dish-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists dish_images_select on storage.objects;
drop policy if exists dish_images_insert on storage.objects;
drop policy if exists dish_images_update on storage.objects;
drop policy if exists dish_images_delete on storage.objects;

create policy dish_images_select on storage.objects for select using (bucket_id = 'dish-images');
create policy dish_images_insert on storage.objects for insert with check (bucket_id = 'dish-images' and auth.uid() is not null);
create policy dish_images_update on storage.objects for update using (bucket_id = 'dish-images' and auth.uid() is not null);
create policy dish_images_delete on storage.objects for delete using (bucket_id = 'dish-images' and auth.uid() is not null);

do $$
begin
  alter publication supabase_realtime add table orders;
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table order_items;
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table payments;
exception when duplicate_object then null;
end;
$$;
