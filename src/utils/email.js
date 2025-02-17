import nodemailer from "nodemailer"

let transporter

// Verificar que las credenciales estén presentes
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("Email credentials are missing. Email functionality will be disabled.")
}

console.log("Email configuration:", {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS ? "[REDACTED]" : "undefined",
})

try {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Debe ser una contraseña de aplicación
    },
  })
  console.log("Nodemailer transporter created successfully")
} catch (error) {
  console.error("Error creating Nodemailer transporter:", error)
}

export async function sendApplicationEmail(application) {
  // If there's no transporter, just log a message and return
  if (!transporter) {
    console.log("Email functionality is disabled. Would have sent email with application data:", application)
    return
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: "New LinkUp Application Received",
    text: `
A new application has been received from ${application.firstName} ${application.lastName}.

Application Details:
--------------------
First Name: ${application.firstName}
Last Name: ${application.lastName}
Email: ${application.email}
LinkedIn Profile: ${application.linkedinProfile || "Not provided"}

Startup Information:
--------------------
Startup Name: ${application.startupName}
Short Description: ${application.shortDescription || "Not provided"}
Problem Solved: ${application.problemSolved || "Not provided"}
Sector: ${application.sector || "Not provided"}
Stage: ${application.stage || "Not provided"}

Investment & Customers:
-----------------------
Has Investment: ${application.hasInvestment ? "Yes" : "No"}
Seeking Investment: ${application.seekingInvestment ? "Yes" : "No"}
Has Customers: ${application.hasCustomers ? "Yes" : "No"}
Customers Details: ${application.customersDetails || "Not provided"}

Additional Information:
-----------------------
Links: ${application.links || "Not provided"}
Founder Contact: ${application.founderContact || "Not provided"}
Why Join LinkUp: ${application.whyJoinLinkUp || "Not provided"}
How Heard About LinkUp: ${application.howHeardAboutLinkUp || "Not provided"}

Please review this application and take appropriate action.
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Application email sent successfully:", info.response)
    return info
  } catch (error) {
    console.error("Error sending application email:", error)
    // We don't throw the error to avoid affecting the main flow
  }
}

