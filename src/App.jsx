import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/login';
import Dashboard from './components/Dashboard';
import Signup from './components/signup';
import FillForm from './components/FillForm';
import GradeCal from './components/GradeCal';
import PastPaper from './components/PastPaper';
import AddSection from './components/addSection';
import ClashSolver from './components/clash/ClashSolver';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/fill-form" element={<FillForm />} />
        <Route path="/grade-calculation" element={<GradeCal />} />
        <Route path="/past-paper" element={<PastPaper />} />
        <Route path="/add-section" element={<AddSection />} />
        <Route path="/clash-solver" element={<ClashSolver />} />

      </Routes>
    </Router>
  );
}

export default App;
