import React, { useState } from 'react';
import '../ClashCss/getCourse.css';
const GetCourse = ({ isOpen, onClose, onAddCourse, loading, clashCount }) => {
    // Local state for inputs
    const [sectionName, setSectionName] = useState('');
    const [courseName, setCourseName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddCourse(sectionName, courseName);
        setCourseName(''); 
    };

    return (
        <div className={`popup-panel search-panel ${isOpen ? 'open' : ''}`}>
            <div className="panel-header">
                <h3>Add Course</h3>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
                <input 
                    className="search-input" 
                    placeholder="Section (e.g. sp23-bse-a)" 
                    value={sectionName} 
                    onChange={(e) => setSectionName(e.target.value)} 
                    required
                />
                <input 
                    className="search-input" 
                    placeholder="Course Name" 
                    value={courseName} 
                    onChange={(e) => setCourseName(e.target.value)} 
                    required
                />
                <button type="submit" disabled={loading} className="panel-action-btn">
                    {loading ? 'Adding...' : 'Add to Grid'}
                </button>
            </form>
            
            {/* Warning received from Parent props */}
            {clashCount > 0 && (
                <div className="popup-clash-warning">
                    ⚠️ {clashCount} Clashes Detected!
                </div>
            )}
        </div>
    );
};

export default GetCourse;