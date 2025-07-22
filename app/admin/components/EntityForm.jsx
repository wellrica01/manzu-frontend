import React, { useState } from 'react';

/**
 * fields: Array of { name, label, type, options, required, ... }
 * initialValues: { [name]: value }
 * onSubmit: (values) => void
 */
export default function EntityForm({ fields, initialValues = {}, onSubmit, submitLabel = 'Save' }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (e, field) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic required validation
    const newErrors = {};
    fields.forEach((f) => {
      if (f.required && !values[f.name]) {
        newErrors[f.name] = `${f.label} is required`;
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onSubmit(values);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.type === 'select' ? (
            <select
              id={field.name}
              name={field.name}
              value={values[field.name] || ''}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Select {field.label}</option>
              {field.options && field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              id={field.name}
              name={field.name}
              value={values[field.name] || ''}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              rows={field.rows || 3}
            />
          ) : field.type === 'checkbox' ? (
            <input
              id={field.name}
              name={field.name}
              type="checkbox"
              checked={!!values[field.name]}
              onChange={handleChange}
              className="mr-2"
            />
          ) : (
            <input
              id={field.name}
              name={field.name}
              type={field.type || 'text'}
              value={values[field.name] || ''}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
            />
          )}
          {errors[field.name] && <div className="text-red-500 text-xs mt-1">{errors[field.name]}</div>}
        </div>
      ))}
      <button
        type="submit"
        className="bg-primary text-white px-6 py-2 rounded font-semibold hover:bg-primary-dark"
      >
        {submitLabel}
      </button>
    </form>
  );
} 