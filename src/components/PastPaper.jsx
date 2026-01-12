import React, { useState, useEffect } from "react";
import axios from "axios"; // Ensure you have installed axios (npm install axios)

const PastPaper = () => {
  // --- STATES FOR FILTERING ---
  const [batch, setBatch] = useState("");
  const [university, setUniversity] = useState("");
  const [campus, setCampus] = useState("");
  const [examCategory, setExamCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  
  // --- STATE FOR RESULTS ---
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- DATA LISTS ---
  const batches = [
    "SP21", "FA21", "SP22", "FA22", "SP23", "FA23", "SP24", "FA24", "SP25", "FA25"
  ];

  const universities = ["COMSATS", "Punjab University"];

  // Dynamic Campus Logic
  const getCampuses = () => {
    if (university === "COMSATS") {
      return ["Lahore", "Islamabad", "Attock", "Abbottabad", "Vehari", "Sahiwal"];
    } else if (university === "Punjab University") {
      return [
        "Gujranwala Campus",
        "Jhelum Campus",
        "Khanaspur Campus",
        "Pothohar Campus (Gujar Khan)",
        "Allama Iqbal Campus (Old Campus)",
        "Quaid-e-Azam Campus"
      ];
    }
    return [];
  };

  // --- SEARCH HANDLER ---
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPapers([]);

    const combinedQuery = `${batch} ${university} ${campus} ${examCategory} ${keyword}`.trim();

    if (!combinedQuery) {
      setError("Please select at least one filter or enter a keyword.");
      setLoading(false);
      return;
    }

    try {
      // 2. Call the API
      const response = await axios.get(`http://localhost:8080/api/papers/search`, {
        params: { q: combinedQuery }
      });
      setPapers(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch papers. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };
    // 1. Combine all fields into one query string for the backend
    // We join them with spaces because your backend splits by space

  // --- PDF VIEW HANDLER ---
  const openPdf = (base64Pdf) => {
    if (!base64Pdf) {
      alert("No PDF file attached to this record.");
      return;
    }

    // Convert Base64 string to a Blob
    const byteCharacters = atob(base64Pdf);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });

    // Create a temporary URL and open in new tab
    const fileURL = URL.createObjectURL(blob);
    window.open(fileURL, "_blank");
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Past Paper Search</h2>

      {/* --- SEARCH FORM --- */}
      <div className="card p-4 mb-5 shadow-sm">
        <form onSubmit={handleSearch}>
          <div className="row g-3">
            
            {/* Batch Select */}
            <div className="col-md-3">
              <label className="form-label">Batch</label>
              <select className="form-select" value={batch} onChange={(e) => setBatch(e.target.value)}>
                <option value="">Select Batch</option>
                {batches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* University Select */}
            <div className="col-md-3">
              <label className="form-label">University</label>
              <select 
                className="form-select" 
                value={university} 
                onChange={(e) => {
                  setUniversity(e.target.value);
                  setCampus(""); // Reset campus when university changes
                }}
              >
                <option value="">Select University</option>
                {universities.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Campus Select (Dependent) */}
            <div className="col-md-3">
              <label className="form-label">Campus</label>
              <select 
                className="form-select" 
                value={campus} 
                onChange={(e) => setCampus(e.target.value)}
                disabled={!university} // Disable if no university selected
              >
                <option value="">Select Campus</option>
                {getCampuses().map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Exam Category Select */}
            <div className="col-md-3">
              <label className="form-label">Exam Category</label>
              <select className="form-select" value={examCategory} onChange={(e) => setExamCategory(e.target.value)}>
                <option value="">Select Category</option>
                <option value="Mid Theory">Mid Theory</option>
                <option value="Final Theory">Final Theory</option>
                <option value="Mid Lab">Mid Lab</option>
                <option value="Final Lab">Final Lab</option>
              </select>
            </div>

            {/* Keyword Input */}
            <div className="col-md-12">
              <label className="form-label">Search Keyword (Subject, Teacher, etc.)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Calculus, Sir Asad, OOP" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <div className="col-12 text-center mt-3">
              <button type="submit" className="btn btn-primary px-5">Search Papers</button>
            </div>
          </div>
        </form>
      </div>

      {/* --- RESULTS SECTION --- */}
      {loading && <div className="text-center"><div className="spinner-border text-primary"></div></div>}
      {error && <div className="alert alert-danger">{error}</div>}
      
      {!loading && papers.length > 0 && (
        <div className="row">
          {papers.map((paper) => (
            <div key={paper.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-primary">{paper.courseTitle}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">{paper.teacherName}</h6>
                  <hr />
                  <p className="card-text mb-1"><strong>Batch:</strong> {paper.batch}</p>
                  <p className="card-text mb-1"><strong>Uni:</strong> {paper.university} ({paper.campus})</p>
                  <p className="card-text mb-1"><strong>Type:</strong> {paper.examCategory}</p>
                  
                  {/* View PDF Button */}
                  <button 
                    className="btn btn-outline-success w-100 mt-3"
                    onClick={() => openPdf(paper.pdf)}
                  >
                    View PDF 📄
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && papers.length === 0 && !error && (
        <div className="text-center text-muted mt-5">
          <p>No papers found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default PastPaper;