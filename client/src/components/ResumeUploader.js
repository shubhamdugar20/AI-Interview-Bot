import React, { useState } from "react";
import { Upload, Card, Typography, Spin, message } from "antd";
import { CloudUploadOutlined, LoadingOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { addCandidate } from "../store/candidateSlice";
import { startSession } from "../store/sessionSlice";
import axios from "axios";

const { Title, Text } = Typography;
const { Dragger } = Upload;

export default function ResumeUploader() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  async function handleFile(file) {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Step 1: Parse resume
      const resp = await axios.post(
        "https://ai-interview-bot-eo27.onrender.com/api/resume/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const parsed = resp.data || { name: "", email: "", phone: "" };
      const candidateId = uuidv4();
      dispatch(addCandidate({ id: candidateId, ...parsed }));

      // Step 2: Generate AI questions
      let questions = [];
      try {
        const aiResp = await axios.post(
          "https://ai-interview-bot-eo27.onrender.com/api/openai",
          {
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are an expert interview question generator. Generate 6 technical interview questions  for a candidate focused on Node.js and React. Return valid JSON array with id, text, difficulty (2 easy/ 2 medium/ 2 hard), and timeLimit (easy=20, medium=60, hard=120)."
              },
              {
                role: "user",
                content: `Candidate Info:\nName: ${parsed.name}\nEmail: ${parsed.email}\nPhone: ${parsed.phone}`
              }
            ]
          }
        );

        let jsonString = aiResp.data.choices[0].message.content;
        jsonString = jsonString.replace(/```json|```/g, '').trim();
        questions = JSON.parse(jsonString);

      } catch (err) {
        console.warn("AI question generation failed, using fallback questions.", err);
        // fallback questions
        questions = [
          { id: "q1", text: "Explain useState in React.", difficulty: "easy", timeLimit: 20 },
          { id: "q2", text: "What is Express middleware?", difficulty: "easy", timeLimit: 20 },
          { id: "q3", text: "Explain Redux flow.", difficulty: "medium", timeLimit: 60 },
          { id: "q4", text: "How does async/await work in JS?", difficulty: "medium", timeLimit: 60 },
          { id: "q5", text: "How would you optimize a large React app?", difficulty: "hard", timeLimit: 120 },
          { id: "q6", text: "Explain scaling Node.js apps.", difficulty: "hard", timeLimit: 120 },
        ];
      }

      // Step 3: Start interview session
      dispatch(startSession({ questions }));

      // Step 4: Navigate to interview page
      setTimeout(() => navigate(`/interview/${candidateId}`), 800);

    } catch (err) {
      console.error(err);
      message.error("Resume processing failed. Please try again.");
      setIsLoading(false);
    }

    return false; // prevent default upload
  }

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        background: 'linear-gradient(135deg, #001529 0%, #1890ff 100%)', padding: '20px'
      }}>
        <Card style={{ padding: '40px', textAlign: 'center', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', background: 'white' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />} />
          <Title level={3} style={{ marginTop: 20 }}>Processing Resume...</Title>
          <Text>Please wait while we prepare your interview session.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: 'linear-gradient(135deg, #001529 0%, #1890ff 100%)', padding: '20px'
    }}>
      <Card style={{ width: '400px', textAlign: 'center', padding: '40px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', background: 'white' }}>
        <Title level={2}>Start Your Interview</Title>
        <Text style={{ display: 'block', marginBottom: 20, color: '#666' }}>
          Upload your resume to begin
        </Text>

        <Dragger 
          beforeUpload={handleFile} 
          accept=".pdf,.doc,.docx" 
          multiple={false} 
          disabled={isLoading}
          style={{ padding: '30px', borderRadius: '12px', border: '2px dashed #1890ff', background: '#f0f5ff' }}
        >
          <CloudUploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={4}>Upload Resume</Title>
          <Text>Drag & drop your PDF or DOCX here, or click to select</Text>
        </Dragger>
      </Card>
    </div>
  );
}
