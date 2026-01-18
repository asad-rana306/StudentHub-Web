import React from 'react';
import '../ClashCss/savedTimeTable.css';

const SavedTimetables = ({ isOpen, onClose, savedTimetables, onLoad, onDelete }) => {
    return (
        <div className={`popup-panel sidebar-panel ${isOpen ? 'open' : ''}`}>
            <div className="panel-header">
                <h3>Saved Tables</h3>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="saved-list">
                {savedTimetables.map((t, index) => (
                    <div 
                        key={t.id} 
                        className="saved-item" 
                        onClick={() => {
                            onLoad(t.courses); // Load data
                            onClose(); // Close sidebar
                        }}
                    > 
                        <div className="saved-id-badge">
                            {index + 1}
                        </div>

                        {/* 2. Content: Date & Course Names */}
                        <div className="saved-content">
                            <span className="saved-date">{t.date}</span>
                            <span className="course-names">
                                {t.courses.map(c => c.courseName).join(', ')}
                            </span>
                        </div>

                        {/* 3. Delete Button */}
                        <button 
                            className="delete-saved-btn" 
                            onClick={(e) => {
                                e.stopPropagation(); // Stop click from loading the table
                                onDelete(t.id);
                            }}
                            title="Delete Timetable"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
                
                {savedTimetables.length === 0 && <p className="empty-msg">No saved records</p>}
            </div>
        </div>
    );
};

export default SavedTimetables;