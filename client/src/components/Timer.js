import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { tickTimer } from "../store/sessionSlice";
import { Progress, Typography } from "antd";

const { Text } = Typography;

export default function Timer({ questionId, remaining, total, onTimeUp }) {
  const dispatch = useDispatch();
  
  // Use refs to store the latest values without causing re-renders
  const onTimeUpRef = useRef(onTimeUp);
  const questionIdRef = useRef(questionId);
  
  // Update refs when props change
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
    questionIdRef.current = questionId;
  }, [onTimeUp, questionId]);

  useEffect(() => {
    console.log('Timer effect - remaining:', remaining, 'questionId:', questionId);
    
    if (remaining <= 0) {
      console.log('⏰ TIME UP! Calling onTimeUp');
      onTimeUpRef.current();
      return;
    }

    const timer = setInterval(() => {
      console.log('Timer tick - question:', questionIdRef.current);
      dispatch(tickTimer(questionIdRef.current));
    }, 1000);
    
    return () => {
      console.log('Clearing timer interval');
      clearInterval(timer);
    };
  }, [remaining, dispatch]); // Only depend on remaining and dispatch

  const getProgressColor = () => {
    const percentage = (remaining / total) * 100;
    if (percentage > 50) return '#52c41a';
    if (percentage > 25) return '#faad14';
    return '#f5222d';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Progress 
        type="circle" 
        percent={(remaining / total) * 100} 
        width={40}
        format={() => `${remaining}`}
        strokeColor={getProgressColor()}
      />
      <Text type="secondary" style={{ fontSize: '12px' }}>
        seconds remaining
      </Text>
    </div>
  );
}