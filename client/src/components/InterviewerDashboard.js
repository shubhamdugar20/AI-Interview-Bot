import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Table, Card, Tag, Tooltip, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import CandidateDetailCard from "./CandidateDetailCard"; // We'll create this component

export default function InterviewerDashboard() {
  const candidates = useSelector(s => s.candidates.list);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const columns = [
    { 
      title: "Name", 
      dataIndex: "name", 
      key: "name",
      width: 150
    },
    { 
      title: "Email", 
      dataIndex: "email", 
      key: "email",
      width: 200
    },
    { 
      title: "Phone", 
      dataIndex: "phone", 
      key: "phone",
      width: 150
    },
    { 
      title: "Score", 
      dataIndex: "finalScore", 
      key: "score", 
      sorter: (a,b) => (a.finalScore||0) - (b.finalScore||0),
      render: (score) => score ? (
        <Tag color={score >= 7 ? 'green' : score >= 5 ? 'orange' : 'red'}>
          {score}/10
        </Tag>
      ) : <Tag>Not assessed</Tag>,
      width: 100
    },
    { 
      title: "Interview Summary", 
      dataIndex: "summary", 
      key: "summary",
      render: (summary) => {
        if (!summary) return <span style={{ color: '#999' }}>No summary available</span>;
        
        return (
          <Tooltip title={summary} placement="topLeft">
            <div style={{ 
              maxWidth: 300, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              cursor: 'help'
            }}>
              {summary}
            </div>
          </Tooltip>
        );
      }
    },
    { 
      title: "Actions", 
      key: "actions", 
      render: (_, record) => (
        <Button 
          type="link" 
          onClick={() => setSelectedCandidate(record)}
          style={{ padding: 0 }}
        >
          View Details
        </Button>
      ),
      width: 120
    }
  ];

  // If a candidate is selected, show their details
  if (selectedCandidate) {
    return (
      <div style={{ padding: '24px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => setSelectedCandidate(null)}
          style={{ marginBottom: 16 }}
        >
          Back to Dashboard
        </Button>
        <CandidateDetailCard candidate={selectedCandidate} />
      </div>
    );
  }

  
  return (
    <Card title="Candidates Dashboard">
      <Table 
        dataSource={candidates} 
        columns={columns} 
        rowKey="id"
        scroll={{ x: 800 }}
        locale={{ emptyText: "No candidates found" }}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}