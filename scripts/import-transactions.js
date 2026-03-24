/* ====================================
   TRANSACTION IMPORT SCRIPT
   Import CSV data to Firestore
   ==================================== */

// This script imports transaction data from the CSV file
// Usage: Load this via the browser console after setting up Firebase

async function importTransactionsFromCSV() {
  console.log('Starting transaction import...');
  
  // First, delete all existing transactions
  console.log('Deleting existing transactions...');
  const existingSnapshot = await db.collection('transactions').get();
  const batch1 = db.batch();
  
  existingSnapshot.docs.forEach(doc => {
    batch1.delete(doc.ref);
  });
  
  if (existingSnapshot.docs.length > 0) {
    await batch1.commit();
    console.log(`Deleted ${existingSnapshot.docs.length} existing transactions`);
  }
  
  // All transaction data from CSV
  const csvData = [
    { date: "2026-03-23", donor: "", receiptId: "", description: "Tithe Special fund - Kenyan Mother Financial Support", amount: "SAR\t(400)", type: "Outgoing", via: "Local Bank Transfer", allocation: "Special Project", status: "Complete" },
    { date: "2026-03-20", donor: "Eddie", receiptId: "NA", description: "Tithe Special fund - Kenyan Mother Financial Support", amount: "SAR\t400", type: "Incoming", via: "Cash", allocation: "Special Project", status: "Complete" },
    { date: "2026-03-20", donor: "", receiptId: "", description: "Tithe", amount: "SAR\t1,400", type: "Incoming", via: "Giving Box", allocation: "All", status: "Complete" },
    { date: "2026-03-20", donor: "", receiptId: "26", description: "Food supplies - Amber", amount: "SAR\t(91)", type: "Outgoing", via: "Revolut", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-03-20", donor: "", receiptId: "", description: "Payment - Special Project - Joyful Joshef ($200)", amount: "SAR\t(751)", type: "Outgoing", via: "Revolut", allocation: "Special Project", status: "Complete" },
    { date: "2026-03-20", donor: "Kaitlyn", receiptId: "", description: "Tithe - Special Project - Joyful Joshef ($200", amount: "SAR\t751", type: "Incoming", via: "Revolut", allocation: "Special Project", status: "Complete" },
    { date: "2026-03-18", donor: "", receiptId: "", description: "Transfer from Petty cash to Revolut", amount: "SAR\t150", type: "Transfer", via: "Revolut", allocation: "Transfer within CCR", status: "Complete" },
    { date: "2026-03-18", donor: "", receiptId: "", description: "Joyful Joseph ($1500 total)", amount: "SAR\t(3,556)", type: "Outgoing", via: "Local Bank Transfer", allocation: "PC1 - Global Church Needs", status: "Complete" },
    { date: "2026-03-18", donor: "", receiptId: "", description: "Joyful Joseph", amount: "SAR\t(2,070)", type: "Outgoing", via: "Local Bank Transfer", allocation: "LC2 - Ministry Of the Word", status: "Complete" },
    { date: "2026-03-13", donor: "", receiptId: "", description: "Tithe", amount: "SAR\t1,000.00", type: "Incoming", via: "Giving Box", allocation: "All", status: "Complete" },
    { date: "2026-03-13", donor: "", receiptId: "25", description: "Hope Village", amount: "SAR\t(1,391)", type: "Outgoing", via: "Via", allocation: "PC2 - Church Planting", status: "Complete" },
    { date: "2026-03-06", donor: "", receiptId: "", description: "Tithe", amount: "SAR\t600.00", type: "Incoming", via: "Giving Box", allocation: "All", status: "Complete" },
    { date: "2026-03-06", donor: "Zak", receiptId: "", description: "Tithe", amount: "SAR\t500", type: "Incoming", via: "Local Bank Transfer", allocation: "All", status: "Complete" },
    { date: "2026-03-06", donor: "", receiptId: "24", description: "Istaraha March 6 - Zak", amount: "SAR\t(1,200)", type: "Outgoing", via: "Local Bank Transfer", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-03-05", donor: "", receiptId: "23", description: "Food supplies - Amber ($21.08)", amount: "SAR\t(79)", type: "Outgoing", via: "Revolut", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-03-03", donor: "Kaitlyn", receiptId: "", description: "Tithe - $200", amount: "SAR\t751", type: "Incoming", via: "Revolut", allocation: "All", status: "Complete" },
    { date: "2026-03-03", donor: "", receiptId: "NA", description: "Transfer fee local bank to revolut", amount: "SAR\t(1)", type: "Outgoing", via: "Local Bank Transfer", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-03-03", donor: "", receiptId: "Na", description: "Transfer fee settling up", amount: "SAR\t(1)", type: "Outgoing", via: "Local Bank Transfer", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-03-03", donor: "", receiptId: "", description: "Transfer from local bank to Revolut", amount: "SAR\t2,800", type: "Transfer", via: "Local Bank Transfer", allocation: "Transfer within CCR", status: "Complete" },
    { date: "2026-03-03", donor: "", receiptId: "", description: "Transfer", amount: "SAR\t1,886", type: "Transfer", via: "Local Bank Transfer", allocation: "Transfer within CCR", status: "Complete" },
    { date: "2026-03-02", donor: "", receiptId: "NA", description: "Transfer fee settling up", amount: "SAR\t(2)", type: "Outgoing", via: "Local Bank Transfer", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-03-02", donor: "", receiptId: "22", description: "Daniels Gift - Vibrating Ball - remoburse Josie", amount: "SAR\t(275)", type: "Outgoing", via: "Local Bank Transfer", allocation: "PC1 - Global Church Needs", status: "Complete" },
    { date: "2026-03-02", donor: "", receiptId: "", description: "Transfer", amount: "SAR\t4,800", type: "Transfer", via: "Local Bank Transfer", allocation: "Transfer within CCR", status: "Complete" },
    { date: "2026-03-01", donor: "Anna", receiptId: "", description: "Tithe ($100)", amount: "SAR\t375", type: "Incoming", via: "Venmo", allocation: "All", status: "Complete" },
    { date: "2026-03-01", donor: "", receiptId: "NA", description: "Tithe Special fund - Kenyan Mother Financial Support", amount: "SAR\t(400)", type: "Outgoing", via: "Local Bank Transfer", allocation: "Special Project", status: "Complete" },
    { date: "2026-03-01", donor: "", receiptId: "Na", description: "Transfer fee settling up", amount: "SAR\t(1)", type: "Outgoing", via: "Local Bank Transfer", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-03-01", donor: "", receiptId: "19", description: "Open Doors International($682)", amount: "SAR\t(2,558)", type: "Outgoing", via: "Treasurer to Receipent", allocation: "HH2 - Persecuted Church", status: "Complete" },
    { date: "2026-03-01", donor: "", receiptId: "18", description: "Send Relief ($371.92)", amount: "SAR\t(1,395)", type: "Outgoing", via: "Treasurer to Receipent", allocation: "HH1 - Orphans, Widows, Soj", status: "Complete" },
    { date: "2026-03-01", donor: "", receiptId: "17", description: "Lifesong for Orphans ($632.40)", amount: "SAR\t(2,372)", type: "Outgoing", via: "Treasurer to Receipent", allocation: "HH1 - Orphans, Widows, Soj", status: "Complete" },
    { date: "2026-03-01", donor: "", receiptId: "21", description: "Stan and Tasha ($200)", amount: "SAR\t(750)", type: "Outgoing", via: "Treasurer to Receipent", allocation: "PC2 - Church Planting", status: "Complete" },
    { date: "2026-03-01", donor: "", receiptId: "", description: "Transfer", amount: "SAR\t4,500", type: "Transfer", via: "Local Bank Transfer", allocation: "", status: "Complete" },
    { date: "2026-02-28", donor: "", receiptId: "16", description: "Crisis Aid Internation ($632.40)", amount: "SAR\t(2,372)", type: "Outgoing", via: "Treasurer to Receipent", allocation: "HH1 - Orphans, Widows, Soj", status: "Complete" },
    { date: "2026-02-28", donor: "", receiptId: "20", description: "Radical ($464)", amount: "SAR\t(1,739)", type: "Outgoing", via: "Treasurer to Receipent", allocation: "PC2 - Church Planting", status: "Complete" },
    { date: "2026-02-27", donor: "Eddie", receiptId: "", description: "Tithe Special fund - Kenyan Mother Financial Support", amount: "SAR\t400", type: "Incoming", via: "Cash", allocation: "Special Project", status: "Complete" },
    { date: "2026-02-27", donor: "Will", receiptId: "", description: "Tithe", amount: "SAR\t3,000", type: "Incoming", via: "Cash", allocation: "All", status: "Complete" },
    { date: "2026-02-27", donor: "Eddie", receiptId: "", description: "Tithe", amount: "SAR\t200", type: "Incoming", via: "Giving Box", allocation: "All", status: "Complete" },
    { date: "2026-02-27", donor: "Rin", receiptId: "", description: "Tithe", amount: "SAR\t4", type: "Incoming", via: "Cash", allocation: "All", status: "Complete" },
    { date: "2026-02-20", donor: "", receiptId: "", description: "Tithe", amount: "SAR\t50", type: "Incoming", via: "Giving Box", allocation: "All", status: "Complete" },
    { date: "2026-02-20", donor: "Josie", receiptId: "", description: "Tithe - Local church need potential to other funds as well", amount: "SAR\t5,500", type: "Incoming", via: "Local Bank Transfer", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-02-20", donor: "Josie", receiptId: "", description: "Tithe - Special Project - Projector", amount: "SAR\t1,500", type: "Incoming", via: "Local Bank Transfer", allocation: "Special Project", status: "Pending" },
    { date: "2026-02-19", donor: "", receiptId: "15", description: "Food supplies - Amber", amount: "SAR\t(86.94)", type: "Outgoing", via: "Revolut", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-02-17", donor: "", receiptId: "", description: "Transfer petty cash to CCR Revolut", amount: "SAR\t1,670.00", type: "Transfer", via: "Revolut", allocation: "Transfer within CCR", status: "Complete" },
    { date: "2026-02-13", donor: "", receiptId: "14", description: "Istaraha Feb 13 - Zak", amount: "SAR\t(1,200.00)", type: "Outgoing", via: "Local Bank Transfer", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-02-13", donor: "", receiptId: "13", description: "Friday Food - Kailtyn", amount: "SAR\t(644.00)", type: "Outgoing", via: "Revolut", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-02-13", donor: "", receiptId: "", description: "Tithe", amount: "SAR\t150", type: "Incoming", via: "Giving Box", allocation: "All", status: "Complete" },
    { date: "2026-02-06", donor: "", receiptId: "11", description: "Friday Food - Amber", amount: "SAR\t(588.00)", type: "Outgoing", via: "Revolut", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-02-06", donor: "", receiptId: "", description: "Tithe", amount: "SAR\t70", type: "Incoming", via: "Giving Box", allocation: "All", status: "Complete" },
    { date: "2026-02-04", donor: "", receiptId: "12", description: "Plates cups etc Amber", amount: "SAR\t(34.00)", type: "Outgoing", via: "Revolut", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-02-03", donor: "", receiptId: "10", description: "Istaraha Feb 6 - Zak", amount: "SAR\t(1,200.00)", type: "Outgoing", via: "Local Bank Transfer", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-02-03", donor: "Amber", receiptId: "", description: "Tithe $200", amount: "SAR\t750", type: "Incoming", via: "Revolut", allocation: "All", status: "Complete" },
    { date: "2026-01-30", donor: "", receiptId: "", description: "Tithe", amount: "SAR\t450.00", type: "Incoming", via: "Giving Box", allocation: "All", status: "Complete" },
    { date: "2026-01-29", donor: "Josie", receiptId: "", description: "Tithe", amount: "SAR\t4,100.00", type: "Incoming", via: "Local Bank Transfer", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-01-27", donor: "", receiptId: "9", description: "Istaraha Jan 30", amount: "SAR\t(1,200.00)", type: "Outgoing", via: "Local Bank Transfer", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-01-26", donor: "", receiptId: "", description: "Transfer Petty cash to CCR Revolut", amount: "SAR\t810.00", type: "Transfer", via: "Revolut", allocation: "Transfer within CCR", status: "Complete" },
    { date: "2026-01-24", donor: "Kevin", receiptId: "", description: "Tithe - $300", amount: "SAR\t1,125.00", type: "Incoming", via: "Venmo", allocation: "All", status: "Complete" },
    { date: "2026-01-23", donor: "", receiptId: "", description: "Friday Food - Zak", amount: "SAR\t(755.00)", type: "Outgoing", via: "Local Bank Transfer", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-01-18", donor: "Zak", receiptId: "", description: "Tithe", amount: "SAR\t500.00", type: "Incoming", via: "Local Bank Transfer", allocation: "All", status: "Complete" },
    { date: "2026-01-16", donor: "", receiptId: "", description: "Tithe", amount: "SAR\t500.00", type: "Incoming", via: "Giving Box", allocation: "All", status: "Complete" },
    { date: "2026-01-16", donor: "Eddie", receiptId: "", description: "Tithe", amount: "SAR\t10,000.00", type: "Incoming", via: "Local Bank Transfer", allocation: "All", status: "Complete" },
    { date: "2026-01-16", donor: "", receiptId: "", description: "Tithe Special Project Joyful Joseph", amount: "SAR\t500.00", type: "Incoming", via: "Giving Box", allocation: "LC2 - Ministry Of the Word", status: "Complete" },
    { date: "2026-01-10", donor: "Kaitlyn", receiptId: "", description: "Tithe $150", amount: "SAR\t562.50", type: "Incoming", via: "Revolut", allocation: "All", status: "Complete" },
    { date: "2026-01-09", donor: "", receiptId: "7", description: "Friday Food - Kaitlyn", amount: "SAR\t(640.00)", type: "Outgoing", via: "Revolut", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-01-08", donor: "", receiptId: "8", description: "Tub restock. Plates, cups, milk, and bread", amount: "SAR\t(48.04)", type: "Outgoing", via: "Revolut", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-01-07", donor: "Amber", receiptId: "", description: "Tithe $200", amount: "SAR\t749.98", type: "Incoming", via: "Revolut", allocation: "All", status: "Complete" },
    { date: "2026-01-02", donor: "", receiptId: "", description: "Tithe", amount: "SAR\t320.00", type: "Incoming", via: "Cash", allocation: "All", status: "Complete" },
    { date: "2026-01-02", donor: "", receiptId: "None", description: "Estaraha rent for January 9nd (deposit 700 then full 500)", amount: "SAR\t(1,200.00)", type: "Outgoing", via: "Cash", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2026-01-02", donor: "", receiptId: "6", description: "Friday Food - Kaitlyn", amount: "SAR\t(640.00)", type: "Outgoing", via: "Revolut", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2025-12-26", donor: "", receiptId: "", description: "Tithe", amount: "SAR\t400.00", type: "Incoming", via: "Giving Box", allocation: "All", status: "Complete" },
    { date: "2025-12-26", donor: "", receiptId: "5", description: "Friday food - Kaitlyn", amount: "SAR\t(540.00)", type: "Outgoing", via: "Revolut", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2025-12-24", donor: "", receiptId: "4", description: "Coffee bag - Will", amount: "SAR\t(22.00)", type: "Outgoing", via: "Revolut", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2025-12-19", donor: "Amber", receiptId: "", description: "Tithe $25", amount: "SAR\t93.76", type: "Incoming", via: "Revolut", allocation: "All", status: "Complete" },
    { date: "2025-12-19", donor: "", receiptId: "", description: "Tithe", amount: "SAR\t1,200.00", type: "Incoming", via: "Giving Box", allocation: "All", status: "Complete" },
    { date: "2025-12-19", donor: "Becca", receiptId: "", description: "Tithe $133.61 - $10 fee", amount: "SAR\t463.61", type: "Incoming", via: "Revolut", allocation: "All", status: "Complete" },
    { date: "2025-12-19", donor: "", receiptId: "", description: "Estaraha rent for January 2nd", amount: "SAR\t(1,200.00)", type: "Outgoing", via: "Cash", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2025-12-19", donor: "", receiptId: "2", description: "Friday Lunch - Kailtyn", amount: "SAR\t(798.00)", type: "Outgoing", via: "Venmo", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2025-12-19", donor: "", receiptId: "", description: "Al Rajhi transfer fee", amount: "SAR\t(1.15)", type: "Outgoing", via: "Local Bank Transfer", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2025-12-17", donor: "Will", receiptId: "", description: "Tithe", amount: "SAR\t7,500.00", type: "Incoming", via: "Local Bank Transfer", allocation: "All", status: "Complete" },
    { date: "2025-12-17", donor: "", receiptId: "", description: "Previous Cash held in old system from John ($1853)", amount: "SAR\t6,950.05", type: "Incoming", via: "Paypal", allocation: "All", status: "Complete" },
    { date: "2025-12-16", donor: "", receiptId: "", description: "Cash held by elders  (held by Zak for future esterahas)", amount: "SAR\t1,790.00", type: "Incoming", via: "Cash", allocation: "All", status: "Complete" },
    { date: "2025-12-12", donor: "", receiptId: "1", description: "Friday Lunch - Kailtyn", amount: "SAR\t(640.00)", type: "Outgoing", via: "Venmo", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2025-12-11", donor: "", receiptId: "3", description: "Cups, bread and toilet paper - Amber", amount: "SAR\t(96.88)", type: "Outgoing", via: "Revolut", allocation: "LC1 - Church Needs", status: "Complete" },
    { date: "2025-09-29", donor: "Will", receiptId: "", description: "Tithe", amount: "SAR\t10.00", type: "Incoming", via: "Local Bank Transfer", allocation: "All", status: "Complete" }
  ];
  
  // Function to parse amounts: "SAR\t1,400" → 1400, "SAR\t(400)" → -400
  function parseAmount(amountStr) {
    // Remove SAR prefix and tab
    let cleanAmount = amountStr.replace(/^SAR\t/, '');
    
    // Handle negative amounts in parentheses
    const isNegative = cleanAmount.startsWith('(') && cleanAmount.endsWith(')');
    if (isNegative) {
      cleanAmount = cleanAmount.slice(1, -1); // Remove parentheses
    }
    
    // Remove commas and convert to number
    const numericAmount = parseFloat(cleanAmount.replace(/,/g, ''));
    
    return isNegative ? -numericAmount : numericAmount;
  }
  
  // Import transactions in batches
  const batchSize = 500;
  let totalImported = 0;
  
  for (let i = 0; i < csvData.length; i += batchSize) {
    const batch = db.batch();
    const batchData = csvData.slice(i, i + batchSize);
    
    batchData.forEach(row => {
      const docRef = db.collection('transactions').doc();
      const amount = parseAmount(row.amount);
      
      batch.set(docRef, {
        date: row.date,
        donor: row.donor || null,
        receiptId: row.receiptId || null,
        description: row.description,
        amount: amount,
        type: row.type,
        via: row.via,
        allocation: row.allocation,
        status: row.status,
        createdAt: firebase.firestore.Timestamp.now(),
        importedAt: firebase.firestore.Timestamp.now()
      });
    });
    
    await batch.commit();
    totalImported += batchData.length;
    console.log(`Imported batch ${Math.ceil((i + 1) / batchSize)}: ${batchData.length} transactions`);
  }
  
  console.log(`✅ Import complete! Total transactions imported: ${totalImported}`);
}

// To run: importTransactionsFromCSV()