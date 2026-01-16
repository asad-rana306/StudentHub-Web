import React, { useState, useEffect } from 'react';
import '../css/ClashSolver.css';

const ClashSolver = () => {
    // --- STATE ---
    const [input, setInput] = useState({ sectionName: '', courseName: '' });
    const [currentSchedule, setCurrentSchedule] = useState([]);
    const [clashList, setClashList] = useState([]);
    const [savedTimetables, setSavedTimetables] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // UI Toggles
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('myTimetables');
        if (saved) setSavedTimetables(JSON.parse(saved));
    }, []);

    // --- LOGIC: GENERATE TIME SLOTS (8:30 - 20:30) ---
    // Fixed: Now returns clean 30min slots for the header
    const generateTimeHeaders = () => {
        const slots = [];
        let h = 8, m = 30;
        let count = 1;

        while (h < 20 || (h === 20 && m <= 0)) {
            const startStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            
            // Calculate End
            let endM = m + 30;
            let endH = h;
            if (endM >= 60) { endM -= 60; endH += 1; }
            const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

            slots.push({
                id: count++,
                label: startStr,    // For logic matching
                displayTop: startStr, // For UI Top line
                displayBottom: endStr // For UI Bottom line
            });

            m += 30;
            if (m >= 60) { m = 0; h++; }
        }
        return slots;
    };

    const timeHeaders = generateTimeHeaders();

    // --- API CALLS (Same as before) ---
    const handleAddCourse = async (e) => {
        e.preventDefault();
        if (!input.sectionName || !input.courseName) return;
        setLoading(true);
        try {
            const url = `http://localhost:8080/api/courses/details?section=${input.sectionName}&course=${input.courseName}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Course not found");
            const newCourse = await res.json();
            
            if (!currentSchedule.some(c => c.courseName === newCourse.courseName)) {
                const updated = [...currentSchedule, newCourse];
                setCurrentSchedule(updated);
                checkClashes(updated);
            }
            setInput({ ...input, courseName: '' });
        } catch (err) { alert(err.message); } finally { setLoading(false); }
    };

    const checkClashes = async (schedule) => {
        if (schedule.length < 2) { setClashList([]); return; }
        const payload = {
            courses: schedule.map(c => ({
                courseName: c.courseName,
                sectionName: c.theorySectionName,
                day1: c.dayOfWeek1, startTime1: c.startTime1, endTime1: c.endTime1,
                day2: c.dayOfWeek2, startTime2: c.startTime2, endTime2: c.endTime2,
                hasLab: !!c.labTeacherName,
                labDay: c.labDayOfWeek, labStartTime: c.labStartTime, labEndTime: c.labEndTime
            }))
        };
        try {
            const res = await fetch('http://localhost:8080/api/clash/detect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setClashList(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
    };

    const handleRemoveCourse = (courseName) => {
        const updated = currentSchedule.filter(c => c.courseName !== courseName);
        setCurrentSchedule(updated);
        checkClashes(updated);
    };

    const isClashing = (courseName) => clashList.some(c => c.course1Name === courseName || c.course2Name === courseName);

    // --- HELPER: RENDER BLOCK LOGIC ---
    const renderCourseBlock = (course, day, timeStart, type) => {
        let cDay, cStart, cEnd;
        if(type === 'Lec 1') { cDay = course.dayOfWeek1; cStart = course.startTime1; cEnd = course.endTime1; }
        else if(type === 'Lec 2') { cDay = course.dayOfWeek2; cStart = course.startTime2; cEnd = course.endTime2; }
        else { cDay = course.labDayOfWeek; cStart = course.labStartTime; cEnd = course.labEndTime; }

        if (cDay !== day || !cStart) return null;
        if (cStart.substring(0, 5) !== timeStart) return null;

        const startH = parseInt(cStart.split(':')[0]);
        const startM = parseInt(cStart.split(':')[1]);
        const endH = parseInt(cEnd.split(':')[0]);
        const endM = parseInt(cEnd.split(':')[1]);

        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        const slotsSpan = durationMinutes / 30; 

        // Fixed Width Calculation: Subtracted 2px for borders to prevent overflow
        const widthStyle = `calc(100% * ${slotsSpan} - 2px)`; 

        const clashing = isClashing(course.courseName);

        return (
            <div key={`${course.courseName}-${type}`} 
                 className={`course-block-absolute ${clashing ? 'clash' : ''}`}
                 style={{ width: widthStyle, zIndex: 10 }}>
                <div className="course-content">
                    <strong>{course.courseName}</strong>
                    <span>{course.theorySectionName}</span>
                    <small>{type}</small>
                </div>
                <button className="delete-x" onClick={() => handleRemoveCourse(course.courseName)}>×</button>
            </div>
        );
    };

    // --- SAVE LOGIC ---
    const saveCurrentTimetable = () => {
        if(currentSchedule.length === 0) return;
        const newEntry = { id: Date.now(), date: new Date().toLocaleString(), courses: currentSchedule };
        const updated = [newEntry, ...savedTimetables];
        setSavedTimetables(updated);
        localStorage.setItem('myTimetables', JSON.stringify(updated));
        alert("Timetable Saved!");
    };

    return (
        <div className="solver-container full-view">
            
            {/* FLOATING CONTROLS */}
            <div className="floating-dock">
                <button className="icon-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title="Saved Timetables">📂</button>
                <button className="icon-btn" onClick={() => setIsSearchOpen(!isSearchOpen)} title="Add Course">➕</button>
                <button className="icon-btn save-action" onClick={saveCurrentTimetable} title="Save Current">💾</button>
            </div>

            {/* SIDEBAR POPUP */}
            <div className={`popup-panel sidebar-panel ${isSidebarOpen ? 'open' : ''}`}>
                <div className="panel-header"><h3>Saved Tables</h3><button onClick={() => setIsSidebarOpen(false)}>×</button></div>
                <div className="saved-list">
                    {savedTimetables.map(t => (
                        <div key={t.id} className="saved-item" onClick={() => {setCurrentSchedule(t.courses); setIsSidebarOpen(false);}}>
                            <span>{t.date}</span><small>{t.courses.length} courses</small>
                        </div>
                    ))}
                </div>
            </div>

            {/* SEARCH POPUP */}
            <div className={`popup-panel search-panel ${isSearchOpen ? 'open' : ''}`}>
                <div className="panel-header"><h3>Add Course</h3><button onClick={() => setIsSearchOpen(false)}>×</button></div>
                <form onSubmit={handleAddCourse}>
                    <input className="search-input" placeholder="Section (e.g. sp23-bse-a)" value={input.sectionName} onChange={e => setInput({...input, sectionName: e.target.value})} />
                    <input className="search-input" placeholder="Course Name" value={input.courseName} onChange={e => setInput({...input, courseName: e.target.value})} />
                    <button type="submit" disabled={loading} className="panel-action-btn">{loading ? 'Adding...' : 'Add to Grid'}</button>
                </form>
                {clashList.length > 0 && <div className="popup-clash-warning">⚠️ {clashList.length} Clashes Detected!</div>}
            </div>

            {/* --- MAIN TIMETABLE UI --- */}
            <div className="timetable-paper">
                <div className="timetable-header">
                    <h2>Fall 2025 - Timetable</h2>
                </div>

                <div className="grid-container">
                    {/* Header Row */}
                    <div className="grid-header-row">
                        <div className="grid-cell corner-cell"></div> {/* Empty corner */}
                        {timeHeaders.map(slot => (
                            <div key={slot.id} className="grid-cell time-header">
                                <span className="slot-num">{slot.id}</span>
                                <div className="time-stack">
                                    <span>{slot.displayTop}</span>
                                    <span>{slot.displayBottom}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Day Rows */}
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                        <div key={day} className="grid-row">
                            <div className="grid-cell day-label">{day.substring(0, 2)}</div>
                            
                            {timeHeaders.map(slot => (
                                <div key={slot.id} className="grid-cell drop-zone">
                                    {currentSchedule.map(course => (
                                        <React.Fragment key={course.courseName}>
                                            {renderCourseBlock(course, day, slot.label, 'Lec 1')}
                                            {renderCourseBlock(course, day, slot.label, 'Lec 2')}
                                            {renderCourseBlock(course, day, slot.label, 'Lab')}
                                        </React.Fragment>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClashSolver;