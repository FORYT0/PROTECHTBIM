import { useState } from 'react';

// Minimal test component to verify form submission works
export function ContractFormModalTest({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('✅ FORM SUBMITTED!');
    setIsSubmitting(true);

    setTimeout(() => {
      alert('Form submission works!');
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg">
        <h2 className="text-2xl mb-4">Test Form</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            required
            placeholder="Enter something"
            className="border p-2 mb-4 w-full"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </form>
      </div>
    </div>
  );
}
