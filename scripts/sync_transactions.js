#!/usr/bin/env node
/**
 * Sync CCR transactions from CSV source of truth → Firestore.
 * Wipes existing transactions and rebuilds from CSV.
 * Handles malformed CSV with commas inside unquoted description fields.
 */
const admin = require('firebase-admin');
const fs = require('fs');

const SA = require('/Users/willy/Projects/ccr-app/scripts/.secrets/service-account.json');
admin.initializeApp({ credential: admin.credential.cert(SA), projectId: 'ccr-church-app' });

const CSV = fs.readFileSync('/Users/willy/.openclaw/media/inbound/bdefc438-4839-451b-b456-63b3c86f93c6.csv', 'utf8');

function parseAmount(s) {
  s = (s||'').replace('SAR','').replace(/,/g,'').trim();
  const neg = s.includes('(') && s.includes(')');
  s = s.replace(/[()]/g,'').trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : (neg ? -n : n);
}

function parseDate(s) {
  s = (s||'').trim().replace(/"/g,'');
  const m = s.match(/(\w+)\s+(\d+),\s+(\d+)/);
  if (!m) return null;
  const months = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  return new Date(parseInt(m[3]), months[m[1]], parseInt(m[2]));
}

// Parse one CSV row, handling commas inside quoted fields
function parseCSVRow(row) {
  const cols = [];
  let inQ = false, cur = '';
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      // Skip the quote; toggle inQ
      inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      cols.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim()); // last field
  return cols;
}

async function sync() {
  const lines = CSV.trim().split('\n');
  const headerCols = parseCSVRow(lines[0]);
  const EXPECTED = headerCols.length;
  console.log(`Header columns (${EXPECTED}):`, headerCols);

  // Find column indices by checking first few rows
  const firstRow = parseCSVRow(lines[1]);
  console.log('First data row cols:', firstRow.length, firstRow.slice(0,5));

  const idx = {
    date: headerCols.indexOf('Date'),
    donor: headerCols.indexOf('Donor'),
    receipt: headerCols.indexOf('Receipt ID'),
    desc: headerCols.indexOf('Description'),
    amount: headerCols.indexOf('Amount'),
    type: headerCols.indexOf('Type'),
    via: headerCols.indexOf('Via'),
    alloc: headerCols.indexOf('Church Allocations'),
    status: headerCols.indexOf('Status')
  };
  console.log('Column indices:', idx);

  const transactions = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const rawCols = parseCSVRow(lines[i]);
    const cols = rawCols;

    // Fix: if we got MORE cols than expected, the extra fields belong in description
    let description = cols[idx.desc] || '';
    if (rawCols.length > EXPECTED) {
      // Merge overflow cols into description
      const overflow = rawCols.slice(idx.desc + 1, rawCols.length - (cols.length - idx.desc - 1));
      description = rawCols.slice(idx.desc, rawCols.length - (cols.length - idx.desc - 1)).join(',').replace(/^"|"$/g,'').trim();
    }
    description = (description||'').replace(/"/g,'').trim();

    const date = parseDate(cols[idx.date]);
    const amount = parseAmount(cols[idx.amount]);

    if (!date || !description || amount === 0) {
      skipped++;
      continue;
    }

    transactions.push({
      date,
      donor: (cols[idx.donor]||'').replace(/"/g,'').trim() || null,
      receiptId: (cols[idx.receipt]||'').replace(/"/g,'').trim() || null,
      description,
      amount,
      type: (cols[idx.type]||'').replace(/"/g,'').trim() || '',
      via: (cols[idx.via]||'').replace(/"/g,'').trim() || '',
      allocation: (cols[idx.alloc]||'').replace(/"/g,'').trim() || '',
      status: (cols[idx.status]||'').replace(/"/g,'').trim() || 'Complete'
    });
  }

  console.log(`\nParsed ${transactions.length} transactions (skipped ${skipped})`);

  // Show a few to verify
  transactions.slice(0,3).forEach(t => console.log(' ', t.date.toLocaleDateString(), t.type, t.allocation, t.description.slice(0,30), t.amount));
  console.log('...');
  transactions.slice(-3).forEach(t => console.log(' ', t.date.toLocaleDateString(), t.type, t.allocation, t.description.slice(0,30), t.amount));

  const db = admin.firestore();
  const coll = db.collection('transactions');

  // Wipe existing
  process.stdout.write('Wiping existing transactions... ');
  const existing = await coll.get();
  await Promise.all(existing.docs.map(d => d.ref.delete()));
  console.log(`deleted ${existing.docs.length}`);

  // Write in batches
  const BATCH = 400;
  for (let i = 0; i < transactions.length; i += BATCH) {
    const batch = db.batch();
    transactions.slice(i, i + BATCH).forEach(t => {
      const docRef = coll.doc();
      batch.set(docRef, {
        date: admin.firestore.Timestamp.fromDate(t.date),
        donor: t.donor,
        receiptId: t.receiptId,
        description: t.description,
        amount: t.amount,
        type: t.type,
        via: t.via,
        allocation: t.allocation,
        status: t.status,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
    console.log(`  Wrote ${Math.min(i + BATCH, transactions.length)} / ${transactions.length}`);
  }

  const snap = await coll.get();
  console.log(`\n✅ Done — ${snap.size} transactions in Firestore`);
  process.exit(0);
}

sync().catch(e => { console.error(e); process.exit(1); });
