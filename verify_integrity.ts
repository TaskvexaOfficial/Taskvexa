import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vvnnqigneoeamfantxnk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const client = createClient(supabaseUrl, supabaseServiceKey);

async function verifyIntegrity() {
  console.log("=== Verifying Referral Earnings Database Integrity ===\n");

  // Fetch all profiles with total_referral_earnings > 0
  const { data: profiles, error: pErr } = await client
    .from('profiles')
    .select('id, email, full_name, total_referral_earnings')
    .gt('total_referral_earnings', 0);
  
  if (pErr) {
    console.error("Error fetching profiles:", pErr);
    return;
  }

  console.log(`Found ${profiles?.length || 0} referrers with total_referral_earnings > 0.\n`);

  for (const profile of profiles || []) {
    console.log(`------------------------------------------------------------------`);
    console.log(`Referrer: ${profile.full_name} (${profile.email})`);
    console.log(`ID: ${profile.id}`);
    console.log(`Profile total_referral_earnings: ${profile.total_referral_earnings}`);

    // Sum all referral_earnings rows where referrer_user_id matches
    const { data: earnings, error: eErr } = await client
      .from('referral_earnings')
      .select('id, commission_amount, referred_user_id, created_at, task_completion_id')
      .eq('referrer_user_id', profile.id);
    
    if (eErr) {
      console.error(`Error fetching earnings for user ${profile.id}:`, eErr);
      continue;
    }

    let ledgerSum = 0;
    const details: any[] = [];

    for (const row of earnings || []) {
      ledgerSum += Number(row.commission_amount || 0);
      details.push(row);
    }

    console.log(`Ledger sum of commission_amount: ${ledgerSum}`);
    
    const difference = Number(profile.total_referral_earnings) - ledgerSum;
    console.log(`Difference (Profile - Ledger): ${difference}`);

    if (difference !== 0) {
      console.log(`⚠️ MISMATCH detected! All ledger rows contributing to this user's earnings:`);
      details.forEach((row, i) => {
        console.log(`  [${i + 1}] ID: ${row.id}, Referred: ${row.referred_user_id}, Commission: ${row.commission_amount}, SubID: ${row.task_completion_id}, Created: ${row.created_at}`);
      });
    } else {
      console.log(`✅ MATCH! Database is fully consistent for this user.`);
    }
  }
}

verifyIntegrity();
