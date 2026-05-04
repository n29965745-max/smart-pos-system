import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId } = req;
  const db = getAdminDb();
  if (req.method !== 'GET') {
    return res.status(405).json([]);
  }

  // Default categories to return if database fails
  const defaultCategories = [
    { id: 1, name: 'Rent', is_active: true },
    { id: 2, name: 'Utilities', is_active: true },
    { id: 3, name: 'Salaries', is_active: true },
    { id: 4, name: 'Marketing', is_active: true },
    { id: 5, name: 'Supplies', is_active: true },
    { id: 6, name: 'Transportation', is_active: true },
    { id: 7, name: 'Insurance', is_active: true },
    { id: 8, name: 'Maintenance', is_active: true },
    { id: 9, name: 'Professional Services', is_active: true },
    { id: 10, name: 'Inventory Purchase', is_active: true },
    { id: 11, name: 'Food & Dining', is_active: true },
    { id: 12, name: 'Entertainment', is_active: true },
    { id: 13, name: 'Healthcare', is_active: true },
    { id: 14, name: 'Education', is_active: true },
    { id: 15, name: 'Miscellaneous', is_active: true }
  ];

  try {
    // Try to get from database first
    const { data: categories, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    // If any error, return default categories
    if (error) {
      console.log('Using default categories, database error:', error.message);
      return res.status(200).json(defaultCategories);
    }

    return res.status(200).json(categories || defaultCategories);
  } catch (error: any) {
    console.error('Categories error:', error);
    // Always return array, never error object
    return res.status(200).json(defaultCategories);
  }
});
