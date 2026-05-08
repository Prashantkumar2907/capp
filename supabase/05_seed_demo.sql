insert into organizations (id, name, slug, logo_url, accent_color, restaurant_type, default_tax_percent, tax_inclusive, plan, subscription_status, settings)
values
('a0000000-0000-0000-0000-000000000011', 'Lotus Tea Room', 'lotus-tea-room', 'https://placehold.co/256x256/png?text=Lotus%20Tea', '#2f8f6b', 'tea_shop', 5, true, 'starter', 'trial', '{"currency":"INR","timezone":"Asia/Kolkata","service_charge_percent":0,"rounding":"nearest_rupee","tips_enabled":false,"business_hours":{"mon_fri":"08:00-20:00","sat_sun":"09:00-21:00"},"receipt_prefix":"LTR","plan_limits":{"branches":1,"staff":6}}'::jsonb),
('a0000000-0000-0000-0000-000000000099', 'Masala Works', 'masala-works', 'https://placehold.co/256x256/png?text=Masala%20Works', '#128c7e', 'casual_dining', 5, true, 'growth', 'active', '{"currency":"INR","timezone":"Asia/Kolkata","service_charge_percent":5,"rounding":"nearest_rupee","tips_enabled":true,"business_hours":{"daily":"11:30-23:00"},"receipt_prefix":"MW","plan_limits":{"branches":2,"staff":25}}'::jsonb),
('a0000000-0000-0000-0000-000000000033', 'Harbour Spice Group', 'harbour-spice-group', 'https://placehold.co/256x256/png?text=Harbour%20Spice', '#3275c9', 'multi_branch', 5, false, 'enterprise', 'active', '{"currency":"INR","timezone":"Asia/Kolkata","service_charge_percent":7.5,"rounding":"nearest_rupee","tips_enabled":true,"business_hours":{"lunch":"12:00-15:30","dinner":"18:30-23:30"},"receipt_prefix":"HSG","plan_limits":{"branches":25,"staff":250}}'::jsonb),
('a0000000-0000-0000-0000-000000000044', 'Night Owl Bowls', 'night-owl-bowls', 'https://placehold.co/256x256/png?text=Night%20Owl', '#d99012', 'cloud_kitchen', 5, true, 'pro', 'active', '{"currency":"INR","timezone":"Asia/Kolkata","service_charge_percent":0,"rounding":"nearest_rupee","tips_enabled":false,"business_hours":{"daily":"17:00-02:00"},"receipt_prefix":"NOB","fulfillment":"pickup_takeaway","plan_limits":{"branches":5,"staff":40}}'::jsonb)
on conflict (id) do nothing;

insert into branches (id, org_id, name, address, city, phone, upi_vpa, table_count, settings)
values
('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'Jayanagar Tea Bar', '42 7th Main, Jayanagar', 'Bengaluru', '+91 80000 01011', 'lotustea@upi', 8, '{"prep_zones":["tea","snacks"],"pickup_counter":true}'::jsonb),
('b0000000-0000-0000-0000-000000000099', 'a0000000-0000-0000-0000-000000000099', 'Indiranagar Dining Room', '12 Market Road, Indiranagar', 'Bengaluru', '+91 80000 01099', 'masalaworks@upi', 14, '{"prep_zones":["tandoor","curry","bar"],"table_turn_target_mins":55}'::jsonb),
('b0000000-0000-0000-0000-000000000331', 'a0000000-0000-0000-0000-000000000033', 'Colaba Sea View', 'Pier 4, Colaba Causeway', 'Mumbai', '+91 80000 03301', 'harbourcolaba@upi', 18, '{"prep_zones":["grill","seafood","bar"],"branch_code":"HSG-COL"}'::jsonb),
('b0000000-0000-0000-0000-000000000332', 'a0000000-0000-0000-0000-000000000033', 'Bandra Courtyard', '88 Chapel Lane, Bandra West', 'Mumbai', '+91 80000 03302', 'harbourbandra@upi', 16, '{"prep_zones":["grill","dessert","bar"],"branch_code":"HSG-BAN"}'::jsonb),
('b0000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000044', 'Koramangala Pickup Kitchen', '5th Block Commissary Lane', 'Bengaluru', '+91 80000 04400', 'nightowl@upi', 2, '{"prep_zones":["bowls","packing"],"pickup_slots_mins":15,"delivery_partner_ready":true}'::jsonb)
on conflict (id) do nothing;

insert into staff (id, org_id, branch_id, full_name, email, phone, role, is_active)
values
('50000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', 'Demo Cafe Owner', 'owner.lotus@demo.capp.local', '+91 70000 00001', 'owner', true),
('50000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000099', 'b0000000-0000-0000-0000-000000000099', 'Demo Admin', 'admin.masala@demo.capp.local', '+91 70000 00002', 'admin', true),
('50000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000331', 'Demo Manager', 'manager.harbour@demo.capp.local', '+91 70000 00003', 'manager', true),
('50000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000099', 'b0000000-0000-0000-0000-000000000099', 'Demo Waiter', 'waiter.masala@demo.capp.local', '+91 70000 00004', 'waiter', true),
('50000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000332', 'Demo Kitchen Lead', 'kitchen.harbour@demo.capp.local', '+91 70000 00005', 'kitchen', true),
('50000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000044', 'b0000000-0000-0000-0000-000000000044', 'Demo Cashier', 'cashier.nightowl@demo.capp.local', '+91 70000 00006', 'cashier', true),
('50000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000331', 'Disabled Demo Staff', 'disabled.harbour@demo.capp.local', '+91 70000 00007', 'waiter', false)
on conflict (id) do nothing;

insert into categories (id, org_id, name, sort_order, is_active)
values
('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'Signature Teas', 1, true),
('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000011', 'Cafe Bites', 2, true),
('c0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000011', 'Breakfast', 3, true),
('c0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000099', 'Starters', 1, true),
('c0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000099', 'Mains', 2, true),
('c0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000099', 'Breads', 3, true),
('c0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000099', 'Beverages', 4, true),
('c0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000033', 'Coastal Starters', 1, true),
('c0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000033', 'Grills', 2, true),
('c0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000033', 'Regional Curries', 3, true),
('c0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000033', 'Desserts', 4, true),
('c0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000044', 'Rice Bowls', 1, true),
('c0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000044', 'Wraps', 2, true),
('c0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000044', 'Late Night Drinks', 3, true)
on conflict (id) do nothing;

insert into dishes (id, org_id, category_id, name, description, price, image_url, is_veg, is_active, tags, prep_time_mins)
values
('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'Kashmiri Kahwa Pot', 'Saffron green tea with almonds for two', 180, 'https://placehold.co/640x480/png?text=Kashmiri%20Kahwa', true, true, array['tea','signature'], 6),
('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'Masala Chai Flask', 'Slow brewed chai served with jaggery rusks', 150, 'https://placehold.co/640x480/png?text=Masala%20Chai', true, true, array['tea','popular'], 5),
('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000012', 'Corn Spinach Sandwich', 'Grilled sandwich with herbed corn and spinach', 190, 'https://placehold.co/640x480/png?text=Corn%20Sandwich', true, true, array['snack','veg'], 12),
('d0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000013', 'Millet Upma Bowl', 'Foxtail millet upma with coconut chutney', 160, 'https://placehold.co/640x480/png?text=Millet%20Upma', true, true, array['breakfast'], 10),
('d0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000014', 'Paneer Tikka', 'Charred cottage cheese, peppers, mint chutney', 260, 'https://placehold.co/640x480/png?text=Paneer%20Tikka', true, true, array['popular','veg'], 18),
('d0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000014', 'Chicken 65', 'Crisp chicken tossed with curry leaves', 320, 'https://placehold.co/640x480/png?text=Chicken%2065', false, true, array['spicy'], 22),
('d0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000015', 'Dal Makhani', 'Slow simmered black lentils finished with butter', 280, 'https://placehold.co/640x480/png?text=Dal%20Makhani', true, true, array['veg'], 30),
('d0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000015', 'Butter Chicken', 'Creamy tomato gravy with tandoori chicken', 390, 'https://placehold.co/640x480/png?text=Butter%20Chicken', false, true, array['popular'], 28),
('d0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000016', 'Garlic Naan', 'Tandoor naan with garlic butter', 70, 'https://placehold.co/640x480/png?text=Garlic%20Naan', true, true, array['bread'], 8),
('d0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000017', 'Mango Lassi', 'Chilled mango yoghurt drink', 130, 'https://placehold.co/640x480/png?text=Mango%20Lassi', true, true, array['cold'], 4),
('d0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000033', 'c0000000-0000-0000-0000-000000000031', 'Koliwada Prawns', 'Crisp prawns with chilli garlic dust', 520, 'https://placehold.co/640x480/png?text=Koliwada%20Prawns', false, true, array['seafood','popular'], 18),
('d0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000033', 'c0000000-0000-0000-0000-000000000032', 'Tandoori Pomfret', 'Whole pomfret grilled with coastal masala', 780, 'https://placehold.co/640x480/png?text=Tandoori%20Pomfret', false, true, array['grill','premium'], 32),
('d0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000033', 'c0000000-0000-0000-0000-000000000033', 'Malabar Vegetable Stew', 'Coconut stew with appam crisps', 360, 'https://placehold.co/640x480/png?text=Vegetable%20Stew', true, true, array['veg','coastal'], 24),
('d0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000033', 'c0000000-0000-0000-0000-000000000034', 'Tender Coconut Payasam', 'Chilled coconut payasam with toasted cashew', 240, 'https://placehold.co/640x480/png?text=Coconut%20Payasam', true, true, array['dessert'], 8),
('d0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000044', 'c0000000-0000-0000-0000-000000000041', 'Korean Paneer Bowl', 'Sticky gochujang paneer, rice, kimchi slaw', 310, 'https://placehold.co/640x480/png?text=Korean%20Paneer%20Bowl', true, true, array['bowl','veg'], 14),
('d0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000044', 'c0000000-0000-0000-0000-000000000041', 'Peri Peri Chicken Bowl', 'Grilled chicken, spiced rice, charred corn', 340, 'https://placehold.co/640x480/png?text=Peri%20Peri%20Bowl', false, true, array['bowl','popular'], 16),
('d0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000044', 'c0000000-0000-0000-0000-000000000042', 'Falafel Hummus Wrap', 'Warm pita wrap with falafel, hummus, pickles', 260, 'https://placehold.co/640x480/png?text=Falafel%20Wrap', true, true, array['wrap','veg'], 10),
('d0000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000044', 'c0000000-0000-0000-0000-000000000043', 'Iced Kokum Spritz', 'Kokum, lime, soda, and mint', 120, 'https://placehold.co/640x480/png?text=Kokum%20Spritz', true, true, array['drink'], 3)
on conflict (id) do nothing;

insert into branch_dishes (branch_id, dish_id, custom_price, is_available)
select 'b0000000-0000-0000-0000-000000000011', id, null, true from dishes where org_id = 'a0000000-0000-0000-0000-000000000011'
on conflict (branch_id, dish_id) do update set custom_price = excluded.custom_price, is_available = excluded.is_available;

insert into branch_dishes (branch_id, dish_id, custom_price, is_available)
select 'b0000000-0000-0000-0000-000000000099', id, null, id <> 'd0000000-0000-0000-0000-000000000022' from dishes where org_id = 'a0000000-0000-0000-0000-000000000099'
on conflict (branch_id, dish_id) do update set custom_price = excluded.custom_price, is_available = excluded.is_available;

insert into branch_dishes (branch_id, dish_id, custom_price, is_available)
select 'b0000000-0000-0000-0000-000000000331', id, null, true from dishes where org_id = 'a0000000-0000-0000-0000-000000000033'
on conflict (branch_id, dish_id) do update set custom_price = excluded.custom_price, is_available = excluded.is_available;

insert into branch_dishes (branch_id, dish_id, custom_price, is_available)
select 'b0000000-0000-0000-0000-000000000332', id, case when id = 'd0000000-0000-0000-0000-000000000032' then 820 else null end, id <> 'd0000000-0000-0000-0000-000000000031' from dishes where org_id = 'a0000000-0000-0000-0000-000000000033'
on conflict (branch_id, dish_id) do update set custom_price = excluded.custom_price, is_available = excluded.is_available;

insert into branch_dishes (branch_id, dish_id, custom_price, is_available)
select 'b0000000-0000-0000-0000-000000000044', id, null, true from dishes where org_id = 'a0000000-0000-0000-0000-000000000044'
on conflict (branch_id, dish_id) do update set custom_price = excluded.custom_price, is_available = excluded.is_available;

insert into tables (branch_id, table_number, label, capacity, status, qr_code_url, is_active)
values
('b0000000-0000-0000-0000-000000000011', 1, 'Window 1', 2, 'available', '/order/b0000000-0000-0000-0000-000000000011/1', true),
('b0000000-0000-0000-0000-000000000011', 2, 'Tea Nook', 4, 'occupied', '/order/b0000000-0000-0000-0000-000000000011/2', true),
('b0000000-0000-0000-0000-000000000011', 3, 'Community Table', 6, 'reserved', '/order/b0000000-0000-0000-0000-000000000011/3', true),
('b0000000-0000-0000-0000-000000000099', 1, 'Window 1', 4, 'available', '/order/b0000000-0000-0000-0000-000000000099/1', true),
('b0000000-0000-0000-0000-000000000099', 2, 'Window 2', 4, 'occupied', '/order/b0000000-0000-0000-0000-000000000099/2', true),
('b0000000-0000-0000-0000-000000000099', 3, 'Family', 6, 'available', '/order/b0000000-0000-0000-0000-000000000099/3', true),
('b0000000-0000-0000-0000-000000000099', 4, 'Patio', 4, 'reserved', '/order/b0000000-0000-0000-0000-000000000099/4', true),
('b0000000-0000-0000-0000-000000000331', 1, 'Sea View 1', 4, 'occupied', '/order/b0000000-0000-0000-0000-000000000331/1', true),
('b0000000-0000-0000-0000-000000000331', 2, 'Sea View 2', 4, 'available', '/order/b0000000-0000-0000-0000-000000000331/2', true),
('b0000000-0000-0000-0000-000000000332', 1, 'Courtyard 1', 4, 'available', '/order/b0000000-0000-0000-0000-000000000332/1', true),
('b0000000-0000-0000-0000-000000000332', 2, 'Courtyard 2', 6, 'occupied', '/order/b0000000-0000-0000-0000-000000000332/2', true),
('b0000000-0000-0000-0000-000000000044', 1, 'Pickup Counter A', 1, 'available', '/order/b0000000-0000-0000-0000-000000000044/1', true),
('b0000000-0000-0000-0000-000000000044', 2, 'Pickup Counter B', 1, 'occupied', '/order/b0000000-0000-0000-0000-000000000044/2', true)
on conflict (branch_id, table_number) do update set label = excluded.label, capacity = excluded.capacity, status = excluded.status, qr_code_url = excluded.qr_code_url, is_active = excluded.is_active;

insert into orders (id, order_number, branch_id, table_number, customer_name, customer_phone, waiter_id, order_type, order_source, status, subtotal, tax, discount, total, notes, created_at)
values
('f0000000-0000-0000-0000-000000000011', 'LTR-1001', 'b0000000-0000-0000-0000-000000000011', 2, 'Cafe guest', null, '50000000-0000-0000-0000-000000000001', 'dine_in', 'waiter', 'confirmed', 300, 14.29, 0, 300, 'No sugar in one chai', now() - interval '12 minutes'),
('f0000000-0000-0000-0000-000000000012', 'LTR-1002', 'b0000000-0000-0000-0000-000000000011', null, 'Pickup guest', null, null, 'takeaway', 'cashier', 'paid', 160, 7.62, 0, 160, 'Packed for pickup', now() - interval '1 hour'),
('f0000000-0000-0000-0000-000000000021', 'MW-2201', 'b0000000-0000-0000-0000-000000000099', 2, 'Table guest', null, '50000000-0000-0000-0000-000000000004', 'dine_in', 'waiter', 'pending', 580, 27.62, 0, 580, 'Less spicy', now() - interval '8 minutes'),
('f0000000-0000-0000-0000-000000000022', 'MW-2202', 'b0000000-0000-0000-0000-000000000099', 4, 'QR guest', null, null, 'dine_in', 'qr_customer', 'preparing', 420, 20, 0, 420, null, now() - interval '18 minutes'),
('f0000000-0000-0000-0000-000000000023', 'MW-2203', 'b0000000-0000-0000-0000-000000000099', null, 'Takeaway guest', null, null, 'takeaway', 'cashier', 'ready', 390, 18.57, 0, 390, null, now() - interval '28 minutes'),
('f0000000-0000-0000-0000-000000000031', 'HSG-COL-3301', 'b0000000-0000-0000-0000-000000000331', 1, 'Dining guest', null, '50000000-0000-0000-0000-000000000003', 'dine_in', 'waiter', 'ready', 1300, 65, 0, 1365, 'Fire table mains together', now() - interval '36 minutes'),
('f0000000-0000-0000-0000-000000000032', 'HSG-BAN-3302', 'b0000000-0000-0000-0000-000000000332', 2, 'Courtyard guest', null, null, 'dine_in', 'qr_customer', 'served', 600, 30, 50, 580, 'Anniversary dessert plate', now() - interval '2 hours'),
('f0000000-0000-0000-0000-000000000033', 'HSG-COL-3303', 'b0000000-0000-0000-0000-000000000331', null, 'Bar pickup', null, null, 'takeaway', 'cashier', 'cancelled', 520, 26, 0, 546, 'Guest cancelled before prep', now() - interval '3 hours'),
('f0000000-0000-0000-0000-000000000041', 'NOB-4401', 'b0000000-0000-0000-0000-000000000044', 2, 'Pickup guest', null, '50000000-0000-0000-0000-000000000006', 'takeaway', 'cashier', 'preparing', 650, 30.95, 0, 650, 'Two separate bags', now() - interval '10 minutes'),
('f0000000-0000-0000-0000-000000000042', 'NOB-4402', 'b0000000-0000-0000-0000-000000000044', null, 'Delivery guest', null, null, 'delivery', 'cashier', 'served', 430, 20.48, 0, 430, 'Partner pickup completed', now() - interval '55 minutes'),
('f0000000-0000-0000-0000-000000000043', 'NOB-4403', 'b0000000-0000-0000-0000-000000000044', null, 'Retry guest', null, '50000000-0000-0000-0000-000000000006', 'takeaway', 'cashier', 'failed', 340, 16.19, 0, 340, 'Payment failed, awaiting retry', now() - interval '24 minutes')
on conflict (id) do nothing;

insert into order_items (id, order_id, branch_id, dish_id, dish_name, quantity, price_at_order, notes, status)
values
('90000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000012', 'Masala Chai Flask', 2, 150, 'One without sugar', 'accepted'),
('90000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000014', 'Millet Upma Bowl', 1, 160, null, 'served'),
('90000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000099', 'd0000000-0000-0000-0000-000000000021', 'Paneer Tikka', 1, 260, null, 'pending'),
('90000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000099', 'd0000000-0000-0000-0000-000000000022', 'Chicken 65', 1, 320, 'Less chilli', 'pending'),
('90000000-0000-0000-0000-000000000023', 'f0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000099', 'd0000000-0000-0000-0000-000000000023', 'Dal Makhani', 1, 280, null, 'preparing'),
('90000000-0000-0000-0000-000000000024', 'f0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000099', 'd0000000-0000-0000-0000-000000000025', 'Garlic Naan', 2, 70, null, 'preparing'),
('90000000-0000-0000-0000-000000000025', 'f0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000099', 'd0000000-0000-0000-0000-000000000024', 'Butter Chicken', 1, 390, null, 'ready'),
('90000000-0000-0000-0000-000000000031', 'f0000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000331', 'd0000000-0000-0000-0000-000000000031', 'Koliwada Prawns', 1, 520, null, 'ready'),
('90000000-0000-0000-0000-000000000032', 'f0000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000331', 'd0000000-0000-0000-0000-000000000032', 'Tandoori Pomfret', 1, 780, null, 'ready'),
('90000000-0000-0000-0000-000000000033', 'f0000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000332', 'd0000000-0000-0000-0000-000000000033', 'Malabar Vegetable Stew', 1, 360, null, 'served'),
('90000000-0000-0000-0000-000000000034', 'f0000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000332', 'd0000000-0000-0000-0000-000000000034', 'Tender Coconut Payasam', 1, 240, 'Anniversary message', 'served'),
('90000000-0000-0000-0000-000000000035', 'f0000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000331', 'd0000000-0000-0000-0000-000000000031', 'Koliwada Prawns', 1, 520, null, 'cancelled'),
('90000000-0000-0000-0000-000000000041', 'f0000000-0000-0000-0000-000000000041', 'b0000000-0000-0000-0000-000000000044', 'd0000000-0000-0000-0000-000000000041', 'Korean Paneer Bowl', 1, 310, null, 'preparing'),
('90000000-0000-0000-0000-000000000042', 'f0000000-0000-0000-0000-000000000041', 'b0000000-0000-0000-0000-000000000044', 'd0000000-0000-0000-0000-000000000042', 'Peri Peri Chicken Bowl', 1, 340, 'Extra sauce', 'preparing'),
('90000000-0000-0000-0000-000000000043', 'f0000000-0000-0000-0000-000000000042', 'b0000000-0000-0000-0000-000000000044', 'd0000000-0000-0000-0000-000000000043', 'Falafel Hummus Wrap', 1, 260, null, 'served'),
('90000000-0000-0000-0000-000000000044', 'f0000000-0000-0000-0000-000000000042', 'b0000000-0000-0000-0000-000000000044', 'd0000000-0000-0000-0000-000000000044', 'Iced Kokum Spritz', 1, 120, null, 'served'),
('90000000-0000-0000-0000-000000000045', 'f0000000-0000-0000-0000-000000000043', 'b0000000-0000-0000-0000-000000000044', 'd0000000-0000-0000-0000-000000000042', 'Peri Peri Chicken Bowl', 1, 340, null, 'pending')
on conflict (id) do nothing;

insert into payments (id, order_id, branch_id, amount, method, status, transaction_id, provider_data, created_at)
values
('70000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000011', 160, 'cash', 'completed', 'CASH-LTR-1002', '{"settled_by":"cashier"}'::jsonb, now() - interval '50 minutes'),
('70000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000099', 580, 'upi', 'pending', null, '{}', now() - interval '8 minutes'),
('70000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000099', 420, 'razorpay', 'pending', 'rzp_order_demo_mw_2202', '{"provider_order_id":"rzp_order_demo_mw_2202"}'::jsonb, now() - interval '17 minutes'),
('70000000-0000-0000-0000-000000000023', 'f0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000099', 390, 'upi', 'completed', 'UPI-MW-2203', '{}', now() - interval '26 minutes'),
('70000000-0000-0000-0000-000000000031', 'f0000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000331', 1365, 'card', 'completed', 'CARD-HSG-3301', '{"last4":"4242","network":"demo"}'::jsonb, now() - interval '30 minutes'),
('70000000-0000-0000-0000-000000000032', 'f0000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000332', 580, 'upi', 'completed', 'UPI-HSG-3302', '{}', now() - interval '90 minutes'),
('70000000-0000-0000-0000-000000000033', 'f0000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000331', 546, 'razorpay', 'refunded', 'rzp_pay_refunded_demo', '{"refund_id":"rfnd_demo_3303","reason":"guest_cancelled"}'::jsonb, now() - interval '2 hours'),
('70000000-0000-0000-0000-000000000041', 'f0000000-0000-0000-0000-000000000041', 'b0000000-0000-0000-0000-000000000044', 650, 'upi', 'pending', null, '{}', now() - interval '9 minutes'),
('70000000-0000-0000-0000-000000000042', 'f0000000-0000-0000-0000-000000000042', 'b0000000-0000-0000-0000-000000000044', 430, 'razorpay', 'completed', 'rzp_pay_demo_nob_4402', '{"provider_order_id":"rzp_order_demo_nob_4402"}'::jsonb, now() - interval '48 minutes'),
('70000000-0000-0000-0000-000000000043', 'f0000000-0000-0000-0000-000000000043', 'b0000000-0000-0000-0000-000000000044', 340, 'razorpay', 'failed', 'rzp_pay_failed_demo', '{"failure_reason":"bank_declined"}'::jsonb, now() - interval '22 minutes')
on conflict (id) do nothing;

insert into subscriptions (id, org_id, plan, status, razorpay_subscription_id, current_period_start, current_period_end)
values
('60000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'starter', 'trial', null, now() - interval '3 days', now() + interval '11 days'),
('60000000-0000-0000-0000-000000000099', 'a0000000-0000-0000-0000-000000000099', 'growth', 'active', 'sub_demo_masala_growth', now() - interval '12 days', now() + interval '18 days'),
('60000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000033', 'enterprise', 'active', 'sub_demo_harbour_enterprise', now() - interval '20 days', now() + interval '10 days'),
('60000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000044', 'pro', 'active', 'sub_demo_nightowl_pro', now() - interval '5 days', now() + interval '25 days')
on conflict (id) do nothing;

insert into feedback (id, order_id, branch_id, rating, comment, created_at)
values
('80000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000011', 5, 'Fast pickup and fresh breakfast.', now() - interval '45 minutes'),
('80000000-0000-0000-0000-000000000023', 'f0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000099', 4, 'Good packaging, naan stayed warm.', now() - interval '20 minutes'),
('80000000-0000-0000-0000-000000000031', 'f0000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000331', 5, 'Seafood was perfectly timed.', now() - interval '24 minutes'),
('80000000-0000-0000-0000-000000000032', 'f0000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000332', 5, 'Staff remembered the celebration note.', now() - interval '70 minutes'),
('80000000-0000-0000-0000-000000000042', 'f0000000-0000-0000-0000-000000000042', 'b0000000-0000-0000-0000-000000000044', 4, 'Late night delivery was quick.', now() - interval '35 minutes')
on conflict (id) do nothing;

insert into activity_logs (id, org_id, branch_id, staff_id, action, entity_type, entity_id, metadata, created_at)
values
('10000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000001', 'order.confirmed', 'order', 'f0000000-0000-0000-0000-000000000011', '{"source":"waiter_pos"}'::jsonb, now() - interval '10 minutes'),
('10000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000099', 'b0000000-0000-0000-0000-000000000099', '50000000-0000-0000-0000-000000000004', 'table.marked_occupied', 'table', null, '{"table_number":2}'::jsonb, now() - interval '7 minutes'),
('10000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000331', '50000000-0000-0000-0000-000000000003', 'manager.override_discount', 'order', 'f0000000-0000-0000-0000-000000000032', '{"discount":50,"reason":"anniversary"}'::jsonb, now() - interval '80 minutes'),
('10000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000044', 'b0000000-0000-0000-0000-000000000044', '50000000-0000-0000-0000-000000000006', 'payment.failed', 'payment', '70000000-0000-0000-0000-000000000043', '{"provider":"razorpay","retry_available":true}'::jsonb, now() - interval '21 minutes'),
('10000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000044', 'b0000000-0000-0000-0000-000000000044', '50000000-0000-0000-0000-000000000006', 'item.marked_out_of_stock', 'dish', 'd0000000-0000-0000-0000-000000000042', '{"expected_back":"tomorrow"}'::jsonb, now() - interval '2 hours')
on conflict (id) do nothing;
