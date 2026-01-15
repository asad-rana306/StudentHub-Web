import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem('jwtToken');

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        // Detects if we are using Vite or Create-React-App
const baseUrl = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL;

const res = await fetch(
  `${baseUrl}/students/checkAndGetData`,
  { headers: { Authorization: `Bearer ${token}` } }
);

        if (res.status === 204 || res.status === 404) {
          navigate('/fill-form', { replace: true });
          return;
        }

        const text = (await res.text()).trim();
        if (!text || text === 'null' || text === '{}' || text === '[]') {
          navigate('/fill-form', { replace: true });
          return;
        }

        const parsed = JSON.parse(text);
        if (!parsed || Object.keys(parsed).length === 0) {
          navigate('/fill-form', { replace: true });
          return;
        }

        setData(parsed);
      } catch {
        navigate('/fill-form', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, token]);

  const handleSignOut = () => {
    localStorage.removeItem('jwtToken');
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="loading-box">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="loading-wrap">
        <div className="loading-box">No data available</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        {/* Header */}
        <div className="dashboard-header">
          {/* Left: Title & Subtitle */}
          <div className="header-left">
            <h1 className="dashboard-title">{data.studentName || 'Student Dashboard'}</h1>
            <div className="dashboard-subtitle">{data.regNumber || ''}</div>
          </div>

          {/* Center: Navigation Menu */}
          <nav className="header-nav">
            <button onClick={() => navigate('/clash-solver')} className="nav-link">
              Clash Solver
            </button>
            <button onClick={() => navigate('/add-section')} className="nav-link">
              Add Section
            </button>
            <button onClick={() => navigate('/past-paper')} className="nav-link">
              Past Paper
            </button>
            <button onClick={() => navigate('/teacher-recommendation')} className="nav-link">
              Teacher Recommendation
            </button>
            <button onClick={() => navigate('/grade-calculation')} className="nav-link">
              Grade Calculation
            </button>
            <button onClick={() => navigate('/clash-solver')} className="nav-link">
              Clash Solver
            </button>
            <button onClick={handleSignOut} className="nav-link sign-out">
              Sign out
            </button>
          </nav>

          {/* Right: Avatar */}
          <div className="avatar-wrap">
            {data.image ? (
              <img
                src={`data:image/jpeg;base64,${data.image}`}
                alt="Profile"
                className="avatar-img"
              />
            ) : (
              <div className="avatar-placeholder">No Image</div>
            )}
          </div>
        </div>

        {/* Body Layout */}
        <div className="dashboard-body">
          <div className="dashboard-col">
            <Section title="Academic Information">
              <Info label="Department" value={data.department} />
              <Info label="Program" value={data.program} />
              <Info label="Semester" value={data.semester} />
              <Info label="Batch" value={data.batch} />
              <Info label="Section" value={data.section} />
              <Info label="Status" value={data.status} />
              <Info label="CGPA" value={data.cgpa} />
              <Info label="GPA" value={data.gpa} />
              <Info label="Completed Credits" value={data.completedCredits} />
            </Section>
          </div>

          <div className="dashboard-col">
            <Section title="Personal Information">
              <Info label="Father Name" value={data.fatherName} />
              <Info label="CNIC" value={data.cnic} />
              <Info label="Gender" value={data.gender} />
              <Info label="Date of Birth" value={data.dateOfBirth} />
              <Info label="Email" value={data.email} />
              <Info label="Contact" value={data.contactNumber} />
            </Section>

            {data.currentSubjects?.length > 0 && (
              <Section title="Current Subjects">
                <div className="tags-wrap">
                  {data.currentSubjects.map((s, i) => (
                    <span key={i} className="subject-tag">
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- helper components ---------------- */

function Section({ title, children }) {
  return (
    <div className="section-wrap">
      <h2 className="section-title">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="info-box">
      <div className="info-label">{label}</div>
      <div className="info-value">{value ?? '—'}</div>
    </div>
  );
}