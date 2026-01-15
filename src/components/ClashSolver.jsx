import React, { useState, useEffect } from 'react';
import '../css/ClashSolver.css';

const ClashSolver = () => {
    // --- STATE MANAGEMENT ---
    const [input, setInput] = useState({ sectionName: '', courseName: '' });
    const [currentSchedule, setCurrentSchedule] = useState([]); // List of active courses
    const [clashList, setClashList] = useState([]); // List of detected clashes from API
    const [savedTimetables, setSavedTimetables] = useState([]); // From LocalStorage
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load saved timetables on mount
    useEffect(() => {
        const saved = localStorage.getItem('myTimetables');
        if (saved) {
            setSavedTimetables(JSON.parse(saved));
        }
    }, []);

    // --- API 1: FETCH COURSE DETAILS ---
    const handleAddCourse = async (e) => {
        e.preventDefault();
        if (!input.sectionName || !input.courseName) return;

        setLoading(true);
        setError(null);

        try {
            // Note: User prompt had /delete, but we need /details to fetch info first
            const url = `http://localhost:8080/api/courses/details?section=${input.sectionName}&course=${input.courseName}`;
            const res = await fetch(url);
            
            if (!res.ok) throw new Error("Course not found or API error");
            
            const newCourse = await res.json();
            
            // Check if already added
            if (currentSchedule.some(c => c.courseName === newCourse.courseName && c.theorySectionName === newCourse.theorySectionName)) {
                throw new Error("Course already in timetable!");
            }

            // Update Schedule
            const updatedSchedule = [...currentSchedule, newCourse];
            setCurrentSchedule(updatedSchedule);
            
            // CHECK CLASHES IMMEDIATELY
            await checkClashes(updatedSchedule);

            setInput({ sectionName: '', courseName: '' }); // Clear input

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- API 2: DETECT CLASHES ---
    const checkClashes = async (schedule) => {
        if (schedule.length < 2) {
            setClashList([]);
            return;
        }

        // Convert Schedule to the format ClashDetector API expects
        // We map our "AddSectionDTO" format to "ClashCheckRequestDTO" format
        const payload = {
            courses: schedule.map(c => ({
                courseName: c.courseName,
                sectionName: c.theorySectionName,
                // Lecture 1
                day1: c.dayOfWeek1,
                startTime1: c.startTime1,
                endTime1: c.endTime1,
                // Lecture 2
                day2: c.dayOfWeek2,
                startTime2: c.startTime2,
                endTime2: c.endTime2,
                // Lab
                hasLab: !!c.labTeacherName,
                labDay: c.labDayOfWeek,
                labStartTime: c.labStartTime,
                labEndTime: c.labEndTime
            }))
        };

        try {
            const res = await fetch('http://localhost:8080/api/clash/detect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            
            // If API returns string "No clashes...", treat as empty array
            if (Array.isArray(data)) {
                setClashList(data);
            } else {
                setClashList([]);
            }
        } catch (err) {
            console.error("Clash detection failed", err);
        }
    };

    // --- REMOVE COURSE ---
    const handleRemoveCourse = async (courseToRemove) => {
        const updated = currentSchedule.filter(c => c.courseName !== courseToRemove.courseName);
        setCurrentSchedule(updated);
        await checkClashes(updated);
    };

    // --- SAVE / NEW / LOAD ---
    const saveTimetable = () => {
        if (currentSchedule.length === 0) return;
        const newSaved = [...savedTimetables, { 
            id: Date.now(), 
            date: new Date().toLocaleDateString(), 
            courses: currentSchedule 
        }];
        setSavedTimetables(newSaved);
        localStorage.setItem('myTimetables', JSON.stringify(newSaved));
        alert("Timetable Saved!");
    };

    const createNewTimetable = () => {
        if(window.confirm("Start a new timetable? Current unsaved changes will be lost.")) {
            setCurrentSchedule([]);
            setClashList([]);
        }
    };

    const loadTimetable = (saved) => {
        setCurrentSchedule(saved.courses);
        checkClashes(saved.courses); // Re-check clashes for loaded data
    };

    const deleteSaved = (id) => {
        const updated = savedTimetables.filter(t => t.id !== id);
        setSavedTimetables(updated);
        localStorage.setItem('myTimetables', JSON.stringify(updated));
    }

    // --- HELPER: TIME GENERATOR ---
    // Generates 30 min slots from 08:30 to 20:30
    const timeSlots = [];
    let startHour = 8;
    let startMin = 30;
    while (startHour < 20 || (startHour === 20 && startMin <= 30)) {
        const timeStr = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
        timeSlots.push(timeStr);
        startMin += 30;
        if (startMin === 60) {
            startMin = 0;
            startHour++;
        }
    }

    // --- HELPER: IS COURSE CLASHING? ---
    const isClashing = (courseName) => {
        return clashList.some(clash => 
            clash.course1Name === courseName || clash.course2Name === courseName
        );
    };

    return (
        <div className="solver-container">
            {/* --- LEFT SIDEBAR (GALLERY) --- */}
            <div className="sidebar">
                <h3>Saved Tables</h3>
                <button onClick={createNewTimetable} className="new-btn">+ New Timetable</button>
                <div className="saved-list">
                    {savedTimetables.length === 0 && <p className="empty-msg">No saved tables</p>}
                    {savedTimetables.map(t => (
                        <div key={t.id} className="saved-item" onClick={() => loadTimetable(t)}>
                            <span>📅 {t.date}</span>
                            <small>{t.courses.length} Courses</small>
                            <button className="del-btn-mini" onClick={(e) => { e.stopPropagation(); deleteSaved(t.id); }}>×</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="main-content">
                <div className="control-panel">
                    <h2>⚡ Clash Solver & Scheduler</h2>
                    <form onSubmit={handleAddCourse} className="input-group">
                        <input 
                            type="text" 
                            placeholder="Section (e.g. sp23-bse-a)" 
                            value={input.sectionName}
                            onChange={(e) => setInput({...input, sectionName: e.target.value})}
                            required
                        />
                        <input 
                            type="text" 
                            placeholder="Course Name" 
                            value={input.courseName}
                            onChange={(e) => setInput({...input, courseName: e.target.value})}
                            required
                        />
                        <button type="submit" disabled={loading} className="add-btn">
                            {loading ? "..." : "Add to Table"}
                        </button>
                        <button type="button" onClick={saveTimetable} className="save-btn">💾 Save</button>
                    </form>
                    {error && <div className="error-banner">{error}</div>}
                    {clashList.length > 0 && (
                        <div className="clash-alert">
                            ⚠️ <strong>{clashList.length} Clashes Detected!</strong> Check red boxes below.
                        </div>
                    )}
                </div>

                {/* --- TIMETABLE GRID --- */}
                <div className="timetable-wrapper">
                    <div className="timetable-grid">
                        {/* Header Row */}
                        <div className="header-cell">Time / Day</div>
                        {timeSlots.map(time => (
                            <div key={time} className="header-cell time-header">{time}</div>
                        ))}

                        {/* Days Rows */}
                        {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map(day => (
                            <React.Fragment key={day}>
                                <div className="day-header">{day}</div>
                                {timeSlots.map(time => (
                                    <div key={`${day}-${time}`} className="grid-cell">
                                        {/* Render Courses in this cell */}
                                        {currentSchedule.map(course => {
                                            // Check Logic: Does this course have a class at this Day & Time?
                                            // Simple check: strict start time match or simply falling within range.
                                            // For this UI, we will render a block if the time falls within the range.
                                            
                                            const checkSlot = (cDay, cStart, cEnd, type) => {
                                                if (cDay !== day) return null;
                                                // Convert strings "08:30:00" -> number comparision
                                                if (!cStart || !cEnd) return null;
                                                
                                                const slotTime = parseFloat(time.replace(':', '.'));
                                                const start = parseFloat(cStart.substring(0, 5).replace(':', '.'));
                                                const end = parseFloat(cEnd.substring(0, 5).replace(':', '.'));

                                                if (slotTime >= start && slotTime < end) {
                                                    const clashing = isClashing(course.courseName);
                                                    return (
                                                        <div key={`${course.courseName}-${type}`} 
                                                             className={`course-block ${clashing ? 'clash' : ''}`}>
                                                            <div className="course-info">
                                                                <strong>{course.courseName}</strong>
                                                                <span>{course.theorySectionName}</span>
                                                                <small>{type}</small>
                                                            </div>
                                                            <button className="remove-x" onClick={() => handleRemoveCourse(course)}>×</button>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            };

                                            return (
                                                <React.Fragment key={course.courseName}>
                                                    {checkSlot(course.dayOfWeek1, course.startTime1, course.endTime1, "Lec 1")}
                                                    {checkSlot(course.dayOfWeek2, course.startTime2, course.endTime2, "Lec 2")}
                                                    {checkSlot(course.labDayOfWeek, course.labStartTime, course.labEndTime, "Lab")}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClashSolver;