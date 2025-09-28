import React, { useState } from "react";
import { Upload, message, Card, Typography, Row, Col, Tag, Divider, Spin, Result } from "antd";
import { 
  CloudUploadOutlined,
  FileTextOutlined,
  UserOutlined,
  RocketOutlined,
  BulbOutlined,
  StarOutlined,
  LoadingOutlined
} from "@ant-design/icons";
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
  const [uploadProgress, setUploadProgress] = useState("");

  async function handleFile(file) {
    setIsLoading(true);
    setUploadProgress("Processing your resume...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const resp = await axios.post("http://localhost:3001/api/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const parsed = resp.data || { name: "", email: "", phone: "" };
      const id = uuidv4();
      dispatch(addCandidate({ id, ...parsed }));

      setUploadProgress("Generating personalized interview questions...");

      let questions = [];
      try {
        const aiResp = await axios.post("http://localhost:3001/api/openai", {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an expert interview question generator. Generate exactly 6 questions for a candidate based on Node.js and React. Return JSON array structure where each object has {id:'q1', text:'...', difficulty:'easy|medium|hard', timeLimit:20} properties. 2 easy, 2 medium, 2 hard.",
            },
            {
              role: "user",
              content: `Candidate Info:\nName: ${parsed.name}\nEmail: ${parsed.email}\nPhone: ${parsed.phone}`,
            },
          ],
          response_format: { type: "json_object" },
        });

        let jsonString = aiResp.data.choices[0].message.content;
        jsonString = jsonString.replace(/```json|```/g, '').trim(); 
        questions = JSON.parse(jsonString);

      } catch (err) {
        console.warn("AI question generation failed, using fallback questions.", err);
        questions = [
          { id: "q1", text: "Explain useState in React.", difficulty: "easy", timeLimit: 20 },
          { id: "q2", text: "What is Express middleware?", difficulty: "easy", timeLimit: 20 },
          { id: "q3", text: "Explain Redux flow.", difficulty: "medium", timeLimit: 60 },
          { id: "q4", text: "How does async/await work in JS?", difficulty: "medium", timeLimit: 60 },
          { id: "q5", text: "How would you optimize a large React app?", difficulty: "hard", timeLimit: 120 },
          { id: "q6", text: "Explain scaling Node.js apps.", difficulty: "hard", timeLimit: 120 },
        ];
      }

      dispatch(startSession({ questions }));
      
      setUploadProgress("Starting your interview session...");

      setTimeout(() => {
        navigate(`/interview/${id}`);
      }, 1500);
      
    } catch (err) {
      console.error(err);
      message.error("Resume processing failed. Please try again.");
      setIsLoading(false);
      setUploadProgress("");
    }

    return false;
  }

  // Loading State
  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh',
        background: 'linear-gradient(135deg, #001529 0%, #1890ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Card 
          style={{ 
            width: '500px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
          bodyStyle={{ padding: '40px', textAlign: 'center' }}
        >
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />} 
            size="large"
          />
          <Title level={3} style={{ marginTop: 20, color: '#001529' }}>
            Preparing Your Interview
          </Title>
          <Text style={{ fontSize: '16px', color: '#666', display: 'block', marginBottom: 20 }}>
            {uploadProgress}
          </Text>
          <div style={{ marginTop: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
              <Tag color="blue">Resume Parsed</Tag>
              <Tag color={uploadProgress.includes("questions") ? "blue" : "default"}>Questions Generated</Tag>
              <Tag color={uploadProgress.includes("Starting") ? "blue" : "default"}>Session Ready</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              This may take a few moments...
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  // Main Upload Interface
  return (
    <div style={{ 
      height: '100vh',
      background: 'linear-gradient(135deg, #001529 0%, #1890ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '95%',
          maxWidth: '1200px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <Row gutter={40} align="middle">
          {/* Left Side - Upload Section */}
          <Col xs={24} md={12}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 4px 16px rgba(24, 144, 255, 0.3)'
              }}>
                <RocketOutlined style={{ fontSize: '32px', color: 'white' }} />
              </div>
              <Title level={2} style={{ color: '#001529', marginBottom: '8px' }}>
                Start Your Interview
              </Title>
              <Text style={{ fontSize: '16px', color: '#666' }}>
                Upload your resume to begin the AI-powered interview
              </Text>
            </div>

            <Dragger 
              beforeUpload={handleFile} 
              accept=".pdf,.docx,.doc" 
              multiple={false}
              disabled={isLoading}
              style={{ 
                border: '2px dashed #1890ff',
                borderRadius: '12px',
                background: 'rgba(24, 144, 255, 0.02)',
                padding: '40px 20px'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <CloudUploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <Title level={4} style={{ color: '#001529', marginBottom: '8px' }}>
                  Upload Resume
                </Title>
                <Text style={{ color: '#666', display: 'block', marginBottom: '20px' }}>
                  Drag & drop your PDF or DOCX file here
                </Text>
                <div style={{ 
                  padding: '12px 32px', 
                  background: '#1890ff', 
                  color: 'white',
                  borderRadius: '6px',
                  display: 'inline-block',
                  fontWeight: '500',
                  fontSize: '16px'
                }}>
                  Choose File
                </div>
                <Text style={{ 
                  display: 'block', 
                  marginTop: '16px', 
                  color: '#999',
                  fontSize: '12px'
                }}>
                  Supports: PDF, DOCX • Max: 10MB
                </Text>
              </div>
            </Dragger>
          </Col>

          {/* Right Side - Features */}
          <Col xs={24} md={12}>
            <div style={{ paddingLeft: '20px' }}>
              <Title level={3} style={{ color: '#001529', marginBottom: '30px' }}>
                AI-Powered Interview Features
              </Title>
              
              <div style={{ marginBottom: '30px' }}>
                {[
                  { icon: <FileTextOutlined />, title: "Resume Analysis", desc: "AI extracts your skills and experience" },
                  { icon: <BulbOutlined />, title: "Smart Questions", desc: "Personalized questions based on your profile" },
                  { icon: <StarOutlined />, title: "Real-time Scoring", desc: "Instant AI evaluation and feedback" },
                  { icon: <UserOutlined />, title: "Progress Tracking", desc: "Monitor your performance throughout" }
                ].map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginBottom: '20px',
                    padding: '15px',
                    background: 'rgba(24, 144, 255, 0.05)',
                    borderRadius: '10px',
                    border: '1px solid rgba(24, 144, 255, 0.1)'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(24, 144, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '15px',
                      flexShrink: 0
                    }}>
                      {React.cloneElement(item.icon, { style: { color: '#1890ff', fontSize: '18px' } })}
                    </div>
                    <div>
                      <Text strong style={{ color: '#001529', fontSize: '16px', display: 'block' }}>
                        {item.title}
                      </Text>
                      <Text style={{ color: '#666', fontSize: '14px' }}>
                        {item.desc}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>

              <Divider />

              <div>
                <Title level={5} style={{ color: '#001529', marginBottom: '15px' }}>
                  What to Expect
                </Title>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Tag color="green">6 Questions</Tag>
                  <Tag color="orange">20-120s per question</Tag>
                  <Tag color="blue">AI Evaluation</Tag>
                  <Tag color="purple">Instant Results</Tag>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}