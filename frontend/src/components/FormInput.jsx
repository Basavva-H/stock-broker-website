"use client"

import "./FormInput.css"

const FormInput = ({ label, type, name, value, onChange, error, placeholder, required }) => {
  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`form-input ${error ? "error" : ""}`}
      />
      {error && <p className="error-message">{error}</p>}
    </div>
  )
}

export default FormInput
