import React, { useState } from "react";
import axios from "axios";

function App() {
  const [otp, setOtp] = useState("");
  const [student, setStudent] = useState(null);
  const [message, setMessage] = useState("");

  const fetchStudents = async () => {
    try {
      const response = await axios.get("https://tedxotp.onrender.com:10000/fetch-students");
      console.log(response.data.message);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const sendOtp = async () => {
    try {
      const response = await axios.get("https://tedxotp.onrender.com:10000/send-otp");
      console.log(response.data.message);
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await axios.post("https://tedxotp.onrender.com:10000/get-student", { otp });
      setStudent(response.data.student);
      setMessage(response.data.message);
    } catch (error) {
      setMessage("Invalid OTP.");
      setStudent(null);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Student Verification</h1>
      <button onClick={fetchStudents} style={{ margin: "10px", padding: "10px" }}>Fetch Students</button>
      <button onClick={sendOtp} style={{ margin: "10px", padding: "10px" }}>Send OTP</button>
      
      <div>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={{ padding: "10px", margin: "10px" }}
        />
        <button onClick={verifyOtp} style={{ padding: "10px" }}>Verify OTP</button>
      </div>

      {message && <p>{message}</p>}

      {student && (
        <div>
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
