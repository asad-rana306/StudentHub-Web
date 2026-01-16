import React from 'react';
import '../ClashCss/minimize.css'; // We will add styles below

const Minimize = ({ isOpen, onClose, minimizedCourses, onRestore }) => {
    return (
        <div className={`popup-panel sidebar-panel right-panel ${isOpen ? 'open' : ''}`}>
            <div className="panel-header">
                <h3>Minimized Courses</h3>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="saved-list">
                {minimizedCourses.length === 0 && <p className="empty-msg">No courses minimized</p>}
                
                {minimizedCourses.map((course, index) => (
                    <div key={`${course.courseName}-${index}`} className="saved-item minimized-item">
                        <div className="min-info">
                            <strong>{course.courseName}</strong>
                            <small>{course.theorySectionName}</small>
                        </div>
                        <button 
                            className="restore-btn" 
                            onClick={() => {
                                onRestore(course);
                                // Optional: Close panel on restore if you prefer
                                // onClose(); 
                            }}
                            title="Restore to Timetable"
                        >
                            ↩️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Minimize;