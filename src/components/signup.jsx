import { useState } from 'react';

export default function Signup() {
  const [formData, setFormData] = useState({
    userName: '',
    userId: '',
    email: '',
    password: '',
    roles: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      roles: checked
        ? [...prev.roles, value]
        : prev.roles.filter(role => role !== value)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    const payload = {
      userName: formData.userName,
      userId: formData.userId,
      email: formData.email,
      password: formData.password,
      roles: formData.roles,
    };

    try {
      const response = await fetch('http://localhost:8080/public/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const data = await response.json();
      console.log('Signup success:', data);
      setSuccess(true);

    } catch (err) {
      setError(err.message || 'Signup error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

        <div className="space-y-4">
          <input
            name="userName"
            placeholder="Username"
            value={formData.userName}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            name="userId"
            placeholder="User ID"
            value={formData.userId}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                value="admin"
                onChange={handleRoleChange}
              />
              Admin
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                value="user"
                onChange={handleRoleChange}
              />
              User
            </label>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {success && (
            <div className="text-green-600 text-sm">
              Signup successful!
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
