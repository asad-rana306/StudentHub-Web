import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/GradeCal.css';

// Helper to safely parse inputs to numbers
const safeParse = (val) => (val === '' ? 0 : parseFloat(val));

export default function GradeCal() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('both'); // 'both', 'theory', 'lab'
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initial State Structure
  const [formData, setFormData] = useState({
    // Configuration
    creditHours: 3,
    labCreditHours: 1,

    // Theory (Dynamic Arrays stored as objects for UI: { obt: '', total: '' })
    tAssignments: [{ obt: '', total: '' }],
    tQuizzes: [{ obt: '', total: '' }],
    tMid: '',
    tMidTotal: '',
    tFinal: '',
    tFinalTotal: '',

    // Lab
    lAssignments: [{ obt: '', total: '' }],
    lMid: '',
    lMidTotal: '',
    lFinal: '',
    lFinalTotal: '',
  });

  // --- Handlers ---

  // Handle simple field changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle dynamic array changes (Assignments/Quizzes)
  const handleArrayChange = (arrayName, index, key, value) => {
    const updatedArray = [...formData[arrayName]];
    updatedArray[index][key] = value;
    setFormData((prev) => ({ ...prev, [arrayName]: updatedArray }));
  };

  // Add new row
  const addRow = (arrayName) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], { obt: '', total: '' }],
    }));
  };

  // Remove row
  const removeRow = (arrayName, index) => {
    const updatedArray = formData[arrayName].filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, [arrayName]: updatedArray }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // 1. Construct Payload
    // Use the structure exactly as your Java class expects.
    const payload = {
      creditHours: parseInt(formData.creditHours),
      // Only include labCreditHours if we are in lab or both mode
      labCreditHours: (mode === 'theory') ? 0 : parseInt(formData.labCreditHours),
      
      // Initialize all lists as empty/defaults to prevent NullPointerExceptions on backend
      tassignment: [],
      outofassignment: [],
      tquiz: [],
      outoftquiz: [],
      tmid: 0,
      outoftmid: 0,
      tfinals: 0,
      outoftfinals: 0,
      labassignment: [],
      outoflabassignment: [],
      labmid: 0,
      outoflabmid: 0,
      labfinals: 0,
      outoflabfinals: 0,
    };

    // 2. Fill Data based on Mode
    if (mode === 'both' || mode === 'theory') {
      payload.tassignment = formData.tAssignments.map(i => safeParse(i.obt));
      payload.outofassignment = formData.tAssignments.map(i => safeParse(i.total));
      
      payload.tquiz = formData.tQuizzes.map(i => safeParse(i.obt));
      payload.outoftquiz = formData.tQuizzes.map(i => safeParse(i.total));

      payload.tmid = safeParse(formData.tMid);
      payload.outoftmid = safeParse(formData.tMidTotal);

      payload.tfinals = safeParse(formData.tFinal);
      payload.outoftfinals = safeParse(formData.tFinalTotal);
    }

    if (mode === 'both' || mode === 'lab') {
      payload.labassignment = formData.lAssignments.map(i => safeParse(i.obt));
      payload.outoflabassignment = formData.lAssignments.map(i => safeParse(i.total));

      payload.labmid = safeParse(formData.lMid);
      payload.outoflabmid = safeParse(formData.lMidTotal);

      payload.labfinals = safeParse(formData.lFinal);
      payload.outoflabfinals = safeParse(formData.lFinalTotal);
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      const res = await fetch(`${baseUrl}/cui-cal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` 
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text(); 
      
      try {
        const data = JSON.parse(text);
        setResult(data);
      } catch (err) {
        // If parsing fails, it's likely a raw string (e.g., "A", "3.5", or "Error")
        // We create a simple object to display it
        setResult({ text });
      }

    } catch (error) {
      console.error(error);
      setResult({ error: "Connection Failed or Server Error" });
    } finally {
      setLoading(false);
    }
  };

  // --- Render Helpers ---

  const renderDynamicInputs = (label, arrayName) => (
    <div className="form-section">
      <label className="section-label">{label}</label>
      {formData[arrayName].map((item, index) => (
        <div key={index} className="input-row">
          <div className="input-group">
            <label>Obtained</label>
            <input
              type="number"
              className="form-input"
              value={item.obt}
              onChange={(e) => handleArrayChange(arrayName, index, 'obt', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="input-group">
            <label>Total</label>
            <input
              type="number"
              className="form-input"
              value={item.total}
              onChange={(e) => handleArrayChange(arrayName, index, 'total', e.target.value)}
              placeholder="10"
            />
          </div>
          {formData[arrayName].length > 1 && (
            <button type="button" className="action-btn remove" onClick={() => removeRow(arrayName, index)}>
              X
            </button>
          )}
        </div>
      ))}
      <button type="button" className="action-btn" onClick={() => addRow(arrayName)}>
        + Add {label}
      </button>
    </div>
  );

  const renderSingleInput = (label, obField, totField) => (
    <div className="input-row">
      <div className="input-group">
        <label>{label} Obtained</label>
        <input
          type="number"
          className="form-input"
          value={formData[obField]}
          onChange={(e) => handleChange(obField, e.target.value)}
        />
      </div>
      <div className="input-group">
        <label>{label} Total</label>
        <input
          type="number"
          className="form-input"
          value={formData[totField]}
          onChange={(e) => handleChange(totField, e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <div className="grade-page">
      <div className="grade-card">
        <div className="grade-header">
          <h1 className="grade-title">CUI Grade Calculator</h1>
          <button onClick={() => navigate(-1)} style={{border:'none', background:'none', color:'#666', cursor:'pointer'}}>
            &larr; Back to Dashboard
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          {['both', 'theory', 'lab'].map((m) => (
            <button
              key={m}
              className={`toggle-btn ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Credit Hours Config */}
          <div className="form-section">
            <div className="input-row">
              <div className="input-group">
                <label>Total Credit Hours</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.creditHours}
                  onChange={(e) => handleChange('creditHours', e.target.value)}
                />
              </div>
              {mode !== 'theory' && (
                <div className="input-group">
                  <label>Lab Credit Hours</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.labCreditHours}
                    onChange={(e) => handleChange('labCreditHours', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Theory Section */}
          {(mode === 'both' || mode === 'theory') && (
            <>
              {renderDynamicInputs("Theory Assignments", "tAssignments")}
              {renderDynamicInputs("Theory Quizzes", "tQuizzes")}
              <div className="form-section">
                <label className="section-label">Theory Exams</label>
                {renderSingleInput("Mid Term", "tMid", "tMidTotal")}
                {renderSingleInput("Final Term", "tFinal", "tFinalTotal")}
              </div>
            </>
          )}

          {/* Lab Section */}
          {(mode === 'both' || mode === 'lab') && (
            <>
              {renderDynamicInputs("Lab Assignments / Tasks", "lAssignments")}
              <div className="form-section">
                <label className="section-label">Lab Exams</label>
                {renderSingleInput("Lab Mid", "lMid", "lMidTotal")}
                {renderSingleInput("Lab Final", "lFinal", "lFinalTotal")}
              </div>
            </>
          )}

          <button type="submit" className="calc-btn" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Grade'}
          </button>
        </form>

        {/* Result Display */}
        {result && (
          <div className="result-box">
            {result.error ? (
              <div style={{color: '#dc2626'}}>{result.error}</div>
            ) : (
              <div>
                <h3 className="result-title">Calculation Result</h3>
                <pre style={{whiteSpace: 'pre-wrap', fontFamily: 'inherit'}}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}