'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Check, LogOut, Plus, X, Edit2, Save, Repeat, UserPlus, Shield } from 'lucide-react';
import { requestNotificationPermission, subscribeToPushNotifications } from '@/lib/notifications';
import RecurringBookingsView from '@/components/RecurringBookingsView';
import GroupBooking from '@/components/GroupBooking';

type SettingsTab = 'general' | 'turf' | 'recurring' | 'subadmins';

export default function MobileSettings() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sports, setSports] = useState<string[]>(['Football', 'Cricket', 'Other']);
  const [newSport, setNewSport] = useState('');
  const [editingSports, setEditingSports] = useState(false);
  const [defaultPrice, setDefaultPrice] = useState('500');
  const [editingPrice, setEditingPrice] = useState(false);
  
  // Turf info state
  const [turfName, setTurfName] = useState('FS Sports Club');
  const [turfAddress, setTurfAddress] = useState('');
  const [turfNotes, setTurfNotes] = useState('');
  const [turfPhone, setTurfPhone] = useState('');
  const [editingTurfInfo, setEditingTurfInfo] = useState(false);
  
  // Sub-admin management state
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [newSubAdminEmail, setNewSubAdminEmail] = useState('');
  const [newSubAdminPassword, setNewSubAdminPassword] = useState('');
  const [newSubAdminName, setNewSubAdminName] = useState('');
  const [addingSubAdmin, setAddingSubAdmin] = useState(false);

  // Recurring booking state
  const [showGroupBooking, setShowGroupBooking] = useState(false);

  const isOwner = session?.user?.role === 'OWNER';

  useEffect(() => {
    checkNotificationStatus();
    fetchSports();
    fetchSettings();
    if (isOwner) {
      fetchSubAdmins();
    }
  }, [isOwner]);

  const fetchSports = async () => {
    // Check session storage cache first
    const cached = sessionStorage.getItem('availableSports');
    if (cached) {
      try {
        const sports = JSON.parse(cached);
        setSports(sports);
        return;
      } catch (e) {
        // Invalid cache
      }
    }

    try {
      const response = await fetch('/api/settings/sports');
      if (response.ok) {
        const data = await response.json();
        if (data.sports && data.sports.length > 0) {
          setSports(data.sports);
          sessionStorage.setItem('availableSports', JSON.stringify(data.sports));
        }
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  };

  const fetchSettings = async () => {
    // Check session storage cache
    const cached = sessionStorage.getItem('appSettings');
    if (cached) {
      try {
        const settings = JSON.parse(cached);
        if (settings.defaultPrice) {
          setDefaultPrice(settings.defaultPrice.toString());
          setTurfName(settings.turfName || 'FS Sports Club');
          setTurfAddress(settings.turfAddress || '');
          setTurfNotes(settings.turfNotes || '');
          setTurfPhone(settings.turfPhone || '');
          return;
        }
      } catch (e) {
        // Invalid cache
      }
    }

    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.defaultPrice) {
          setDefaultPrice(data.defaultPrice.toString());
          setTurfName(data.turfName || 'FS Sports Club');
          setTurfAddress(data.turfAddress || '');
          setTurfNotes(data.turfNotes || '');
          setTurfPhone(data.turfPhone || '');
          sessionStorage.setItem('appSettings', JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const checkNotificationStatus = () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        await subscribeToPushNotifications();
        setNotificationsEnabled(true);
        alert('Notifications enabled! You will receive booking reminders.');
      } else {
        alert('Please enable notifications in your browser settings.');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addSport = async () => {
    if (!newSport.trim()) return;
    
    try {
      const response = await fetch('/api/settings/sports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSport.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedSports = [...sports, data.name];
        setSports(updatedSports);
        setNewSport('');
        // Update cache
        sessionStorage.setItem('availableSports', JSON.stringify(updatedSports));
      }
    } catch (error) {
      console.error('Error adding sport:', error);
      alert('Failed to add sport');
    }
  };

  const removeSport = async (sportName: string) => {
    try {
      const response = await fetch('/api/settings/sports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sportName })
      });
      
      if (response.ok) {
        const updatedSports = sports.filter(s => s !== sportName);
        setSports(updatedSports);
        // Update cache
        sessionStorage.setItem('availableSports', JSON.stringify(updatedSports));
      }
    } catch (error) {
      console.error('Error removing sport:', error);
      alert('Failed to remove sport');
    }
  };

  const saveDefaultPrice = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultPrice: parseInt(defaultPrice) })
      });
      
      if (response.ok) {
        setEditingPrice(false);
        // Update cache
        sessionStorage.setItem('appSettings', JSON.stringify({ defaultPrice: parseInt(defaultPrice) }));
        alert('Default price updated');
      }
    } catch (error) {
      console.error('Error saving price:', error);
      alert('Failed to save price');
    }
  };

  const fetchSubAdmins = async () => {
    try {
      const response = await fetch('/api/admin/subadmins');
      if (response.ok) {
        const data = await response.json();
        setSubAdmins(data.subadmins || []);
      }
    } catch (error) {
      console.error('Error fetching sub-admins:', error);
    }
  };

  const addSubAdmin = async () => {
    if (!newSubAdminEmail || !newSubAdminPassword || !newSubAdminName) {
      alert('Please fill all fields');
      return;
    }

    setAddingSubAdmin(true);
    try {
      const response = await fetch('/api/admin/subadmins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newSubAdminEmail,
          password: newSubAdminPassword,
          name: newSubAdminName,
        }),
      });

      if (response.ok) {
        alert('Sub-admin added successfully');
        setNewSubAdminEmail('');
        setNewSubAdminPassword('');
        setNewSubAdminName('');
        fetchSubAdmins();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add sub-admin');
      }
    } catch (error) {
      console.error('Error adding sub-admin:', error);
      alert('Failed to add sub-admin');
    } finally {
      setAddingSubAdmin(false);
    }
  };

  const removeSubAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to remove this sub-admin?')) return;

    try {
      const response = await fetch(`/api/admin/subadmins?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Sub-admin removed successfully');
        fetchSubAdmins();
      } else {
        alert('Failed to remove sub-admin');
      }
    } catch (error) {
      console.error('Error removing sub-admin:', error);
      alert('Failed to remove sub-admin');
    }
  };

  const saveTurfInfo = async () => {
    try {
      const response = await fetch('/api/settings/turf', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turfName,
          turfAddress,
          turfNotes,
          turfPhone,
        }),
      });

      if (response.ok) {
        setEditingTurfInfo(false);
        // Update cache
        const settings = { defaultPrice: parseInt(defaultPrice), turfName, turfAddress, turfNotes, turfPhone };
        sessionStorage.setItem('appSettings', JSON.stringify(settings));
        alert('Turf info updated successfully');
      } else {
        alert('Failed to update turf info');
      }
    } catch (error) {
      console.error('Error saving turf info:', error);
      alert('Failed to update turf info');
    }
  };

  const installApp = () => {
    alert('To install:\n\n1. Tap the browser menu (⋮)\n2. Select "Install app" or "Add to Home Screen"\n3. Follow the prompts\n\nThe app will appear on your home screen!');
  };

  return (
    <div className="pb-24 px-4 pt-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <Button
          variant={activeTab === 'general' ? 'default' : 'outline'}
          onClick={() => setActiveTab('general')}
          className="whitespace-nowrap"
        >
          General
        </Button>
        <Button
          variant={activeTab === 'turf' ? 'default' : 'outline'}
          onClick={() => setActiveTab('turf')}
          className="whitespace-nowrap"
        >
          Turf Info
        </Button>
        <Button
          variant={activeTab === 'recurring' ? 'default' : 'outline'}
          onClick={() => setActiveTab('recurring')}
          className="whitespace-nowrap gap-2"
        >
          <Repeat className="w-4 h-4" />
          Recurring
        </Button>
        {isOwner && (
          <Button
            variant={activeTab === 'subadmins' ? 'default' : 'outline'}
            onClick={() => setActiveTab('subadmins')}
            className="whitespace-nowrap gap-2"
          >
            <Shield className="w-4 h-4" />
            Sub-Admins
          </Button>
        )}
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <>
          {/* Expense Manager */}
          <div
            onClick={() => window.location.href = '/admin/expenses'}
            className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Expense Manager</h3>
                <p className="text-gray-600 text-sm">Manage your expense</p>
              </div>
            </div>
            <span className="text-gray-400 text-2xl">›</span>
          </div>

          {/* Add Group Booking */}
          <div
            onClick={() => setActiveTab('recurring')}
            className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-100 rounded-full p-3 flex items-center justify-center w-12 h-12">
                <span className="text-green-600 font-bold text-lg">G</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add Group Booking</h3>
              </div>
            </div>
            <span className="text-gray-400 text-2xl">›</span>
          </div>

          {/* Add UPI ID */}
          <div
            className="bg-white rounded-2xl p-4 mb-4 flex items-center cursor-pointer hover:bg-gray-50 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 rounded-full p-3">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add UPI ID</h3>
              </div>
            </div>
          </div>

          {/* Add Sub-admin */}
          {isOwner && (
            <div
              onClick={() => setActiveTab('subadmins')}
              className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add Sub-admin</h3>
                </div>
              </div>
              <span className="text-gray-400 text-2xl">›</span>
            </div>
          )}

          {/* Install App */}
          <Card className="p-6 bg-white mb-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Install App</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add this app to your home screen for quick access
                </p>
              </div>
            </div>
            <Button
              onClick={installApp}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              📱 Install on Home Screen
            </Button>
          </Card>

      {/* Manage Sports */}
      <Card className="p-6 bg-white mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Manage Sports</h3>
            <p className="text-sm text-gray-600 mt-1">
              Add or remove available sports for booking
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingSports(!editingSports)}
          >
            {editingSports ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>
        </div>

        {editingSports && (
          <div className="mb-4">
            <div className="flex gap-2">
              <Input
                value={newSport}
                onChange={(e) => setNewSport(e.target.value)}
                placeholder="Enter sport name"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addSport()}
              />
              <Button
                onClick={addSport}
                className="bg-emerald-500 hover:bg-emerald-600"
                disabled={!newSport.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {sports.map((sport) => (
            <div
              key={sport}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium text-gray-800">{sport}</span>
              {editingSports && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeSport(sport)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Default Price */}
      <Card className="p-6 bg-white mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Default Booking Price</h3>
            <p className="text-sm text-gray-600 mt-1">
              Set the default price per slot
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => editingPrice ? saveDefaultPrice() : setEditingPrice(true)}
          >
            {editingPrice ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-700">₹</span>
          {editingPrice ? (
            <Input
              type="number"
              value={defaultPrice}
              onChange={(e) => setDefaultPrice(e.target.value)}
              className="flex-1 text-lg"
            />
          ) : (
            <span className="text-2xl font-bold text-emerald-600">{defaultPrice}</span>
          )}
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6 bg-white mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {notificationsEnabled ? (
              <div className="p-3 bg-emerald-100 rounded-full">
                <Bell className="w-6 h-6 text-emerald-600" />
              </div>
            ) : (
              <div className="p-3 bg-gray-100 rounded-full">
                <BellOff className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600">
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
          {notificationsEnabled && (
            <div className="p-2 bg-emerald-100 rounded-full">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
          )}
        </div>

        {!notificationsEnabled && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Enable notifications to receive:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4">
              <li>• Booking reminders (1 hour before)</li>
              <li>• New booking alerts</li>
              <li>• Booking confirmations</li>
            </ul>
          </div>
        )}

        <Button
          onClick={handleEnableNotifications}
          disabled={loading || notificationsEnabled}
          className={`w-full ${
            notificationsEnabled
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {loading ? 'Enabling...' : notificationsEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
        </Button>
      </Card>

      {/* App Info */}
      <Card className="p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">App Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Version</span>
            <span className="font-medium text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type</span>
            <span className="font-medium text-gray-900">Progressive Web App</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className="font-medium text-emerald-600">Online</span>
          </div>
        </div>
      </Card>

      {/* Logout */}
      <Card className="p-6 bg-white mt-4">
        <Button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </Card>
        </>
      )}

      {/* Turf Info Tab */}
      {activeTab === 'turf' && (
        <>
          <Card className="p-6 bg-white mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Turf Information</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Customize turf details for booking confirmations
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => editingTurfInfo ? saveTurfInfo() : setEditingTurfInfo(true)}
              >
                {editingTurfInfo ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </Button>
            </div>

            <div className="space-y-4">
              {/* Turf Name */}
              <div>
                <Label htmlFor="turfName" className="text-sm font-medium text-gray-700">
                  Turf Name
                </Label>
                <Input
                  id="turfName"
                  value={turfName}
                  onChange={(e) => setTurfName(e.target.value)}
                  disabled={!editingTurfInfo}
                  placeholder="Enter turf name"
                  className="mt-1"
                />
              </div>

              {/* Turf Address */}
              <div>
                <Label htmlFor="turfAddress" className="text-sm font-medium text-gray-700">
                  Address
                </Label>
                <textarea
                  id="turfAddress"
                  value={turfAddress}
                  onChange={(e) => setTurfAddress(e.target.value)}
                  disabled={!editingTurfInfo}
                  placeholder="Enter turf address"
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-600"
                />
              </div>

              {/* Turf Phone */}
              <div>
                <Label htmlFor="turfPhone" className="text-sm font-medium text-gray-700">
                  Contact Phone
                </Label>
                <Input
                  id="turfPhone"
                  value={turfPhone}
                  onChange={(e) => setTurfPhone(e.target.value)}
                  disabled={!editingTurfInfo}
                  placeholder="Enter contact number"
                  className="mt-1"
                />
              </div>

              {/* Turf Notes */}
              <div>
                <Label htmlFor="turfNotes" className="text-sm font-medium text-gray-700">
                  Additional Notes
                </Label>
                <textarea
                  id="turfNotes"
                  value={turfNotes}
                  onChange={(e) => setTurfNotes(e.target.value)}
                  disabled={!editingTurfInfo}
                  placeholder="Any special instructions or notes (optional)"
                  rows={4}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-600"
                />
              </div>
            </div>

            {editingTurfInfo && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 This information will be included in WhatsApp booking confirmations sent to customers.
                </p>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Recurring Bookings Tab */}
      {activeTab === 'recurring' && (
        <>
          {showGroupBooking ? (
            <GroupBooking onBack={() => setShowGroupBooking(false)} />
          ) : (
            <div className="space-y-4">
              <Button
                onClick={() => setShowGroupBooking(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Group Booking
              </Button>
              
              <div className="bg-white rounded-lg p-3 sm:p-4 max-w-full overflow-hidden">
                <RecurringBookingsView />
              </div>
            </div>
          )}
        </>
      )}

      {/* Sub-Admins Tab */}
      {activeTab === 'subadmins' && isOwner && (
        <>
          {/* Add Sub-Admin */}
          <Card className="p-6 bg-white mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Sub-Admin
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Sub-admins can manage bookings but cannot view revenue or access settings
            </p>
            
            <div className="space-y-3">
              <Input
                type="text"
                value={newSubAdminName}
                onChange={(e) => setNewSubAdminName(e.target.value)}
                placeholder="Full Name"
              />
              <Input
                type="email"
                value={newSubAdminEmail}
                onChange={(e) => setNewSubAdminEmail(e.target.value)}
                placeholder="Email"
              />
              <Input
                type="password"
                value={newSubAdminPassword}
                onChange={(e) => setNewSubAdminPassword(e.target.value)}
                placeholder="Password"
              />
              <Button
                onClick={addSubAdmin}
                disabled={addingSubAdmin}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                {addingSubAdmin ? 'Adding...' : 'Add Sub-Admin'}
              </Button>
            </div>
          </Card>

          {/* Sub-Admins List */}
          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Sub-Admins</h3>
            {subAdmins.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sub-admins added yet</p>
            ) : (
              <div className="space-y-3">
                {subAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{admin.name}</p>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeSubAdmin(admin.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
