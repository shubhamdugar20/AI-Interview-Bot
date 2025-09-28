// components/WelcomeBackModal.js
import React from 'react';
import { Modal, Typography, Button, Card, Row, Col, Tag, Progress } from 'antd';
import { PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function WelcomeBackModal({ visible, onContinue, onRestart, session }) {
  const currentQuestionIndex = session?.currentQuestionIndex || 0;
  const totalQuestions = session?.questions?.length || 0;
  const progress = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
  
  return (
    <Modal
      title="Welcome Back!"
      open={visible}
      width={500}
      footer={null}
      closable={false}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={4}>We found your previous interview session</Title>
        <Text type="secondary">You can continue where you left off.</Text>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <Row gutter={16} align="middle">
          <Col span={18}>
            <Text strong>Your Progress</Text>
            <div style={{ marginTop: 8 }}>
              <Progress percent={Math.round(progress)} status="active" size="small" />
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </Text>
          </Col>
          <Col span={6} style={{ textAlign: 'center' }}>
            <Tag color="blue">In Progress</Tag>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={24}>
          <Button 
            type="primary" 
            size="large" 
            onClick={onContinue}
            icon={<PlayCircleOutlined />}
            style={{ width: '100%', height: '50px' }}
          >
            Continue Interview
          </Button>
        </Col>
      </Row>
    </Modal>
  );
}