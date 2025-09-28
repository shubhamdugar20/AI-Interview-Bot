// App.js
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Layout, Menu } from "antd";
import ResumeUploader from "./components/ResumeUploader";
import InterviewChat from "./components/InterviewChat";
import InterviewerDashboard from "./components/InterviewerDashboard";

const { Header, Content } = Layout;

export default function App() {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: "100vh" }}>
        <Header>
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={["1"]}>
            <Menu.Item key="1"><Link to="/">Upload Resume</Link></Menu.Item>
            <Menu.Item key="2"><Link to="/dashboard">Dashboard</Link></Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: 20 }}>
          <Routes>
            <Route path="/" element={<ResumeUploader />} />
            <Route path="/interview/:candidateId" element={<InterviewChat />} />
            <Route path="/dashboard" element={<InterviewerDashboard />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
}