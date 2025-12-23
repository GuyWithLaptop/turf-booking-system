'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';

type ExpenseForm = {
  category: string;
  amount: string;
  paymentMethod: string;
  date: string;
  description: string;
};

const categories = [
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'WATER', label: 'Water' },
  { value: 'STAFF_SALARY', label: 'Staff Salary' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'OTHER', label: 'Other' },
];

const paymentMethods = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Online', label: 'Online' },
  { value: 'Card', label: 'Card' },
];

export default function AddExpense() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ExpenseForm>({
    category: '',
    amount: '',
    paymentMethod: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.category || !form.amount || !form.paymentMethod) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          amount: parseFloat(form.amount),
          paymentMethod: form.paymentMethod,
          date: new Date(form.date).toISOString(),
          title: form.description || `${form.category} expense`,
          description: form.description,
        }),
      });

      if (response.ok) {
        alert('Expense added successfully!');
        router.push('/admin/expenses');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full mr-2"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Add Expense</h1>
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-6">
          {/* Category */}
          <div>
            <label className="block text-gray-900 font-bold mb-2">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-gray-900 font-bold mb-2">Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Amount"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-gray-900 font-bold mb-2">Payment Method</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Select Payment Method</option>
              {paymentMethods.map(pm => (
                <option key={pm.value} value={pm.value}>{pm.label}</option>
              ))}
            </select>
          </div>

          {/* Expense Date */}
          <div>
            <label className="block text-gray-900 font-bold mb-2">Expense Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-900 font-bold mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description (max 200 chars)"
              maxLength={200}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-400 hover:bg-green-500 text-white font-bold py-4 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
