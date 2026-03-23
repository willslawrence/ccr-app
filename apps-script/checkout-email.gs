/**
 * CCR Church Library - Checkout Email Notification
 * Deploy as Web App: Execute as "Me", Access "Anyone"
 * 
 * Receives POST requests from the CCR App when a book is checked out.
 * Sends an email to the book owner automatically.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    var ownerEmail = data.ownerEmail;
    var ownerName = data.ownerName || 'Book Owner';
    var borrowerName = data.borrowerName || 'Someone';
    var bookTitle = data.bookTitle || 'a book';
    var dueBack = data.dueBack || 'TBD';
    var action = data.action || 'checkout'; // checkout, return, request
    
    if (!ownerEmail) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false, error: 'No owner email provided'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var subject, body;
    
    if (action === 'return') {
      subject = 'Friends Library - Book Returned: ' + bookTitle;
      body = 'Hi ' + ownerName + ',\n\n' +
             'Great news! ' + borrowerName + ' has returned your book "' + bookTitle + '" to the Friends Library.\n\n' +
             'Thanks for sharing your books with the community!\n\n' +
             '-- Friends Library';
    } else if (action === 'request') {
      subject = 'Friends Library - Book Requested: ' + bookTitle;
      body = 'Hi ' + ownerName + ',\n\n' +
             borrowerName + ' has requested your book "' + bookTitle + '" from the Friends Library.\n\n' +
             'The book is currently checked out by someone else. ' + borrowerName + ' is next in line.\n\n' +
             '-- Friends Library';
    } else {
      subject = 'Friends Library - Book Checked Out: ' + bookTitle;
      body = 'Hi ' + ownerName + ',\n\n' +
             borrowerName + ' has checked out your book "' + bookTitle + '" from the Friends Library.\n\n' +
             'Due back: ' + dueBack + '\n\n' +
             'Please coordinate with ' + borrowerName + ' to arrange pickup.\n\n' +
             'Thanks for sharing your books with the community!\n\n' +
             '-- Friends Library';
    }
    
    GmailApp.sendEmail(ownerEmail, subject, body, {
      name: 'Friends Library',
      replyTo: ownerEmail
    });
    
    // Log to spreadsheet (optional - for tracking)
    logEmail(ownerEmail, borrowerName, bookTitle, action, dueBack);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true, message: 'Email sent to ' + ownerEmail
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    service: 'CCR Library Email Notifications',
    usage: 'POST with {ownerEmail, ownerName, borrowerName, bookTitle, dueBack, action}'
  })).setMimeType(ContentService.MimeType.JSON);
}

function logEmail(ownerEmail, borrowerName, bookTitle, action, dueBack) {
  try {
    var ss = SpreadsheetApp.openById('1tarzoeTPmF7At2B5a0yJJ9NzcrjtnTuXUgr-71xVHfk');
    var logSheet = ss.getSheetByName('Email Log');
    if (!logSheet) {
      logSheet = ss.insertSheet('Email Log');
      logSheet.appendRow(['Timestamp', 'To', 'Borrower', 'Book', 'Action', 'Due Back']);
    }
    logSheet.appendRow([new Date(), ownerEmail, borrowerName, bookTitle, action, dueBack]);
  } catch (e) {
    // Silent fail - logging is optional
    Logger.log('Email logging failed: ' + e.toString());
  }
}

// Test function
function testSend() {
  var testEvent = {
    postData: {
      contents: JSON.stringify({
        ownerEmail: 'wlawrence@helicopter.com.sa',
        ownerName: 'Will',
        borrowerName: 'Test User',
        bookTitle: 'Test Book',
        dueBack: '2026-04-22',
        action: 'checkout'
      })
    }
  };
  var result = doPost(testEvent);
  Logger.log(result.getContent());
}
