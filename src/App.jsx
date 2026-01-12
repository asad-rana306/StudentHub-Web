import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/login';
import Dashboard from './components/Dashboard';
import Signup from './components/signup';
import FillForm from './components/FillForm';
import GradeCal from './components/GradeCal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/fill-form" element={<FillForm />} />
        <Route path="/grade-calculation" element={<GradeCal />} />
      </Routes>
    </Router>
  );
}

export default App;
