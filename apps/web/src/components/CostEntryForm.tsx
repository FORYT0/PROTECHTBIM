import React, { useState } from 'react';
import { CostType, CreateCostEntryPayload } from '../services/CostTrackingService';
import './CostEntryForm.css';

interface CostEntryFormProps {
  workPackageId: string;
  workPackageSubject?: string;
  onSubmit: (data: CreateCostEntryPayload) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const COST_TYPES = [
  { value: CostType.LABOR, label: 'Labor' },
  { value: CostType.MATERIAL, label: 'Material' },
  { value: CostType.EQUIPMENT, label: 'Equipment' },
  { value: CostType.SUBCONTRACTOR, label: 'Subcontractor' },
  { value: CostType.OTHER, label: 'Other' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'];

export const CostEntryForm: React.FC<CostEntryFormProps> = ({
  workPackageId,
  workPackageSubject,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateCostEntryPayload>({
    work_package_id: workPackageId,
    type: CostType.OTHER,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    billable: false,
    currency: 'USD',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.type) {
      newErrors.type = 'Cost type is required';
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
        type: CostType.OTHER,
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        billable: false,
        currency: 'USD',
      });
      setSubmitted(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form className="cost-entry-form" onSubmit={handleSubmit}>
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
          <label htmlFor="type">
            Cost Type <span className="required">*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={`form-control ${errors.type ? 'is-invalid' : ''}`}
            disabled={isLoading}
          >
            {COST_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && <div className="error-message">{errors.type}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="amount">
            Amount <span className="required">*</span>
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
            disabled={isLoading}
          />
          {errors.amount && <div className="error-message">{errors.amount}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="currency">Currency</label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="form-control"
            disabled={isLoading}
          >
            {CURRENCIES.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="date">
          Date <span className="required">*</span>
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : formData.date}
          onChange={handleChange}
          className={`form-control ${errors.date ? 'is-invalid' : ''}`}
          disabled={isLoading}
        />
        {errors.date && <div className="error-message">{errors.date}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="form-control"
          placeholder="Cost details or reference"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="reference">Reference</label>
        <input
          type="text"
          id="reference"
          name="reference"
          value={formData.reference || ''}
          onChange={handleChange}
          className="form-control"
          placeholder="Invoice #, PO #, etc."
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
        <label htmlFor="billable">Billable to client</label>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || submitted}
        >
          {isLoading ? 'Saving...' : 'Add Cost Entry'}
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
