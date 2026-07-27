import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iwumijeizbsyiakadwls.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dW1pamVpemJzeWlha2Fkd2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNzgyMDEsImV4cCI6MjEwMDY1NDIwMX0.RJMHaOXfKrQbBY3_uabxfHjEcq3vTa7w2mRduNke0lg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log('Seeding Supabase user accounts...');
  
  // Upsert user/user and admin/admin
  const { data, error } = await supabase.from('vault_users').upsert([
    { username: 'admin', passkey: 'admin', role: 'Admin', status: 'Active' },
    { username: 'user', passkey: 'user', role: 'User', status: 'Active' }
  ], { onConflict: 'username' }).select();

  if (error) {
    console.error('Error seeding users:', error.message);
  } else {
    console.log('Successfully seeded users:', data);
  }
}

seed();
