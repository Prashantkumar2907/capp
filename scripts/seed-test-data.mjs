// Test script: Sign up test users and seed data
// Run: node scripts/seed-test-data.mjs

const SUPABASE_URL = "https://svlpvbanlxohisptpona.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2bHB2YmFubHhvaGlzcHRwb25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMDQ2NTMsImV4cCI6MjA4NzY4MDY1M30.zqYQjlrmom_8HVP7LYHupYnIDfHo6Sib48mZUqRq49s";

async function supabaseRequest(path, body, token) {
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  else headers["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;

  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

async function supabaseGet(path, token) {
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${token || SUPABASE_ANON_KEY}`,
  };
  const res = await fetch(`${SUPABASE_URL}${path}`, { headers });
  return res.json();
}

async function supabaseRest(table, body, token) {
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${token}`,
    "Prefer": "return=representation",
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`  ❌ Insert into ${table} failed:`, JSON.stringify(data));
    return null;
  }
  return data;
}

async function supabaseRestGet(table, query, token) {
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${token}`,
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
  return res.json();
}

async function main() {
  console.log("🔧 RestaurantOS Test Seed Script");
  console.log("================================\n");

  // Step 1: Sign up owner
  console.log("1️⃣  Signing up owner@test.com...");
  const signUpRes = await supabaseRequest("/auth/v1/signup", {
    email: "owner@test.com",
    password: "Test@1234",
    data: { full_name: "Test Owner" },
  });

  if (signUpRes.error) {
    console.log(`   ⚠️  ${signUpRes.error.message || signUpRes.msg}`);
    // Try logging in instead
    console.log("   Trying login...");
  }

  // Login as owner
  console.log("   Logging in as owner@test.com...");
  const loginRes = await supabaseRequest("/auth/v1/token?grant_type=password", {
    email: "owner@test.com",
    password: "Test@1234",
  });

  if (loginRes.error || loginRes.error_description) {
    console.error("   ❌ Login failed:", loginRes.error_description || loginRes.error || loginRes.msg);
    console.log("\n💡 Please sign up manually at http://localhost:3000/sign-up with:");
    console.log("   Email: owner@test.com");
    console.log("   Password: Test@1234");
    console.log("   Then complete onboarding, and run this script again.");
    process.exit(1);
  }

  const ownerToken = loginRes.access_token;
  const ownerUserId = loginRes.user.id;
  console.log(`   ✅ Logged in as owner (${ownerUserId})`);

  // Step 2: Check if org exists
  let orgs = await supabaseRestGet("organizations", "select=*&limit=1", ownerToken);

  let orgId, branchId;

  if (!orgs || orgs.length === 0) {
    // Create org
    console.log("\n2️⃣  Creating organization...");
    const orgData = await supabaseRest("organizations", {
      name: "Test Restaurant",
      slug: "test-restaurant",
    }, ownerToken);

    if (!orgData) {
      console.log("   ❌ Failed to create org. RLS may be blocking. Run onboarding manually.");
      process.exit(1);
    }
    orgId = orgData[0].id;

    // Create branch
    const branchData = await supabaseRest("branches", {
      org_id: orgId,
      name: "Main Branch",
      table_count: 10,
    }, ownerToken);
    branchId = branchData[0].id;

    // Create owner staff record
    await supabaseRest("staff", {
      user_id: ownerUserId,
      org_id: orgId,
      branch_id: branchId,
      role: "owner",
      full_name: "Test Owner",
      email: "owner@test.com",
    }, ownerToken);
    console.log(`   ✅ Org: ${orgId}, Branch: ${branchId}`);
  } else {
    orgId = orgs[0].id;
    let branches = await supabaseRestGet("branches", `select=*&org_id=eq.${orgId}&limit=1`, ownerToken);
    branchId = branches[0].id;
    console.log(`\n2️⃣  Existing org found: ${orgId}, branch: ${branchId}`);
  }

  // Step 3: Seed categories
  console.log("\n3️⃣  Seeding categories...");
  const catNames = ["Starters", "Main Course", "Breads", "Desserts", "Beverages"];
  const existingCats = await supabaseRestGet("categories", `select=*&org_id=eq.${orgId}`, ownerToken);

  let categories = {};
  if (existingCats && existingCats.length >= 5) {
    console.log("   Categories already exist, skipping...");
    existingCats.forEach(c => categories[c.name] = c.id);
  } else {
    for (let i = 0; i < catNames.length; i++) {
      const cat = await supabaseRest("categories", {
        org_id: orgId, name: catNames[i], sort_order: i + 1,
      }, ownerToken);
      if (cat) categories[catNames[i]] = cat[0].id;
    }
    console.log(`   ✅ Created ${Object.keys(categories).length} categories`);
  }

  // Step 4: Seed dishes
  console.log("\n4️⃣  Seeding dishes...");
  const existingDishes = await supabaseRestGet("dishes", `select=id&org_id=eq.${orgId}`, ownerToken);
  if (existingDishes && existingDishes.length >= 10) {
    console.log("   Dishes already exist, skipping...");
  } else {
    const dishes = [
      { category: "Starters", name: "Paneer Tikka", price: 249, is_veg: true },
      { category: "Starters", name: "Chicken 65", price: 299, is_veg: false },
      { category: "Starters", name: "Veg Manchurian", price: 199, is_veg: true },
      { category: "Starters", name: "Crispy Corn", price: 179, is_veg: true },
      { category: "Main Course", name: "Butter Chicken", price: 349, is_veg: false },
      { category: "Main Course", name: "Dal Makhani", price: 249, is_veg: true },
      { category: "Main Course", name: "Palak Paneer", price: 269, is_veg: true },
      { category: "Main Course", name: "Chicken Biryani", price: 299, is_veg: false },
      { category: "Main Course", name: "Veg Biryani", price: 249, is_veg: true },
      { category: "Main Course", name: "Chole Bhature", price: 199, is_veg: true },
      { category: "Breads", name: "Butter Naan", price: 49, is_veg: true },
      { category: "Breads", name: "Garlic Naan", price: 59, is_veg: true },
      { category: "Breads", name: "Tandoori Roti", price: 39, is_veg: true },
      { category: "Desserts", name: "Gulab Jamun", price: 99, is_veg: true },
      { category: "Desserts", name: "Rasmalai", price: 129, is_veg: true },
      { category: "Beverages", name: "Masala Chai", price: 49, is_veg: true },
      { category: "Beverages", name: "Sweet Lassi", price: 79, is_veg: true },
      { category: "Beverages", name: "Cold Coffee", price: 99, is_veg: true },
    ];

    let count = 0;
    for (const d of dishes) {
      const result = await supabaseRest("dishes", {
        org_id: orgId,
        category_id: categories[d.category],
        name: d.name,
        price: d.price,
        is_veg: d.is_veg,
      }, ownerToken);
      if (result) count++;
    }
    console.log(`   ✅ Created ${count} dishes`);
  }

  // Step 5: Seed tables
  console.log("\n5️⃣  Seeding tables...");
  const existingTables = await supabaseRestGet("tables", `select=id&branch_id=eq.${branchId}`, ownerToken);
  if (existingTables && existingTables.length >= 5) {
    console.log("   Tables already exist, skipping...");
  } else {
    const tables = [
      { table_number: 1, capacity: 4 },
      { table_number: 2, capacity: 4 },
      { table_number: 3, capacity: 6 },
      { table_number: 4, capacity: 6 },
      { table_number: 5, capacity: 2 },
      { table_number: 6, capacity: 8 },
      { table_number: 7, capacity: 4 },
      { table_number: 8, capacity: 4 },
      { table_number: 9, capacity: 4 },
      { table_number: 10, capacity: 2 },
    ];
    let count = 0;
    for (const t of tables) {
      const result = await supabaseRest("tables", { branch_id: branchId, ...t }, ownerToken);
      if (result) count++;
    }
    console.log(`   ✅ Created ${count} tables`);
  }

  // Step 6: Create additional test users
  const testUsers = [
    { email: "kitchen@test.com", password: "Test@1234", name: "Kitchen Staff", role: "kitchen" },
    { email: "waiter@test.com", password: "Test@1234", name: "Waiter Staff", role: "waiter" },
    { email: "admin@test.com", password: "Test@1234", name: "Branch Admin", role: "admin" },
  ];

  console.log("\n6️⃣  Creating additional test users...");
  for (const u of testUsers) {
    // Sign up
    await supabaseRequest("/auth/v1/signup", {
      email: u.email,
      password: u.password,
      data: { full_name: u.name },
    });

    // Login
    const login = await supabaseRequest("/auth/v1/token?grant_type=password", {
      email: u.email,
      password: u.password,
    });

    if (login.access_token) {
      // Check if staff record exists
      const existing = await supabaseRestGet("staff", `select=id&email=eq.${u.email}`, ownerToken);
      if (!existing || existing.length === 0) {
        await supabaseRest("staff", {
          user_id: login.user.id,
          org_id: orgId,
          branch_id: branchId,
          role: u.role,
          full_name: u.name,
          email: u.email,
        }, ownerToken);
        console.log(`   ✅ ${u.role}: ${u.email}`);
      } else {
        console.log(`   ⏭️  ${u.role}: ${u.email} (already exists)`);
      }
    } else {
      console.log(`   ⚠️  Could not create ${u.email}: ${login.error_description || "signup/login failed"}`);
    }
  }

  console.log("\n================================");
  console.log("✅ Seed complete! Test credentials:");
  console.log("================================");
  console.log("Owner:    owner@test.com    / Test@1234");
  console.log("Kitchen:  kitchen@test.com  / Test@1234");
  console.log("Waiter:   waiter@test.com   / Test@1234");
  console.log("Admin:    admin@test.com    / Test@1234");
  console.log("\n🌐 Open http://localhost:3000 and sign in with any account above.");
}

main().catch(console.error);
