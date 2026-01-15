import React, { useState } from 'react';
import '../css/addSection.css';

const AddSection = () => {
    // Initial State
    const initialState = {
        teacherName: '',
        courseName: '',
        theorySectionName: '',
        creditHours: '3',
        
        // Lecture 1
        roomNumber1: '',
        dayOfWeek1: 'MONDAY',
        startTime1: '',
        endTime1: '',

        // Lecture 2
        roomNumber2: '',
        dayOfWeek2: 'THURSDAY',
        startTime2: '',
        endTime2: '',

        // Optional Lab
        labTeacherName: '',
        labSectionName: '',
        labNumber: '',
        labDayOfWeek: 'FRIDAY',
        labStartTime: '',
        labEndTime: ''
    };

    const [formData, setFormData] = useState(initialState);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false); // Tracks if we are editing existing data

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // --- HELPER: Prepare Payload for Save/Update ---
    const preparePayload = () => {
        const payload = {
            ...formData,
            creditHours: parseInt(formData.creditHours),
            startTime1: formData.startTime1?.length === 5 ? formData.startTime1 + ":00" : formData.startTime1,
            endTime1: formData.endTime1?.length === 5 ? formData.endTime1 + ":00" : formData.endTime1,
            startTime2: formData.startTime2?.length === 5 ? formData.startTime2 + ":00" : formData.startTime2,
            endTime2: formData.endTime2?.length === 5 ? formData.endTime2 + ":00" : formData.endTime2,
            
            labStartTime: formData.labStartTime?.length === 5 ? formData.labStartTime + ":00" : formData.labStartTime,
            labEndTime: formData.labEndTime?.length === 5 ? formData.labEndTime + ":00" : formData.labEndTime,
        };

        // Remove empty lab fields
        if (!payload.labTeacherName) {
            delete payload.labTeacherName;
            delete payload.labSectionName;
            delete payload.labNumber;
            delete payload.labDayOfWeek;
            delete payload.labStartTime;
            delete payload.labEndTime;
        }
        return payload;
    };

    // --- ACTION 1: SEARCH (GET) ---
    const handleSearch = async () => {
        if(!formData.theorySectionName || !formData.courseName) {
            setError("Please enter Section Name and Course Name to search.");
            return;
        }
        setError(null);
        setResponse(null);

        try {
            const url = `http://localhost:8080/api/courses/details?section=${formData.theorySectionName}&course=${formData.courseName}`;
            const res = await fetch(url);
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Course not found.");

            // Populate form with fetched data
            setFormData({
                ...data,
                // Ensure times are trimmed to HH:mm for input fields
                startTime1: data.startTime1?.substring(0, 5),
                endTime1: data.endTime1?.substring(0, 5),
                startTime2: data.startTime2?.substring(0, 5),
                endTime2: data.endTime2?.substring(0, 5),
                labStartTime: data.labStartTime?.substring(0, 5),
                labEndTime: data.labEndTime?.substring(0, 5),
                labSectionName: data.labSectionName || '',
                labTeacherName: data.labTeacherName || '',
                labNumber: data.labNumber || '',
                labDayOfWeek: data.labDayOfWeek || 'FRIDAY'
            });
            setIsEditMode(true);
            alert("Course found! You can now Update or Delete.");
        } catch (err) {
            setError(err.message);
            setIsEditMode(false);
        }
    };

    // --- ACTION 2: SAVE NEW (POST) ---
    const handleSave = async (e) => {
        e.preventDefault();
        setError(null);
        setResponse(null);

        try {
            const res = await fetch('http://localhost:8080/api/courses/section', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preparePayload()),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(typeof data === 'string' ? data : "Failed to save.");

            setResponse(data);
            setIsEditMode(true); // Switch to edit mode after saving
            alert("Section added successfully!");
        } catch (err) {
            setError(err.message);
        }
    };

    // --- ACTION 3: UPDATE (PUT) ---
    const handleUpdate = async () => {
        setError(null);
        try {
            const res = await fetch('http://localhost:8080/api/courses/section/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preparePayload()),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update.");

            setResponse(data);
            alert("Section updated successfully!");
        } catch (err) {
            setError(err.message);
        }
    };

    // --- ACTION 4: DELETE (DELETE) ---
    const handleDelete = async () => {
        if(!window.confirm("Are you sure you want to delete this course? This cannot be undone.")) return;
        
        setError(null);
        try {
            const url = `http://localhost:8080/api/courses/delete?section=${formData.theorySectionName}&course=${formData.courseName}`;
            const res = await fetch(url, { method: 'DELETE' });

            if (!res.ok) {
                 const data = await res.json();
                 throw new Error(data.message || "Failed to delete.");
            }

            alert("Course deleted successfully!");
            setFormData(initialState); // Reset form
            setIsEditMode(false);
            setResponse(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const resetForm = () => {
        setFormData(initialState);
        setIsEditMode(false);
        setResponse(null);
        setError(null);
    }

    return (
        <div className="add-section-container">
            <div className="header-row">
                <h2>Course Manager</h2>
                <button type="button" onClick={resetForm} className="reset-btn">Clear Form</button>
            </div>
            
            <form onSubmit={handleSave} className="section-form">
                
                {/* --- Search / Identity Section --- */}
                <div className="form-group-card highlight">
                    <h3>Find or Name Course</h3>
                    <div className="search-row">
                        <input type="text" name="theorySectionName" placeholder="Section Name (e.g., SP23-BSE-A)" 
                               value={formData.theorySectionName} onChange={handleChange} required />
                        <input type="text" name="courseName" placeholder="Course Name" 
                               value={formData.courseName} onChange={handleChange} required />
                        <button type="button" className="search-btn" onClick={handleSearch}>🔍 Search</button>
                    </div>
                    <small>Enter Section & Course Name to Search, Update, or Delete.</small>
                </div>

                {/* --- Theory Details --- */}
                <div className="form-group-card">
                    <h3>Course Details</h3>
                    <div className="row">
                        <input type="text" name="teacherName" placeholder="Teacher Name" value={formData.teacherName} onChange={handleChange} required />
                        <input type="number" name="creditHours" placeholder="Credit Hours" value={formData.creditHours} onChange={handleChange} required />
                    </div>
                </div>

                {/* --- Lecture 1 --- */}
                <div className="form-group-card">
                    <h3>Lecture Slot 1</h3>
                    <div className="row">
                        <select name="dayOfWeek1" onChange={handleChange} value={formData.dayOfWeek1}>
                            <option value="MONDAY">Monday</option>
                            <option value="TUESDAY">Tuesday</option>
                            <option value="WEDNESDAY">Wednesday</option>
                            <option value="THURSDAY">Thursday</option>
                            <option value="FRIDAY">Friday</option>
                        </select>
                        <input type="text" name="roomNumber1" placeholder="Room No." value={formData.roomNumber1} onChange={handleChange} required />
                    </div>
                    <div className="row">
                        <label>Start: <input type="time" name="startTime1" value={formData.startTime1} onChange={handleChange} required /></label>
                        <label>End: <input type="time" name="endTime1" value={formData.endTime1} onChange={handleChange} required /></label>
                    </div>
                </div>

                {/* --- Lecture 2 --- */}
                <div className="form-group-card">
                    <h3>Lecture Slot 2</h3>
                    <div className="row">
                        <select name="dayOfWeek2" onChange={handleChange} value={formData.dayOfWeek2}>
                            <option value="MONDAY">Monday</option>
                            <option value="TUESDAY">Tuesday</option>
                            <option value="WEDNESDAY">Wednesday</option>
                            <option value="THURSDAY">Thursday</option>
                            <option value="FRIDAY">Friday</option>
                        </select>
                        <input type="text" name="roomNumber2" placeholder="Room No." value={formData.roomNumber2} onChange={handleChange} required />
                    </div>
                    <div className="row">
                        <label>Start: <input type="time" name="startTime2" value={formData.startTime2} onChange={handleChange} required /></label>
                        <label>End: <input type="time" name="endTime2" value={formData.endTime2} onChange={handleChange} required /></label>
                    </div>
                </div>

                {/* --- Lab Details (Optional) --- */}
                <div className="form-group-card optional">
                    <h3>Lab Details (Optional)</h3>
                    <input type="text" name="labTeacherName" placeholder="Lab Teacher Name" value={formData.labTeacherName} onChange={handleChange} />
                    <div className="row">
                        <input type="text" name="labSectionName" placeholder="Lab Section (Optional)" value={formData.labSectionName} onChange={handleChange} />
                        <input type="text" name="labNumber" placeholder="Lab Room No." value={formData.labNumber} onChange={handleChange} />
                    </div>
                    <div className="row">
                        <select name="labDayOfWeek" onChange={handleChange} value={formData.labDayOfWeek}>
                            <option value="FRIDAY">Friday</option>
                            <option value="MONDAY">Monday</option>
                            <option value="TUESDAY">Tuesday</option>
                            <option value="WEDNESDAY">Wednesday</option>
                            <option value="THURSDAY">Thursday</option>
                        </select>
                        <label>Start: <input type="time" name="labStartTime" value={formData.labStartTime} onChange={handleChange} /></label>
                        <label>End: <input type="time" name="labEndTime" value={formData.labEndTime} onChange={handleChange} /></label>
                    </div>
                </div>

                {/* --- Action Buttons --- */}
                <div className="action-buttons">
                    {!isEditMode && (
                        <button type="submit" className="submit-btn save">Save New Section</button>
                    )}
                    
                    {isEditMode && (
                        <>
                            <button type="button" onClick={handleUpdate} className="submit-btn update">Update Section</button>
                            <button type="button" onClick={handleDelete} className="submit-btn delete">Delete Section</button>
                        </>
                    )}
                </div>
            </form>

            {/* --- Error Message --- */}
            {error && <div className="error-box">{error}</div>}

            {/* --- Success Response Box --- */}
            {response && (
                <div className="response-box">
                    <h3>✅ Operation Successful</h3>
                    <div className="response-details">
                        <div className="detail-row">
                            <span className="label">Course:</span>
                            <span className="value">{response.courseName}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Section:</span>
                            <span className="value">{response.theorySectionName}</span>
                        </div>
                        
                        <div className="schedule-grid">
                            <div className="slot">
                                <strong>Lecture 1</strong>
                                <p>{response.dayOfWeek1}</p>
                                <p>{response.startTime1} - {response.endTime1}</p>
                                <p>Room: {response.roomNumber1}</p>
                            </div>
                            <div className="slot">
                                <strong>Lecture 2</strong>
                                <p>{response.dayOfWeek2}</p>
                                <p>{response.startTime2} - {response.endTime2}</p>
                                <p>Room: {response.roomNumber2}</p>
                            </div>
                            {response.labTeacherName && (
                                <div className="slot lab">
                                    <strong>Lab</strong>
                                    <p>{response.labDayOfWeek}</p>
                                    <p>{response.labStartTime} - {response.labEndTime}</p>
                                    <p>Room: {response.labNumber}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddSection;