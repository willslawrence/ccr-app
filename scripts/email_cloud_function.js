const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud Function to send checkout notification emails
 * Triggers when a document is created in the 'emailQueue' collection
 */
exports.sendCheckoutEmail = functions.firestore
    .document('emailQueue/{docId}')
    .onCreate(async (snap, context) => {
        const emailData = snap.data();
        const docId = context.params.docId;
        
        try {
            console.log('Processing email request:', docId, emailData);
            
            // Mark as processing
            await snap.ref.update({
                status: 'processing',
                processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // TODO: Implement actual email sending logic here
            // This could be:
            // 1. SendGrid API
            // 2. Firebase Extensions Email
            // 3. Google Cloud SendGrid
            // 4. Nodemailer with SMTP
            // 5. Other email service
            
            // For now, we'll simulate email sending
            console.log('Would send email:', {
                to: emailData.to,
                subject: emailData.subject,
                body: emailData.body
            });
            
            // Example using SendGrid (uncomment and configure as needed):
            /*
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(functions.config().sendgrid.key);
            
            const msg = {
                to: emailData.to,
                from: 'noreply@ccrchurch.com', // Configure sender
                subject: emailData.subject,
                text: emailData.body,
                html: emailData.body.replace(/\n/g, '<br>')
            };
            
            await sgMail.send(msg);
            */
            
            // Mark as sent
            await snap.ref.update({
                status: 'sent',
                sentAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Email sent successfully:', docId);
            
        } catch (error) {
            console.error('Error sending email:', error);
            
            // Mark as failed
            await snap.ref.update({
                status: 'failed',
                error: error.message,
                failedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            throw error;
        }
    });

/**
 * Helper function to create email queue document
 * This can be called from the app when a checkout happens
 */
function createCheckoutEmailNotification(ownerEmail, ownerName, borrowerName, bookTitle, dueBack) {
    const subject = `📚 Book Checkout: ${bookTitle}`;
    const body = `Hi ${ownerName},

${borrowerName} has checked out your book "${bookTitle}" from the CCR Library.

Due back: ${dueBack}

Please coordinate with ${borrowerName} to arrange pickup.

Thanks!
CCR Church App`;

    return {
        to: ownerEmail,
        subject: subject,
        body: body,
        bookTitle: bookTitle,
        borrowerName: borrowerName,
        ownerName: ownerName,
        dueBack: dueBack,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
}

/**
 * Manual function to test email queue (can be called via HTTP trigger if needed)
 */
exports.testEmailQueue = functions.https.onRequest(async (req, res) => {
    try {
        const testEmail = createCheckoutEmailNotification(
            'test@example.com',
            'Test Owner',
            'Test Borrower', 
            'Test Book',
            '2024-01-15'
        );
        
        const docRef = await db.collection('emailQueue').add(testEmail);
        
        res.json({
            success: true,
            message: 'Test email queued',
            docId: docRef.id
        });
    } catch (error) {
        console.error('Error creating test email:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Function to clean up old email queue documents
 * Run this on a schedule to prevent the collection from growing too large
 */
exports.cleanupEmailQueue = functions.pubsub.schedule('0 2 * * *') // Run daily at 2 AM
    .onRun(async (context) => {
        console.log('Starting email queue cleanup...');
        
        // Delete emails older than 30 days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        
        const oldEmails = await db.collection('emailQueue')
            .where('createdAt', '<', cutoffDate)
            .get();
        
        const batch = db.batch();
        oldEmails.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        if (oldEmails.size > 0) {
            await batch.commit();
            console.log(`Cleaned up ${oldEmails.size} old email documents`);
        } else {
            console.log('No old email documents to clean up');
        }
        
        return null;
    });

module.exports = {
    sendCheckoutEmail: exports.sendCheckoutEmail,
    testEmailQueue: exports.testEmailQueue,
    cleanupEmailQueue: exports.cleanupEmailQueue,
    createCheckoutEmailNotification
};