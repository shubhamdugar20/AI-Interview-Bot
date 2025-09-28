import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { List, Typography, Button, Card } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

export default function CandidateDetail() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const candidates = useSelector(s => s.candidates.list);
  
  // Find the candidate from Redux store
  const candidate = candidates.find(c => c.id === candidateId);

  if (!candidate) {
    return (
      <Card>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/interviewer')}
          style={{ marginBottom: 16 }}
        >
          Back to Dashboard
        </Button>
        <Typography.Text type="danger">Candidate data not found</Typography.Text>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Back button */}
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/interviewer')}
        style={{ marginBottom: 16 }}
      >
        Back to Dashboard
      </Button>

      {/* Candidate information */}
      <Card title="Candidate Information" style={{ marginBottom: 16 }}>
        <Typography.Title level={4}>{candidate.name}</Typography.Title>
        <p><strong>Email:</strong> {candidate.email}</p>
        <p><strong>Phone:</strong> {candidate.phone}</p>
        <p><strong>Final Score:</strong> {candidate.finalScore || 'Not assessed'}</p>
        <p><strong>Summary:</strong> {candidate.summary || 'No summary available'}</p>
      </Card>

      {/* Interview transcript */}
      <Card title="Interview Transcript">
        <List
          dataSource={candidate.transcript || []}
          renderItem={(item, index) => (
            <List.Item key={index}>
              <div style={{ width: '100%' }}>
                <Typography.Text strong>Question {index + 1}:</Typography.Text>
                <div style={{ marginBottom: 8 }}>{item.question}</div>
                
                <Typography.Text strong>Answer:</Typography.Text>
                <div style={{ marginBottom: 8 }}>{item.answer}</div>
                
                <div>
                  <Typography.Text strong>Score: </Typography.Text>
                  {item.score || 'Not scored'} 
                  {item.feedback && (
                    <>
                      <Typography.Text strong> — Feedback: </Typography.Text>
                      {item.feedback}
                    </>
                  )}
                </div>
              </div>
            </List.Item>
          )}
          locale={{ emptyText: "No interview data available" }}
        />
      </Card>
    </div>
  );
}