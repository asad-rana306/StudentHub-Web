import React, { useState, useEffect } from 'react';
import '../css/getAllCourse.css';

const GetAllCourse = () => {
    const [sectionsData, setSectionsData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- 1. FETCH & GROUP DATA ---
    useEffect(() => {
        const fetchAllCourses = async () => {
            try {
                // Fetch the flat list of all courses
                const res = await fetch('http://localhost:8080/api/courses/all-detailed');
                if (!res.ok) throw new Error("Failed to fetch courses");
                
                const data = await res.json();
                
                // Group by Section Name
                const grouped = {};
                data.forEach(course => {
                    // Use Theory Section Name as Key
                    const sectionKey = course.theorySectionName || "Unknown Section";
                    if (!grouped[sectionKey]) {
                        grouped[sectionKey] = [];
                    }
                    grouped[sectionKey].push(course);
                });

                setSectionsData(grouped);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchAllCourses();
    }, []);

    // --- 2. GENERATE TIME HEADERS (08:30 - 20:30) ---
    const generateTimeHeaders = () => {
        const slots = [];
        let h = 8, m = 30;
        let count = 1;
        // Generate 24 slots (12 hours) to cover full day
        while (h < 20 || (h === 20 && m <= 0)) {
            const startStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            let endM = m + 30;
            let endH = h;
            if (endM >= 60) { endM -= 60; endH += 1; }
            const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
            
            slots.push({ id: count++, top: startStr, bottom: endStr });
            
            m += 30;
            if (m >= 60) { m = 0; h++; }
        }
        return slots;
    };
    const timeHeaders = generateTimeHeaders();

    // --- 3. HELPER: CALCULATE POSITION ---
    const getBlockStyle = (day, startTime, endTime, targetDay) => {
        if (day !== targetDay) return null;
        
        const parse = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        }

        // Grid starts at 08:30 (510 minutes)
        const gridStart = 8 * 60 + 30; 
        const startMin = parse(startTime);
        const endMin = parse(endTime);

        // Calculate slots (30 min = 1 unit)
        const offsetSlots = (startMin - gridStart) / 30;
        const durationSlots = (endMin - startMin) / 30;

        if (offsetSlots < 0 || durationSlots <= 0) return null;

        // CSS Calculation: left = offset * 100% / total_cols
        return {
            left: `calc(${offsetSlots} * var(--col-width))`,
            width: `calc(${durationSlots} * var(--col-width))`
        };
    };

    // --- 4. RENDER SINGLE TIMETABLE ---
    const renderTimetable = (sectionName, courses) => {
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

        // Assign colors dynamically based on course name hash
        const getColor = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            return "#" + "00000".substring(0, 6 - c.length) + c;
        };

        return (
            <div className="timetable-wrapper" key={sectionName}>
                <div className="tt-header">
                    <h2>Fall 2025 - Timetable</h2>
                    <h1 className="section-title">{sectionName}</h1>
                    <div className="cui-label">CUI_Lahore</div>
                </div>

                <div className="tt-grid-container">
                    {/* HEADER ROW */}
                    <div className="tt-row header-row">
                        <div className="tt-cell day-col"></div>
                        {timeHeaders.map(slot => (
                            <div key={slot.id} className="tt-cell time-header-cell">
                                <span className="slot-id">{slot.id}</span>
                                <div className="slot-times">
                                    <span>{slot.top}</span>
                                    <span>{slot.bottom}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* DAY ROWS */}
                    {days.map(day => (
                        <div key={day} className="tt-row body-row">
                            <div className="tt-cell day-col">{day.substring(0, 2)}</div>
                            
                            {/* RENDER COURSES OVERLAY */}
                            <div className="courses-overlay">
                                {courses.map((course, idx) => {
                                    // Generate Blocks for Lec 1, Lec 2, Lab
                                    const blocks = [];
                                    const bg = getColor(course.courseName);
                                    // Make color pastel/light
                                    const lightBg = `${bg}20`; // 20 hex = low opacity
                                    const borderCol = bg;

                                    const makeBlock = (d, s, e, r, type) => {
                                        const style = getBlockStyle(d, s, e, day);
                                        if (style) {
                                            blocks.push(
                                                <div 
                                                    key={`${course.courseName}-${type}-${idx}`}
                                                    className="tt-course-block"
                                                    style={{ 
                                                        ...style, 
                                                        backgroundColor: 'white', // White bg as per screenshot
                                                        borderLeft: `5px solid ${borderCol}` 
                                                    }}
                                                >
                                                    {/* Corner Triangle for Lab or Lecture */}
                                                    <div className="corner-tag" style={{borderTopColor: borderCol}}></div>

                                                    <div className="block-content">
                                                        <span className="subject-name">{course.courseName}</span>
                                                        <span className="teacher-name">{type === 'Lab' ? course.labTeacherName : course.teacherName}</span>
                                                        <span className="room-badge">{r}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    };

                                    // Check Slot 1
                                    if(course.startTime1) makeBlock(course.dayOfWeek1, course.startTime1, course.endTime1, course.roomNumber1, 'Lec');
                                    // Check Slot 2
                                    if(course.startTime2) makeBlock(course.dayOfWeek2, course.startTime2, course.endTime2, course.roomNumber2, 'Lec');
                                    // Check Lab
                                    if(course.labStartTime) makeBlock(course.labDayOfWeek, course.labStartTime, course.labEndTime, course.labNumber, 'Lab');

                                    return blocks;
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- RENDER MAIN ---
    const filteredSections = Object.keys(sectionsData).filter(key => 
        key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading-screen">Loading Timetables...</div>;
    if (error) return <div className="error-screen">Error: {error}</div>;

    return (
        <div className="all-courses-container">
            <div className="dashboard-header">
                <h1>University Timetables</h1>
                <input 
                    type="text" 
                    placeholder="Search Section (e.g., SP23-BSE-A)..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="timetables-list">
                {filteredSections.map(sectionName => 
                    renderTimetable(sectionName, sectionsData[sectionName])
                )}
                {filteredSections.length === 0 && <p className="no-result">No sections found.</p>}
            </div>
        </div>
    );
};

export default GetAllCourse;