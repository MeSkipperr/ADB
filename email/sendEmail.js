// Import necessary modules
const nodemailer = require("nodemailer"); // To send emails
const path = require("path");

// Import user data (list of users to send emails to)
const recipient = require("../auth/recipient");
const sender = require("../auth/sender");
const sendErrorSystemAdmin = require("./sendErrorToAdmin");

// Configure the email transporter using Gmail service
const transporter = nodemailer.createTransport({
  service: "gmail", // Using Gmail as the email service
  auth: {
    user: sender.EMAIL_USER,
    pass: sender.EMAIL_PASS,
  },
});

// Function to send an error notification email
async function sendLogClearYoutubeData() {
  const filePath = path.join(__dirname, "logClearYoutube.txt");
  // Iterate through each user to send the error notification
  for (const user of recipient) {
    // Define the path to the log file associated with the IPTV error

    // Configure the email options
    const mailOptions = {
      from: sender.EMAIL_USER, // Sender's email (from .env)
      to: user.email, // Recipient's email (from the user data)
      subject: "YouTube Data Clearance Report - Successful & Failed Devices", // Improved subject
      text: `
Dear ${user.middleName} ${user.lastName},

Attached is the latest report on the YouTube data clearance process for your network devices. 
The report includes details of devices that successfully cleared data and those that encountered errors.

Please review the attached log file for more information.

Best regards,  
Courtyard by Marriott Bali Nusa Dua Resort
        `, // Improved email body
      attachments: [
        {
          filename: "logClearYoutube.txt", // File name in the email
          path: filePath, // Path to the log file
        },
      ],
    };

    try {
      // Send the email with the defined options
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response); // Log success response if email is sent
    } catch (err) {
      console.error("Failed to send email to:", user.email, "Error:", err); // Log error if sending fails
      sendErrorSystemAdmin(err);
    }
  }
}
// Export the sendLogClearYoutubeData function so it can be used in other modules
module.exports = sendLogClearYoutubeData;
