import React, { useState, useEffect } from 'react';
import '../ClashCss/ClashSolver.css';
import SavedTimetables from './savedTimeTable';
import GetCourse from './getCourse';
import Minimize from './minimize';

const ClashSolver = () => {
    const [currentSchedule, setCurrentSchedule] = useState([]);
    const [minimizedCourses, setMinimizedCourses] = useState([]); 
    const [clashList, setClashList] = useState([]);
    const [savedTimetables, setSavedTimetables] = useState([]);
    const [loading, setLoading] = useState(false);
        const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMinimizeOpen, setIsMinimizeOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('myTimetables');
        if (saved) setSavedTimetables(JSON.parse(saved));
    }, []);
    const generateTimeHeaders = () => {
        const slots = [];
        let h = 8, m = 30;
        let count = 1;
        while (h < 20 || (h === 20 && m <= 0)) {
            const startStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            let endM = m + 30;
            let endH = h;
            if (endM >= 60) { endM -= 60; endH += 1; }
            const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
            slots.push({ id: count++, label: startStr, displayTop: startStr, displayBottom: endStr });
            m += 30;
            if (m >= 60) { m = 0; h++; }
        }
        return slots;
    };
    const timeHeaders = generateTimeHeaders();

    const handleAddCourseLogic = async (sectionName, courseName) => {
    if (!sectionName || !courseName) return;
    setLoading(true);

    try {
        // 1. Check Local Storage first for manually added/overridden courses
        const localCourses = JSON.parse(localStorage.getItem('customCourses') || '[]');
        let courseData = localCourses.find(c => 
            c.theorySectionName.toLowerCase() === sectionName.toLowerCase() && 
            c.courseName.toLowerCase() === courseName.toLowerCase()
        );

        // 2. If not found locally, fetch from Backend
        if (!courseData) {
            const url = `http://localhost:8080/api/courses/details?section=${sectionName}&course=${courseName}`;
            const res = await fetch(url);
            
            if (res.ok) {
                courseData = await res.json();
            } else {
                // If backend fails, offer manual entry
                const confirmManual = window.confirm("Course not found in database. Would you like to add it manually?");
                if (confirmManual) {
                    // This assumes you add a state like: const [manualCourseInfo, setManualCourseInfo] = useState(null);
                    // And a state to open your form: setIsManualOpen(true);
                    setManualCourseInfo({ sectionName, courseName }); 
                    setIsManualOpen(true); 
                    return; 
                }
                throw new Error("Course not found.");
            }
        }

        // 3. Add to Schedule (Reuse existing logic)
        const isDuplicate = currentSchedule.some(c => c.courseName === courseData.courseName) || 
                            minimizedCourses.some(c => c.courseName === courseData.courseName);

        if (!isDuplicate) {
            const updated = [...currentSchedule, courseData];
            setCurrentSchedule(updated);
            checkClashes(updated);
        } else {
            alert("Course is already in timetable or minimized list.");
        }

    } catch (err) { 
        alert(err.message); 
    } finally { 
        setLoading(false); 
    }
};

    const checkClashes = async (schedule) => {
        if (schedule.length < 2) { 
            setClashList([]); 
            return; 
        }

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

            const text = await res.text();
            
            try {
                const data = JSON.parse(text); 
                if (Array.isArray(data)) {
                    setClashList(data);
                } else {
                    setClashList([]);
                }
            } catch (e) {
                setClashList([]);
            }

        } catch (err) { 
            console.error("Clash Check Error:", err); 
        }
    };

    const handleMinimizeCourse = (courseToMinimize) => {
        setMinimizedCourses([...minimizedCourses, courseToMinimize]);
        const updatedSchedule = currentSchedule.filter(c => c.courseName !== courseToMinimize.courseName);
        setCurrentSchedule(updatedSchedule);
        checkClashes(updatedSchedule);
    };
    const handleRestoreCourse = (courseToRestore) => {
        const updatedMinimized = minimizedCourses.filter(c => c.courseName !== courseToRestore.courseName);
        setMinimizedCourses(updatedMinimized);

        const updatedSchedule = [...currentSchedule, courseToRestore];
        setCurrentSchedule(updatedSchedule);

        checkClashes(updatedSchedule);
    };
    const saveCurrentTimetable = () => {
        if(currentSchedule.length === 0) return;
        const newEntry = { id: Date.now(), date: new Date().toLocaleString(), courses: currentSchedule };
        const updated = [newEntry, ...savedTimetables];
        setSavedTimetables(updated);
        localStorage.setItem('myTimetables', JSON.stringify(updated));
        alert("Timetable Saved!");
    };

    const isClashing = (courseName) => clashList.some(c => c.course1Name === courseName || c.course2Name === courseName);
    const getVisualPosition = (currentCourse, day, startStr, endStr) => {
        const parseMinutes = (t) => { if(!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const myStart = parseMinutes(startStr);
        const myEnd = parseMinutes(endStr);

        const overlappingCourses = currentSchedule.filter(other => {
            if(other.dayOfWeek1 === day) { if(myStart < parseMinutes(other.endTime1) && parseMinutes(other.startTime1) < myEnd) return true; }
            if(other.dayOfWeek2 === day) { if(myStart < parseMinutes(other.endTime2) && parseMinutes(other.startTime2) < myEnd) return true; }
            if(other.labDayOfWeek === day) { if(myStart < parseMinutes(other.labEndTime) && parseMinutes(other.labStartTime) < myEnd) return true; }
            return false;
        });

        if (overlappingCourses.length <= 1) return '';
        overlappingCourses.sort((a, b) => a.courseName.localeCompare(b.courseName));
        const myIndex = overlappingCourses.findIndex(c => c.courseName === currentCourse.courseName);
        return myIndex === 0 ? 'split-top' : 'split-bottom';
    };
    const handleDeleteSaved = (id) => {
        const updated = savedTimetables.filter(t => t.id !== id);
                setSavedTimetables(updated);
                localStorage.setItem('myTimetables', JSON.stringify(updated));
    };

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
        const widthStyle = `calc(100% * ${slotsSpan} - 2px)`; 
        
        const clashing = isClashing(course.courseName);
        const splitClass = clashing ? getVisualPosition(course, day, cStart, cEnd) : '';

        return (
            <div key={`${course.courseName}-${type}`} 
                 className={`course-block-absolute ${clashing ? 'clash' : ''} ${splitClass}`}
                 style={{ width: widthStyle, zIndex: clashing ? 20 : 10 }}>
                
                <div className="course-content">
                    <strong>{course.courseName}</strong>
                    {!splitClass && <span>{course.theorySectionName}</span>}
                    <small>{type}</small>
                </div>
                
                <button 
                    className="delete-x" 
                    onClick={() => handleMinimizeCourse(course)}
                    title="Minimize Course"
                >
                    ×
                </button>
            </div>
        );
    };

    return (
        <div className="solver-container full-view">
            <div className="floating-dock">
                <button className="icon-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title="Saved Timetables">📂</button>
                <button className="icon-btn" onClick={() => setIsSearchOpen(!isSearchOpen)} title="Add Course">➕</button>
                <button className="icon-btn" onClick={() => setIsMinimizeOpen(!isMinimizeOpen)} title="Minimized Courses">
                    🗑️ <span style={{fontSize:'10px', verticalAlign:'top', marginLeft:'2px'}}>{minimizedCourses.length}</span>
                </button>
                <button className="icon-btn save-action" onClick={saveCurrentTimetable} title="Save Current">💾</button>
            </div>

            <SavedTimetables 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
                savedTimetables={savedTimetables}
                onLoad={(courses) => { setCurrentSchedule(courses); checkClashes(courses); }}
                onDelete={handleDeleteSaved}
            />
            <GetCourse 
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onAddCourse={handleAddCourseLogic}
                loading={loading}
                clashCount={clashList.length}
            />
            <Minimize 
                isOpen={isMinimizeOpen}
                onClose={() => setIsMinimizeOpen(false)}
                minimizedCourses={minimizedCourses}
                onRestore={handleRestoreCourse}
            />

            <div className="timetable-paper">
                <div className="timetable-header">
                    <h2>Make Your TimeTable</h2>
                </div>

                <div className="grid-container">
                    <div className="grid-header-row">
                        <div className="grid-cell corner-cell"></div>
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

                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                        <div key={day} className="grid-row">
                            <div className="grid-cell day-label">{day.substring(0, 3)}</div>
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