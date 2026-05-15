#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const NEW_SUPABASE_URL = 'https://xqnteamrznvoqgaazhpu.supabase.co';
const NEW_SUPABASE_KEY = "REDACTED_JWT_TOKEN";

const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

const exports = JSON.parse(fs.readFileSync('database-export.json', 'utf8'));

console.log('📦 Importing remaining tables...\n');

// Debts
console.log('1. Debts...');
const debts = exports.debts.map(d => ({
  customer_id: d.customer_id,
  customer_name: d.customer_name,
  sale_id: d.sale_id,
  total_amount: parseFloat(d.total_amount),
  amount_paid: parseFloat(d.amount_paid || 0),
  amount_remaining: parseFloat(d.amount_remaining),
  status: d.status,
  due_date: d.due_date,
  notes: d.notes
}));

const { error: debtsError } = await supabase.from('debts').insert(debts);
if (debtsError) console.log('   ❌', debtsError.message);
else console.log('   ✅ 4 debts imported');

// Returns
console.log('2. Returns...');
const returns = exports.returns.map(r => ({
  return_number: r.return_number,
  customer_id: r.customer_id,
  customer_name: r.customer_name,
  total_amount: parseFloat(r.amount || r.total_amount),
  reason: r.reason,
  status: r.status,
  notes: r.notes
}));

const { error: returnsError } = await supabase.from('returns').insert(returns);
if (returnsError) console.log('   ❌', returnsError.message);
else console.log('   ✅ 18 returns imported');

// Expenses
console.log('3. Expenses...');
const expenses = exports.expenses.map(e => ({
  category: e.category,
  amount: parseFloat(e.amount),
  description: e.description,
  date: e.date
}));

const { error: expensesError } = await supabase.from('expenses').insert(expenses);
if (expensesError) console.log('   ❌', expensesError.message);
else console.log('   ✅ 10 expenses imported');

console.log('\n✅ Done!');
