require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const app = express();

// CORS Configuration
app.use(cors({ origin: "*", methods: "GET,POST", credentials: true }));
app.use(express.json());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// Define Student Schema
const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  collegeMail: { type: String, required: true },
  ticketType: { type: String, required: true },
  otp: { type: String },
  checkedIn: { type: Boolean, default: false },
});

const Student = mongoose.model("Student", StudentSchema);

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailTemplatePath = path.join(__dirname, "template", "Otpcontent.html");
const emailTemplate = fs.readFileSync(emailTemplatePath, "utf8");

// Function to send OTP emails
async function sendOtpEmails(students) {
  try {
    for (let student of students) {
      if (!student.otp) continue;

      // Replace placeholders with actual data
      const htmlContent = emailTemplate
      .replace(/{{name}}/g, student.name)
      .replace(/{{otp}}/g, student.otp)
      .replace(/{{ticketType}}/g, student.ticketType);

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: student.collegeMail,
        subject: "Your OTP for TEDx VishnuInstitute Verification",
        html: htmlContent,
      });

      console.log(`📧 OTP Sent to ${student.collegeMail}`);
    }
  } catch (error) {
    console.error("❌ Error sending OTP emails:", error);
  }
}

// Fetch students from Google Sheets and generate OTP
app.get("/fetch-students", async (req, res) => {
  try {
    console.log("📡 Fetching student data...");

    const response = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}/values/Sheet1!A2:H?key=${process.env.GOOGLE_API_KEY}`
    );

    if (!response.data.values || response.data.values.length === 0) {
      return res.status(404).json({ message: "No student data found." });
    }

    const studentsData = [];

    for (let row of response.data.values) {
      const name = row[0]?.trim() || "Unknown";
      const studentId = row[1]?.trim();
      const collegeMail = row[2]?.trim() || "Unknown";
      const ticketType = row[3]?.trim() || "Unknown";

      if (!studentId || !collegeMail) continue;

      let student = await Student.findOne({ studentId });

      if (!student) {
        const otp = crypto.randomInt(100000, 999999).toString();
        student = new Student({
          name,
          studentId,
          collegeMail,
          ticketType,
          otp,
        });

        await student.save();
      } else {
        console.log(`🔄 Student ${student.name} already exists.`);
      }

      studentsData.push(student);
    }

    res.status(200).json({
      message: "Data stored successfully!",
      students: studentsData,
    });
  } catch (error) {
    console.error("❌ Error fetching students:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/send-otp", async (req, res) => {
  try {
    console.log("📩 Sending OTPs...");
    const students = await Student.find({});
    if (!students.length) return res.status(404).json({ message: "No students found." });

    await sendOtpEmails(students);

    res.status(200).json({ message: "OTPs sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending OTPs:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/get-student", async (req, res) => {
  try {
    const { otp } = req.body;
    const student = await Student.findOne({ otp });
    if (!student) return res.status(404).json({ message: "Invalid OTP." });
    
    if (student.checkedIn) {
      return res.status(200).json({
        message: `ℹ️ This OTP has already been verified for ${student.name} (${student.studentId})!`,
        student,
        checkedIn: true,
      });
    }
    
    student.checkedIn = true;
    await student.save();    
    
    res.status(200).json({
      message: "✅ OTP Verified Successfully!",
      student,
      checkedIn: false,
    });
  } catch (error) {
    console.error("❌ Error retrieving student data:", error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static frontend
app.use(express.static("public"));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
