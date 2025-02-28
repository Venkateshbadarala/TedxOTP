import React, { useState } from "react";
import axios from "axios";
import "./App.css"; 

function App() {
  const [otp, setOtp] = useState("");
  const [student, setStudent] = useState(null);
  const [message, setMessage] = useState("");

  const fetchStudents = async () => {
    try {
      const response = await axios.get("https://tedxotp.onrender.com/fetch-students");
      console.log(response.data.message);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const sendOtp = async () => {
    try {
      const response = await axios.get("https://tedxotp.onrender.com/send-otp");
      console.log(response.data.message);
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await axios.post("https://tedxotp.onrender.com/get-student", { otp });
      setStudent(response.data.student);
      setMessage(response.data.message);
    } catch (error) {
      setMessage("Invalid OTP.");
      setStudent(null);
    }
  };

  return (
    <div className="container">
      <h1>Student Verification</h1>

      <div className="button-group">
        <button onClick={fetchStudents} className="button fetch">Fetch Students</button>
        <button onClick={sendOtp} className="button send">Send OTP</button>
      </div>

      <div className="input-group">
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="input"
        />
        <button onClick={verifyOtp} className="button verify">Verify OTP</button>
      </div>

      {message && <p className="message">{message}</p>}

      {student && (
        <div className="student-details">
          <h2>Student Details</h2>
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>Student ID:</strong> {student.studentId}</p>
          <p><strong>College Mail:</strong> {student.collegeMail}</p>
          <p><strong>Branch:</strong> {student.branch}</p>
          <p><strong>Ticket Type:</strong> {student.ticketType}</p>
        </div>
      )}
    </div>
  );
}

export default App;
