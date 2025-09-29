import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { submitAnswer } from "../store/sessionSlice";
import { addTranscriptEntry, setFinalScore } from "../store/candidateSlice";
import Timer from "./Timer";
import { callOpenAI } from "../api/openai";
import { Card, Input, Button, message, Typography, Avatar, Progress, Row, Col, Tag } from "antd";
import { UserOutlined, RobotOutlined, SendOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text, Title } = Typography;

export default function InterviewChat() {
  const { candidateId } = useParams();
  const dispatch = useDispatch();
  const session = useSelector(s => s.session);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const curIndex = session.currentQuestionIndex;
  const curQ = session.questions[curIndex];
  const remaining = curQ ? session.timers[curQ.id] : 0;
  const totalQuestions = session.questions.length;
  const progressPercentage = ((curIndex) / totalQuestions) * 100;

  // Force save to localStorage on important events
  useEffect(() => {
    const forceSave = () => {
      // This ensures data is flushed to localStorage
      if (window.__PERSISTOR) {
        window.__PERSISTOR.flush();
      }
    };

    // Save when component mounts
    forceSave();

    // Save when user leaves the page
    const handleBeforeUnload = () => {
      forceSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      forceSave();
    };
  }, []);

  // Save on every answer submission
  useEffect(() => {
    if (session.answers.length > 0) {
      const forceSave = () => {
        if (window.__PERSISTOR) {
          window.__PERSISTOR.flush();
        }
      };
      // Small delay to ensure Redux state is updated
      setTimeout(forceSave, 100);
    }
  }, [session.answers.length]);

  // Scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.answers, curIndex]);

  // Auto-focus on input when new question appears
  useEffect(() => {
    const inputElement = document.querySelector('textarea');
    if (inputElement) {
      inputElement.focus();
    }
  }, [curIndex]);

  const chatMessages = [];

  // Add all previous questions and answers to chat
  session.questions.slice(0, curIndex).forEach((question, index) => {
    const answer = session.answers.find(ans => ans.questionId === question.id);
    
    // Add question
    chatMessages.push({
      type: 'question',
      content: question.text,
      timestamp: index,
      score: answer?.score
    });
    
    // Add answer
    if (answer) {
      chatMessages.push({
        type: 'answer',
        content: answer.answer,
        timestamp: index + 0.5,
        score: answer.score,
        feedback: answer.feedback
      });
    }
  });

  // Add current question
  if (curQ) {
    chatMessages.push({
      type: 'question',
      content: curQ.text,
      timestamp: curIndex,
      isCurrent: true
    });
  }

  async function handleSubmit(isAutoSubmit = false) {
    if (!curQ) return;
    
    setLoading(true);
    
    // Always use the current input text, even for auto-submit
    let ans = input.trim();
    
    // Only show time's up message if input is empty
    if (isAutoSubmit && !ans) {
      ans = "[Time's Up - Auto Submitted]";
    }
    
    console.log('Submitting answer - auto:', isAutoSubmit, 'answer:', ans);
    
    // Always try to get AI feedback for both manual and auto-submissions with actual content
    if (ans && ans !== "[Time's Up - Auto Submitted]") {
      const messages = [
        { 
          role: "system", 
          content: `You are an interview scoring assistant. Analyze the answer and provide a score from 0-10 with constructive feedback. 
          Important: Even if the answer is incomplete due to time constraints, provide an appropriate score and feedback based on what was written.
          Consider the context - if the answer seems cut off, evaluate what's present and mention it was likely due to time limits.` 
        },
        { 
          role: "user", 
          content: `Question: ${curQ.text}\nAnswer: ${ans}\n\nReturn JSON format: { "score": number, "feedback": "detailed feedback here" }` 
        }
      ];
      
      try {
        const resp = await callOpenAI(messages);
        const parsed = JSON.parse(resp.choices[0].message.content);
        
        // Submit answer for current question
        dispatch(submitAnswer({ 
          questionId: curQ.id, 
          answer: ans, 
          score: parsed.score, 
          feedback: parsed.feedback 
        }));
        
        // Add to transcript
        dispatch(addTranscriptEntry({ 
          id: candidateId, 
          entry: { 
            question: curQ.text, 
            answer: ans, 
            score: parsed.score, 
            feedback: parsed.feedback 
          } 
        }));
        
      } catch (error) {
        console.error("AI scoring failed:", error);
        message.error("AI scoring failed");
        // Fallback: if AI fails, use default values
        const fallbackScore = isAutoSubmit ? 0 : 5;
        const fallbackFeedback = isAutoSubmit ? 
          "Time's up - auto submitted with partial answer (AI evaluation failed)" : 
          "AI evaluation failed - manual review needed";
        
        dispatch(submitAnswer({ 
          questionId: curQ.id, 
          answer: ans, 
          score: fallbackScore, 
          feedback: fallbackFeedback 
        }));
        
        dispatch(addTranscriptEntry({ 
          id: candidateId, 
          entry: { 
            question: curQ.text, 
            answer: ans, 
            score: fallbackScore, 
            feedback: fallbackFeedback 
          } 
        }));
      }
    } else {
      // Handle empty answers or time's up with no input
      const feedback = isAutoSubmit ? 
        (ans ? "Time's up - submitted partial answer" : "Time's up - no answer provided") : 
        "Empty answer submitted";
      
      dispatch(submitAnswer({ 
        questionId: curQ.id, 
        answer: ans, 
        score: 0, 
        feedback: feedback 
      }));
      
      dispatch(addTranscriptEntry({ 
        id: candidateId, 
        entry: { 
          question: curQ.text, 
          answer: ans, 
          score: 0, 
          feedback: feedback 
        } 
      }));
    }
    
    // Force save after submission
    setTimeout(() => {
      if (window.__PERSISTOR) {
        window.__PERSISTOR.flush();
      }
    }, 200);
    
    // If this is the last question, calculate and set final score
    if (curIndex + 1 === session.questions.length) {
      const allAnswers = [...session.answers];
      const totalScore = allAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0);
      const averageScore = allAnswers.length > 0 ? totalScore / allAnswers.length : 0;
      
      dispatch(setFinalScore({ 
        id: candidateId, 
        score: Math.round(averageScore * 10) / 10,
        summary: `Final assessment based on 6 questions. Average score: ${Math.round(averageScore * 10) / 10}/10`
      }));
    }
    
    setInput("");
    setLoading(false);
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#52c41a';
    if (score >= 6) return '#faad14';
    return '#f5222d';
  };

  if (!curQ) {
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
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 4px 16px rgba(82, 196, 26, 0.3)'
          }}>
            <Text style={{ fontSize: '32px', color: 'white' }}>🎉</Text>
          </div>
          <Title level={2} style={{ color: '#001529', marginBottom: '16px' }}>
            Interview Completed!
          </Title>
          <Text style={{ fontSize: '16px', color: '#666', display: 'block', marginBottom: '30px' }}>
            Thank you for completing the interview. Your results have been saved.
          </Text>
          <div style={{ 
            padding: '20px',
            background: 'rgba(24, 144, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(24, 144, 255, 0.1)'
          }}>
            <Text strong style={{ color: '#001529', display: 'block', marginBottom: '8px' }}>
              Next Steps
            </Text>
            <Text style={{ color: '#666', fontSize: '14px' }}>
              Your results will be reviewed and you'll be contacted shortly.
            </Text>
          </div>
        </Card>
      </div>
    );
  }

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
          maxWidth: '1000px',
          height: '90vh',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
        bodyStyle={{ 
          padding: '0',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '24px',
          borderBottom: '1px solid #f0f0f0',
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          borderRadius: '16px 16px 0 0'
        }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                AI Interview Session
              </Title>
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Question {curIndex + 1} of {totalQuestions}
              </Text>
            </Col>
            <Col>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Tag color="blue" style={{ border: 'none', padding: '8px 12px' }}>
                  <ClockCircleOutlined /> Time: {curQ.timeLimit}s
                </Tag>
                <div style={{ textAlign: 'right' }}>
                  <Text style={{ color: 'white', fontSize: '12px', display: 'block' }}>Progress</Text>
                  <Progress 
                    percent={progressPercentage} 
                    size="small" 
                    strokeColor="#fff"
                    showInfo={false}
                  />
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Chat Messages */}
        <div 
          style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            background: '#fafafa'
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {chatMessages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  marginBottom: '20px',
                  justifyContent: message.type === 'question' ? 'flex-start' : 'flex-end'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: message.type === 'question' ? 'row' : 'row-reverse',
                    alignItems: 'flex-start',
                    maxWidth: '70%',
                    gap: '12px'
                  }}
                >
                  <Avatar
                    size="large"
                    icon={message.type === 'question' ? <RobotOutlined /> : <UserOutlined />}
                    style={{
                      backgroundColor: message.type === 'question' ? '#1890ff' : '#52c41a',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <div
                    style={{
                      background: message.type === 'question' ? 'white' : 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      padding: '16px 20px',
                      borderRadius: '18px',
                      border: message.isCurrent ? '2px solid #1890ff' : '1px solid #e8e8e8',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      position: 'relative'
                    }}
                  >
                    <Text style={{ 
                      color: message.type === 'question' ? '#001529' : 'white',
                      lineHeight: '1.5'
                    }}>
                      {message.content}
                    </Text>
                    
                    {message.score !== undefined && (
                      <div style={{ marginTop: '12px' }}>
                        <Tag 
                          color={getScoreColor(message.score)}
                          style={{ 
                            border: 'none',
                            color: 'white',
                            fontWeight: '600'
                          }}
                        >
                          Score: {message.score}/10
                        </Tag>
                        {message.feedback && (
                          <Text 
                            style={{ 
                              fontSize: '12px', 
                              color: message.type === 'question' ? '#666' : 'rgba(255, 255, 255, 0.8)',
                              display: 'block',
                              marginTop: '8px'
                            }}
                          >
                            {message.feedback}
                          </Text>
                        )}
                      </div>
                    )}
                    
                    {message.isCurrent && (
                      <div style={{ marginTop: '16px' }}>
                        <Timer 
                          questionId={curQ.id} 
                          remaining={remaining} 
                          total={curQ.timeLimit} 
                          onTimeUp={() => handleSubmit(true)}
                          difficulty={curQ.difficulty}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div style={{ 
          padding: '24px',
          borderTop: '1px solid #f0f0f0',
          background: 'white'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <TextArea
              rows={3}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your answer here... (Press Enter to send, Shift+Enter for new line)"
              disabled={loading}
              style={{ 
                marginBottom: '12px',
                borderRadius: '12px',
                border: '2px solid #e8e8e8',
                padding: '16px',
                fontSize: '14px',
                resize: 'none'
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSubmit(false)}
              loading={loading}
              disabled={!input.trim()}
              style={{ 
                width: '100%',
                height: '50px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Submit Answer {remaining > 0 && `(${remaining}s remaining)`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}