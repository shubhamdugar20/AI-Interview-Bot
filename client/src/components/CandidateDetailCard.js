import React from "react";
import { Card, Row, Col, Typography, List, Tag, Progress, Descriptions } from "antd";
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  StarOutlined,
  FileTextOutlined 
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function CandidateDetailCard({ candidate }) {
  const {
    name,
    email,
    phone,
    finalScore,
    summary,
    transcript = []
  } = candidate;

  // Calculate average score from transcript if finalScore is not available
  const calculatedScore = finalScore || (transcript.length > 0 
    ? transcript.reduce((sum, item) => sum + (item.score || 0), 0) / transcript.length 
    : 0
  );

  const getScoreColor = (score) => {
    if (score >= 8) return '#52c41a';
    if (score >= 6) return '#faad14';
    return '#f5222d';
  };

  const getPerformanceLevel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Candidate Basic Info Card */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 24,
                color: 'white'
              }}>
                <UserOutlined />
              </div>
              <Title level={3} style={{ margin: 0 }}>{name}</Title>
              <Text type="secondary">Candidate</Text>
            </div>
          </Col>
          
          <Col xs={24} md={16}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card size="small">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MailOutlined style={{ color: '#1890ff' }} />
                    <div>
                      <Text strong>Email</Text>
                      <br />
                      <Text>{email}</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              
              <Col xs={24} sm={12}>
                <Card size="small">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PhoneOutlined style={{ color: '#52c41a' }} />
                    <div>
                      <Text strong>Phone</Text>
                      <br />
                      <Text>{phone}</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              
              <Col xs={24} sm={12}>
                <Card size="small">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <div style={{ flex: 1 }}>
                      <Text strong>Final Score</Text>
                      <br />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Progress 
                          type="circle" 
                          percent={calculatedScore * 10} 
                          width={40}
                          format={() => `${calculatedScore.toFixed(1)}`}
                          strokeColor={getScoreColor(calculatedScore)}
                        />
                        <Tag color={getScoreColor(calculatedScore)}>
                          {getPerformanceLevel(calculatedScore)}
                        </Tag>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Interview Summary Card */}
      <Card 
        title={
          <span>
            <FileTextOutlined style={{ marginRight: 8 }} />
            Interview Summary
          </span>
        }
        style={{ marginBottom: 24 }}
      >
        {summary ? (
          <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
            {summary}
          </Paragraph>
        ) : (
          <Text type="secondary">No summary available for this candidate.</Text>
        )}
      </Card>

      {/* Interview Transcript Card */}
      <Card 
        title={
          <span>
            <FileTextOutlined style={{ marginRight: 8 }} />
            Interview Transcript
          </span>
        }
      >
        {transcript.length > 0 ? (
          <List
            dataSource={transcript}
            renderItem={(item, index) => (
              <List.Item key={index}>
                <Card 
                  size="small" 
                  style={{ width: '100%' }}
                  title={`Question ${index + 1}`}
                  extra={
                    <Tag color={getScoreColor(item.score)}>
                      Score: {item.score}/10
                    </Tag>
                  }
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Question">
                      <Text strong>{item.question}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Candidate's Answer">
                      <Paragraph style={{ margin: 0 }}>{item.answer}</Paragraph>
                    </Descriptions.Item>
                    {item.feedback && (
                      <Descriptions.Item label="AI Feedback">
                        <Text type="secondary">{item.feedback}</Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">No transcript available for this candidate.</Text>
        )}
      </Card>
    </div>
  );
}