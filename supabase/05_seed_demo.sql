insert into organizations (id, name, slug, restaurant_type, default_tax_percent, tax_inclusive, plan, subscription_status)
values ('a0000000-0000-0000-0000-000000000099', 'Demo Restaurant', 'demo-restaurant', 'multi-cuisine', 5, true, 'pro', 'active')
on conflict (id) do nothing;

insert into branches (id, org_id, name, address, city, phone, upi_vpa, table_count)
values ('b0000000-0000-0000-0000-000000000099', 'a0000000-0000-0000-0000-000000000099', 'Main Branch', 'Market Road', 'Bengaluru', '+91 90000 00000', 'demo@upi', 10)
on conflict (id) do nothing;

insert into categories (id, org_id, name, sort_order) values
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000099', 'Starters', 1),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000099', 'Mains', 2),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000099', 'Breads', 3),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000099', 'Beverages', 4)
on conflict (id) do nothing;

insert into dishes (id, org_id, category_id, name, description, price, is_veg, prep_time_mins, tags) values
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000001', 'Paneer Tikka', 'Charred cottage cheese, peppers, mint chutney', 260, true, 18, array['popular','veg']),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000001', 'Chicken 65', 'Crisp chicken tossed with curry leaves', 320, false, 22, array['spicy']),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000002', 'Dal Makhani', 'Slow simmered black lentils', 280, true, 30, array['veg']),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000002', 'Butter Chicken', 'Creamy tomato gravy with tandoori chicken', 390, false, 28, array['popular']),
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000003', 'Garlic Naan', 'Tandoor naan with garlic butter', 70, true, 8, array['bread']),
('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000004', 'Mango Lassi', 'Chilled mango yoghurt drink', 130, true, 4, array['cold'])
on conflict (id) do nothing;

insert into branch_dishes (branch_id, dish_id, is_available)
select 'b0000000-0000-0000-0000-000000000099', id, true from dishes where org_id = 'a0000000-0000-0000-0000-000000000099'
on conflict (branch_id, dish_id) do nothing;

insert into tables (id, branch_id, table_number, label, capacity, status) values
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000099', 1, 'Window 1', 4, 'available'),
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000099', 2, 'Window 2', 4, 'occupied'),
('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000099', 3, 'Family', 6, 'available'),
('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000099', 4, 'Patio', 4, 'reserved'),
('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000099', 5, 'Corner', 2, 'available')
on conflict (id) do nothing;

insert into orders (id, order_number, branch_id, table_number, order_type, order_source, status, subtotal, tax, total, notes, created_at) values
('f0000000-0000-0000-0000-000000000001', 'ORD-DEMO-001', 'b0000000-0000-0000-0000-000000000099', 2, 'dine_in', 'waiter', 'pending', 580, 0, 580, 'Less spicy', now() - interval '8 minutes'),
('f0000000-0000-0000-0000-000000000002', 'ORD-DEMO-002', 'b0000000-0000-0000-0000-000000000099', 4, 'dine_in', 'qr_customer', 'preparing', 460, 0, 460, null, now() - interval '18 minutes'),
('f0000000-0000-0000-0000-000000000003', 'ORD-DEMO-003', 'b0000000-0000-0000-0000-000000000099', null, 'takeaway', 'cashier', 'ready', 390, 0, 390, null, now() - interval '28 minutes')
on conflict (id) do nothing;

insert into order_items (order_id, branch_id, dish_id, dish_name, quantity, price_at_order, status) values
('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000099', 'd0000000-0000-0000-0000-000000000001', 'Paneer Tikka', 1, 260, 'pending'),
('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000099', 'd0000000-0000-0000-0000-000000000002', 'Chicken 65', 1, 320, 'pending'),
('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000099', 'd0000000-0000-0000-0000-000000000003', 'Dal Makhani', 1, 280, 'preparing'),
('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000099', 'd0000000-0000-0000-0000-000000000005', 'Garlic Naan', 2, 70, 'preparing'),
('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000099', 'd0000000-0000-0000-0000-000000000004', 'Butter Chicken', 1, 390, 'ready')
on conflict do nothing;

insert into payments (order_id, branch_id, amount, method, status, transaction_id) values
('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000099', 390, 'upi', 'completed', 'UPI-DEMO-003')
on conflict do nothing;

insert into subscriptions (org_id, plan, status, current_period_start, current_period_end)
values ('a0000000-0000-0000-0000-000000000099', 'pro', 'active', now(), now() + interval '30 days')
on conflict do nothing;
