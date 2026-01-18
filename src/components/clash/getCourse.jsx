import React, { useState, useEffect, useRef } from 'react';
import '../ClashCss/getCourse.css';

const GetCourse = ({ isOpen, onClose, onAddCourse, loading, clashCount }) => {
    const [sectionName, setSectionName] = useState('');
    const [courseName, setCourseName] = useState('');
        const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const wrapperRef = useRef(null);
    const handleCourseChange = async (e) => {
        const value = e.target.value;
        setCourseName(value);
        if (value.length > 1) { // Only search if 2+ chars
            try {
                const res = await fetch(`http://localhost:8080/api/courses/suggestions?query=${value}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.error("Failed to fetch suggestions", err);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };
    const selectSuggestion = (name) => {
        setCourseName(name);
        setShowSuggestions(false);
        setSuggestions([]);
    };
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddCourse(sectionName, courseName);
        setCourseName(''); 
        setSuggestions([]);
    };

    return (
        <div className={`popup-panel search-panel ${isOpen ? 'open' : ''}`}>
            <div className="panel-header">
                <h3>Add Course</h3>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} autoComplete="off">
                <input 
                    className="search-input" 
                    placeholder="Section (e.g. sp23-bse-a)" 
                    value={sectionName} 
                    onChange={(e) => setSectionName(e.target.value)} 
                    required
                />
                <div className="input-wrapper" ref={wrapperRef}>
                    <input 
                        className="search-input" 
                        placeholder="Course Name" 
                        value={courseName} 
                        onChange={handleCourseChange}
                        onFocus={() => courseName.length > 1 && setShowSuggestions(true)}
                        required
                    />
                                        {showSuggestions && suggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {suggestions.map((suggestion, index) => (
                                <li 
                                    key={index} 
                                    onClick={() => selectSuggestion(suggestion)}
                                >
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <button type="submit" disabled={loading} className="panel-action-btn">
                    {loading ? 'Adding...' : 'Add to Grid'}
                </button>
            </form>
            
            {clashCount > 0 && (
                <div className="popup-clash-warning">
                    ⚠️ {clashCount} Clashes Detected!
                </div>
            )}
        </div>
    );
};

export default GetCourse;