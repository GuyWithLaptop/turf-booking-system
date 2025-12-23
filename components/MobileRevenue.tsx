'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Plus, X } from 'lucide-react';
import { format, startOfDay, isSameDay } from 'date-fns';

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: string;
  charge: number;
  notes?: string;
};

type Expense = {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  date: string;
};

type DailyRevenue = {
  date: string;
  advance: number;
  paid: number;
  total: number;
  expenses: number;
  net: number;
};

export default function MobileRevenue() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'MAINTENANCE',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchBookings();
    fetchExpenses();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      // Ensure data is an array before setting it
      if (Array.isArray(data)) {
        setBookings(data);
      } else {
        console.error('Invalid data format:', data);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) {
        console.error('Failed to fetch expenses');
        setExpenses([]);
        return;
      }
      const data = await response.json();
      // Handle both formats: {expenses: [...], pagination: {...}} or just [...]
      if (data.expenses && Array.isArray(data.expenses)) {
        setExpenses(data.expenses);
      } else if (Array.isArray(data)) {
        setExpenses(data);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: expenseForm.title,
          description: expenseForm.description,
          amount: parseFloat(expenseForm.amount),
          category: expenseForm.category,
          date: new Date(expenseForm.date).toISOString(),
        }),
      });

      if (response.ok) {
        alert('Expense added successfully!');
        setShowExpenseForm(false);
        setExpenseForm({
          title: '',
          description: '',
          amount: '',
          category: 'MAINTENANCE',
          date: format(new Date(), 'yyyy-MM-dd'),
        });
        fetchExpenses();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    }
  };

  // Calculate last 7 days revenue grouped by date
  const last7DaysRevenue: DailyRevenue[] = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.startTime);
    return bookingDate >= sevenDaysAgo && b.status !== 'CANCELLED';
  });

  // Group bookings by date
  const bookingsByDate = recentBookings.reduce((acc, booking) => {
    const dateKey = format(new Date(booking.startTime), 'dd/MM');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  // Group expenses by date
  const recentExpenses = Array.isArray(expenses) ? expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return expenseDate >= sevenDaysAgo;
  }) : [];

  const expensesByDate = recentExpenses.reduce((acc, expense) => {
    const dateKey = format(new Date(expense.date), 'dd/MM');
    if (!acc[dateKey]) {
      acc[dateKey] = 0;
    }
    acc[dateKey] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Get all unique dates from both bookings and expenses
  const allDates = new Set([...Object.keys(bookingsByDate), ...Object.keys(expensesByDate)]);

  // Create revenue entries for each date
  Array.from(allDates).sort((a, b) => {
    // Convert dd/MM to comparable format
    const [dayA, monthA] = a.split('/').map(Number);
    const [dayB, monthB] = b.split('/').map(Number);
    if (monthA !== monthB) return monthA - monthB;
    return dayA - dayB;
  }).forEach((date) => {
    const dayBookings = bookingsByDate[date] || [];
    const dayExpenses = expensesByDate[date] || 0;

    const advance = dayBookings.reduce((sum, b) => {
      const advanceMatch = b.notes?.match(/Advance: (\d+)/);
      return sum + (advanceMatch ? parseInt(advanceMatch[1]) : 0);
    }, 0);
    
    const total = dayBookings.reduce((sum, b) => sum + b.charge, 0);
    const paid = total - advance;
    const net = total - dayExpenses;

    last7DaysRevenue.push({
      date,
      advance,
      paid,
      total,
      expenses: dayExpenses,
      net,
    });
  });

  const grandTotal = last7DaysRevenue.reduce((sum, day) => sum + day.total, 0);
  const totalAdvance = last7DaysRevenue.reduce((sum, day) => sum + day.advance, 0);
  const totalPaid = last7DaysRevenue.reduce((sum, day) => sum + day.paid, 0);
  const totalExpenses = last7DaysRevenue.reduce((sum, day) => sum + day.expenses, 0);
  const netProfit = grandTotal - totalExpenses;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Revenue</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowExpenseForm(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
          <Button variant="outline" size="sm" className="bg-white">
            <FileText className="w-4 h-4 mr-2 text-emerald-600" />
            <span className="text-emerald-600">PDF</span>
          </Button>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-emerald-600 mb-4">Last 7 day's revenue</h2>

        <Card className="bg-white overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-5 bg-gray-50 border-b">
            <div className="p-3 text-sm font-semibold text-emerald-700">Date</div>
            <div className="p-3 text-sm font-semibold text-emerald-700 text-right">Adv. ₹</div>
            <div className="p-3 text-sm font-semibold text-emerald-700 text-right">Paid ₹</div>
            <div className="p-3 text-sm font-semibold text-red-700 text-right">Exp. ₹</div>
            <div className="p-3 text-sm font-semibold text-emerald-700 text-right">Net ₹</div>
          </div>

          {/* Table Rows */}
          {last7DaysRevenue.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No revenue data for the last 7 days
            </div>
          ) : (
            last7DaysRevenue.map((day, idx) => (
              <div
                key={idx}
                className="grid grid-cols-5 border-b last:border-b-0 hover:bg-gray-50"
              >
                <div className="p-3 text-sm font-medium text-gray-900">{day.date}</div>
                <div className="p-3 text-sm text-gray-700 text-right">{day.advance.toFixed(1)}</div>
                <div className="p-3 text-sm text-gray-700 text-right">{day.paid.toFixed(1)}</div>
                <div className="p-3 text-sm font-semibold text-red-600 text-right">
                  {day.expenses > 0 ? `-${day.expenses.toFixed(1)}` : '0.0'}
                </div>
                <div className={`p-3 text-sm font-semibold text-right ${day.net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {day.net.toFixed(1)}
                </div>
              </div>
            ))
          )}

          {/* Total Row */}
          {last7DaysRevenue.length > 0 && (
            <div className="grid grid-cols-5 bg-emerald-50 border-t-2 border-emerald-200">
              <div className="p-3 text-sm font-bold text-emerald-800">{last7DaysRevenue.length}</div>
              <div className="p-3 text-sm font-bold text-emerald-800 text-right">{totalAdvance} ₹</div>
              <div className="p-3 text-sm font-bold text-emerald-800 text-right">{totalPaid} ₹</div>
              <div className="p-3 text-sm font-bold text-red-700 text-right">-{totalExpenses} ₹</div>
              <div className={`p-3 text-sm font-bold text-right ${netProfit >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                {netProfit} ₹
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Payment Method Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 bg-white">
          <div className="text-xs text-gray-600 mb-1">Revenue</div>
          <div className="text-xl font-bold text-emerald-600">{grandTotal} ₹</div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="text-xs text-gray-600 mb-1">Expense</div>
          <div className="text-xl font-bold text-red-600">{totalExpenses} ₹</div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="text-xs text-gray-600 mb-1">Net Profit</div>
          <div className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netProfit} ₹
          </div>
        </Card>
      </div>

      {/* Add Expense Modal */}
      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-xl font-bold text-gray-900">Add Expense</DialogTitle>
          <DialogDescription className="sr-only">
            Add a new expense to track your turf costs
          </DialogDescription>
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g., Electricity bill"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Additional details (optional)"
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="500"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="ELECTRICITY">Electricity</option>
                  <option value="WATER">Water</option>
                  <option value="STAFF_SALARY">Staff Salary</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowExpenseForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddExpense}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Add Expense
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
