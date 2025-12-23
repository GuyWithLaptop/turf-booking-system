'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, BellOff, Check, LogOut, Plus, X, Edit2, Save } from 'lucide-react';
import { requestNotificationPermission, subscribeToPushNotifications } from '@/lib/notifications';

export default function MobileSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sports, setSports] = useState<string[]>(['Football', 'Cricket', 'Other']);
  const [newSport, setNewSport] = useState('');
  const [editingSports, setEditingSports] = useState(false);
  const [defaultPrice, setDefaultPrice] = useState('500');
  const [editingPrice, setEditingPrice] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
    fetchSports();
    fetchSettings();
  }, []);

  const fetchSports = async () => {
    try {
      const response = await fetch('/api/settings/sports');
      if (response.ok) {
        const data = await response.json();
        if (data.sports && data.sports.length > 0) {
          setSports(data.sports);
        }
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.defaultPrice) {
          setDefaultPrice(data.defaultPrice.toString());
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
        setSports([...sports, data.name]);
        setNewSport('');
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
        setSports(sports.filter(s => s !== sportName));
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
        alert('Default price updated');
      }
    } catch (error) {
      console.error('Error saving price:', error);
      alert('Failed to save price');
    }
  };

  const installApp = () => {
    alert('To install:\n\n1. Tap the browser menu (⋮)\n2. Select "Install app" or "Add to Home Screen"\n3. Follow the prompts\n\nThe app will appear on your home screen!');
  };

  return (
    <div className="pb-24 px-4 pt-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {/* Install App */}
      <Card className="p-6 bg-white mb-4">
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

      {/* Download APK Info */}
      <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white mt-4">
        <h3 className="text-lg font-semibold mb-2">Want a Native App?</h3>
        <p className="text-sm mb-4 text-purple-100">
          Download our Android APK for the best experience with offline support and faster performance.
        </p>
        <Button
          onClick={() => window.open('/download-apk', '_blank')}
          className="w-full bg-white text-purple-600 hover:bg-purple-50"
        >
          📥 Download APK (Coming Soon)
        </Button>
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
    </div>
  );
}
