import React, { useState, useEffect } from 'react';
import { TimeEntry, CreateTimeEntryPayload } from '../services/TimeEntryService';
import './TimeEntryForm.css';

interface TimeEntryFormProps {
  workPackageId: string;
  workPackageSubject?: string;
  onSubmit: (data: CreateTimeEntryPayload) => Promise<void>;
  onCancel?: () => void;
  initialData?: TimeEntry;
  isLoading?: boolean;
}

export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  workPackageId,
  workPackageSubject,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateTimeEntryPayload>({
    work_package_id: workPackageId,
    hours: initialData?.hours ?? 1,
    date: initialData?.date ?? new Date().toISOString().split('T')[0],
    comment: initialData?.comment ?? '',
    billable: initialData?.billable ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (initialData) {
      const dateStr =
        typeof initialData.date === 'string'
          ? initialData.date.split('T')[0]
          : initialData.date.toISOString().split('T')[0];

      setFormData({
        work_package_id: initialData.work_package_id,
        hours: initialData.hours,
        date: dateStr,
        comment: initialData.comment ?? '',
        billable: initialData.billable,
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.hours || formData.hours <= 0) {
      newErrors.hours = 'Hours must be greater than 0';
    }

    if (formData.hours > 24) {
      newErrors.hours = 'Hours cannot exceed 24 per day';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    // Validate date is not in the future
    const selectedDate = new Date(formData.date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (selectedDate >= tomorrow) {
      newErrors.date = 'Cannot log time for future dates';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({
        work_package_id: workPackageId,
        hours: 1,
        date: new Date().toISOString().split('T')[0],
        comment: '',
        billable: false,
      });
      setSubmitted(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form className="time-entry-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="work-package">Work Package</label>
        <input
          type="text"
          id="work-package"
          value={workPackageSubject || workPackageId}
          disabled
          className="form-control disabled"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="hours">
            Hours <span className="required">*</span>
          </label>
          <input
            type="number"
            id="hours"
            name="hours"
            value={formData.hours}
            onChange={handleChange}
            step="0.5"
            min="0.5"
            max="24"
            className={`form-control ${errors.hours ? 'is-invalid' : ''}`}
            disabled={isLoading}
          />
          {errors.hours && <div className="error-message">{errors.hours}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="date">
            Date <span className="required">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`form-control ${errors.date ? 'is-invalid' : ''}`}
            disabled={isLoading}
          />
          {errors.date && <div className="error-message">{errors.date}</div>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="comment">Comment</label>
        <textarea
          id="comment"
          name="comment"
          value={formData.comment}
          onChange={handleChange}
          rows={3}
          className="form-control"
          placeholder="What did you work on?"
          disabled={isLoading}
        />
      </div>

      <div className="form-group checkbox">
        <input
          type="checkbox"
          id="billable"
          name="billable"
          checked={formData.billable}
          onChange={handleChange}
          disabled={isLoading}
        />
        <label htmlFor="billable">Billable</label>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || submitted}
        >
          {isLoading ? 'Saving...' : 'Save Time Entry'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
