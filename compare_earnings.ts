import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vvnnqigneoeamfantxnk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const client = createClient(supabaseUrl, supabaseServiceKey);

async function investigate() {
  console.log("=== Fetching Referral Earnings for comparison ===");

  // Fetch all referral earnings
  const { data: allEarnings, error: err } = await client
    .from('referral_earnings')
    .select('*')
    .order('created_at', { ascending: false });

  if (err) {
    console.error("Error fetching referral earnings:", err);
    return;
  }

  console.log(`Total referral earnings rows: ${allEarnings?.length || 0}`);

  // Let's find one row where task_completion_id is from task_submissions (Standard)
  // and one where task_completion_id is from dynamic_task_submissions (Dynamic)
  
  const stdRows: any[] = [];
  const dynRows: any[] = [];

  for (const row of allEarnings || []) {
    // Check if task_completion_id exists in task_submissions
    const { data: stdSub } = await client
      .from('task_submissions')
      .select('id, user_id, task_id')
      .eq('id', row.task_completion_id)
      .maybeSingle();

    if (stdSub) {
      stdRows.push({ ledger: row, submission: stdSub });
    } else {
      const { data: dynSub } = await client
        .from('dynamic_task_submissions')
        .select('id, user_id, task_id')
        .eq('id', row.task_completion_id)
        .maybeSingle();

      if (dynSub) {
        dynRows.push({ ledger: row, submission: dynSub });
      }
    }
  }

  console.log(`\n--- Found Standard Task Ledger Row (${stdRows.length} total) ---`);
  if (stdRows.length > 0) {
    console.log(JSON.stringify(stdRows[0], null, 2));
  } else {
    console.log("No Standard Task ledger rows found.");
  }

  console.log(`\n--- Found Dynamic Task Ledger Row (${dynRows.length} total) ---`);
  if (dynRows.length > 0) {
    console.log(JSON.stringify(dynRows[0], null, 2));
  } else {
    console.log("No Dynamic Task ledger rows found.");
  }
}

investigate();
