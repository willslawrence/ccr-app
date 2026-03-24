# Scripts Directory

## Transaction Import

### import-transactions.js
Contains the `importTransactionsFromCSV()` function that:
1. Deletes all existing transactions from Firestore
2. Imports all transactions from the CSV data (manually embedded in the script)
3. Properly parses SAR amounts: "SAR\t1,400" → 1400, "SAR\t(400)" → -400

### import-runner.html
Simple HTML file that loads Firebase and the import script. Open in browser and click the button or run `importTransactionsFromCSV()` in console.

### Usage
1. Open `import-runner.html` in a web browser
2. Click "Run Import" button or open browser console and run:
   ```javascript
   importTransactionsFromCSV()
   ```
3. Monitor console for progress updates
4. Check Firestore to verify import completed

**WARNING:** This will delete all existing transaction data before importing. Make sure you have a backup if needed.

## Data Mapping

The CSV columns map to Firestore fields as follows:
- Date → date (YYYY-MM-DD format)
- Donor → donor 
- Receipt ID → receiptId
- Description → description
- Amount → amount (parsed number, negative for expenses)
- Type → type
- Via → via
- Church Allocations → allocation
- Status → status

Additional fields added:
- createdAt: Timestamp of import
- importedAt: Timestamp of import