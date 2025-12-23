'use client';

import { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { FileText, Filter, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Expense = {
  id: string;
  title?: string;
  description?: string;
  amount: number;
  category: string;
  paymentMethod?: string;
  date: string;
  createdAt: string;
};

const categoryEmojis: Record<string, string> = {
  MAINTENANCE: '💼',
  ELECTRICITY: '⚡',
  WATER: '💧',
  STAFF_SALARY: '👤',
  EQUIPMENT: '🏗️',
  OTHER: '📦',
};

export default function ExpensesList() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPayment, setFilterPayment] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    // Category filter
    if (filterCategory !== 'ALL' && exp.category !== filterCategory) return false;
    
    // Payment method filter
    if (filterPayment !== 'ALL' && exp.paymentMethod !== filterPayment) return false;
    
    // Date range filter
    if (startDate && endDate) {
      const expDate = new Date(exp.date);
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));
      if (expDate < start || expDate > end) return false;
    }
    
    return true;
  });

  // Get last 7 days expenses (only if no custom date filter)
  const displayExpenses = startDate && endDate ? filteredExpenses : (() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return filteredExpenses.filter(exp => new Date(exp.date) >= sevenDaysAgo);
  })();

  const totalAmount = displayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categories = ['ALL', 'MAINTENANCE', 'ELECTRICITY', 'WATER', 'STAFF_SALARY', 'EQUIPMENT', 'OTHER'];
  const paymentMethods = ['ALL', 'Cash', 'Online', 'Card'];

  const clearFilters = () => {
    setFilterCategory('ALL');
    setFilterPayment('ALL');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">List Expense</h1>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </button>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Filter className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filter Dropdown */}
        {showFilter && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`p-2 rounded-lg text-xs ${
                      filterCategory === cat
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {paymentMethods.map(pm => (
                  <button
                    key={pm}
                    onClick={() => setFilterPayment(pm)}
                    className={`p-2 rounded-lg text-xs ${
                      filterPayment === pm
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="w-full p-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h2 className="text-green-600 font-bold text-lg mb-4">
          {startDate && endDate ? 'Filtered Expenses' : 'Last 7 days Expense'}
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : displayExpenses.length === 0 ? (
          <div className="bg-white rounded-xl p-4 text-center text-gray-500">
            No expenses found
          </div>
        ) : (
          <div className="space-y-3">
            {displayExpenses.map(expense => (
              <div
                key={expense.id}
                onClick={() => router.push(`/admin/expenses/${expense.id}`)}
                className="bg-white rounded-xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 rounded-full p-3">
                    <span className="text-2xl">{categoryEmojis[expense.category] || '💼'}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{expense.title || expense.description || 'Expense'}</h3>
                    <p className="text-sm text-gray-600 capitalize">{expense.category.replace('_', ' ').toLowerCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹ {expense.amount}</p>
                  <p className="text-sm text-gray-500">{format(new Date(expense.date), 'dd-MM-yyyy')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {displayExpenses.length === 0 && !loading && (
          <p className="text-center text-gray-400 mt-8">No more data</p>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 flex items-center justify-between">
        <span className="font-bold">Expense :</span>
        <span className="font-bold text-xl">{totalAmount} ₹</span>
      </div>

      {/* Add Button */}
      <button
        onClick={() => router.push('/admin/expenses/new')}
        className="fixed bottom-20 right-6 bg-green-400 hover:bg-green-500 text-white rounded-full p-4 shadow-lg"
      >
        <span className="text-2xl font-bold">+</span>
      </button>
    </div>
  );
}
