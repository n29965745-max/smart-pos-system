const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://xqnteamrznvoqgaazhpu.supabase.co',
  'REDACTED_JWT_TOKEN'
);

async function reimportData() {
  console.log('Reading export file...');
  const data = JSON.parse(fs.readFileSync('database-export.json', 'utf8'));

  // Clear existing data
  console.log('Clearing existing data...');
  await supabase.from('transaction_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('returns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('debts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Import products with correct mapping
  console.log(`Importing ${data.products.length} products...`);
  const products = data.products.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    cost_price: p.cost_price || p.price * 0.6,
    retail_price: p.retail_price || p.price,
    wholesale_price: p.wholesale_price || p.price * 0.85,
    stock_quantity: p.stock || p.stock_quantity || 0,
    minimum_stock_level: p.minimum_stock_level || 10,
    status: p.status === 'Active' ? 'active' : 'inactive',
    variant_of: p.variant_of,
    image_url: p.image_url,
    description: p.description,
    barcode: p.barcode,
    created_at: p.created_at,
    updated_at: p.updated_at
  }));

  for (let i = 0; i < products.length; i += 50) {
    const batch = products.slice(i, i + 50);
    const { error } = await supabase.from('products').insert(batch);
    if (error) console.error('Product batch error:', error);
    else console.log(`Imported products ${i + 1}-${Math.min(i + 50, products.length)}`);
  }

  // Import customers
  console.log(`Importing ${data.customers.length} customers...`);
  const customers = data.customers.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    customer_type: c.customer_type || 'retail',
    credit_limit: c.credit_limit || 0,
    debt_limit: c.debt_limit || 0,
    balance: c.balance || 0,
    status: c.status === 'Active' ? 'active' : 'inactive',
    created_at: c.created_at,
    updated_at: c.updated_at
  }));

  for (let i = 0; i < customers.length; i += 50) {
    const batch = customers.slice(i, i + 50);
    const { error } = await supabase.from('customers').insert(batch);
    if (error) console.error('Customer batch error:', error);
    else console.log(`Imported customers ${i + 1}-${Math.min(i + 50, customers.length)}`);
  }

  // Import transactions if they exist
  if (data.transactions && data.transactions.length > 0) {
    console.log(`Importing ${data.transactions.length} transactions...`);
    for (let i = 0; i < data.transactions.length; i += 50) {
      const batch = data.transactions.slice(i, i + 50);
      const { error } = await supabase.from('transactions').insert(batch);
      if (error) console.error('Transaction batch error:', error);
      else console.log(`Imported transactions ${i + 1}-${Math.min(i + 50, data.transactions.length)}`);
    }
  }

  console.log('✅ Data reimport complete!');
}

reimportData().catch(console.error);
