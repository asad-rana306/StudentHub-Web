import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FillForm() {
  const navigate = useNavigate();
  const token = localStorage.getItem('jwtToken');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState(null);

  const [formData, setFormData] = useState({
    studentName: '',
    regNumber: '',
    fatherName: '',
    cnic: '',
    dateOfBirth: '',
    gender: '',
    contactNumber: '',
    email: '',
    department: '',
    program: '',
    semester: '',
    batch: '',
    section: '',
    currentSubjects: '',
    completedCredits: '',
    cgpa: '',
    gpa: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    guardianName: '',
    guardianContact: '',
    guardianRelation: '',
    status: ''
  });

  /* -------------------- CHANGE HANDLERS -------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      // remove "data:image/...;base64,"
      const base64 = reader.result.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  /* -------------------- SUBMIT -------------------- */
  const handleSubmit = async () => {
    setError('');

    // ✅ Only @NonNull validation
    if (!formData.dateOfBirth || !formData.gender || !formData.email || !formData.status) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      semester: formData.semester ? Number(formData.semester) : null,
      completedCredits: formData.completedCredits ? Number(formData.completedCredits) : null,
      cgpa: formData.cgpa ? Number(formData.cgpa) : null,
      gpa: formData.gpa ? Number(formData.gpa) : null,
      currentSubjects: formData.currentSubjects
        ? formData.currentSubjects.split(',').map(s => s.trim())
        : [],
      image: imageBase64 // ✅ profile picture
    };

    try {
      const res = await fetch('http://localhost:8080/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save student profile');
      }

      navigate('/dashboard', { replace: true });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Student Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(formData).map((field) => (
          <input
            key={field}
            name={field}
            placeholder={field}
            value={formData[field]}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        ))}

        {/* ✅ Profile Picture */}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="border p-2 rounded col-span-full"
        />
      </div>

      {error && <div className="text-red-600 mt-4">{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </div>
  );
}
