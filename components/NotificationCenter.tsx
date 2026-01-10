import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  X,
  RefreshCw,
  Settings
} from 'lucide-react';
import { formatCurrency } from '../services/dataService';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

interface PriceAlert {
  id: string;
  ticker: string;
  target_price: number;
  condition: 'above' | 'below';
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const NotificationCenter: React.FC = () => {
  const { t } = useTranslation('common');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'notifications' | 'alerts'>('notifications');
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({ ticker: '', target_price: '', condition: 'above' as 'above' | 'below' });

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/notifications?limit=50`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/notifications/alerts?active_only=false`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) throw new Error('Failed to fetch alerts');

      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchNotifications(), fetchAlerts()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const createAlert = async () => {
    if (!newAlert.ticker || !newAlert.target_price) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/notifications/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ticker: newAlert.ticker.toUpperCase(),
          target_price: parseFloat(newAlert.target_price),
          condition: newAlert.condition
        })
      });

      if (!response.ok) throw new Error('Failed to create alert');

      const data = await response.json();
      setAlerts(prev => [data, ...prev]);
      setShowCreateAlert(false);
      setNewAlert({ ticker: '', target_price: '', condition: 'above' });
    } catch (err) {
      console.error('Failed to create alert:', err);
    }
  };

  const toggleAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/notifications/alerts/${alertId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) throw new Error('Failed to toggle alert');

      const data = await response.json();
      setAlerts(prev =>
        prev.map(a => a.id === alertId ? { ...a, is_active: data.is_active } : a)
      );
    } catch (err) {
      console.error('Failed to toggle alert:', err);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_BASE_URL}/api/notifications/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_alert':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'portfolio_change':
        return <TrendingUp className="w-5 h-5 text-toss-blue" />;
      case 'system':
        return <Settings className="w-5 h-5 text-toss-grey-500" />;
      default:
        return <Bell className="w-5 h-5 text-toss-grey-500" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-toss-grey-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-toss-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-bold text-toss-grey-900 mb-1">{t('notifications.loading')}</h3>
          <p className="text-sm text-toss-grey-500">{t('labels.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-toss-grey-900">{t('notifications.title')}</h2>
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 bg-toss-red text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'notifications' && unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-toss-grey-200 text-toss-grey-700 rounded-xl hover:bg-toss-grey-50 transition-colors text-sm font-medium"
            >
              <CheckCheck size={16} />
              {t('notifications.markAllRead')}
            </button>
          )}
          {activeTab === 'alerts' && (
            <button
              onClick={() => setShowCreateAlert(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-toss-blue text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              {t('notifications.addAlert')}
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2.5 hover:bg-toss-grey-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-toss-grey-500" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-toss-grey-200">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'notifications'
              ? 'text-toss-blue'
              : 'text-toss-grey-500 hover:text-toss-grey-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {t('notifications.tabs.notifications')}
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-toss-red text-white text-xs font-bold rounded-full min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          {activeTab === 'notifications' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-toss-blue" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'alerts'
              ? 'text-toss-blue'
              : 'text-toss-grey-500 hover:text-toss-grey-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {t('notifications.tabs.priceAlerts')}
            <span className="px-1.5 py-0.5 bg-toss-grey-100 text-toss-grey-600 text-xs font-bold rounded-full">
              {alerts.filter(a => a.is_active).length}
            </span>
          </div>
          {activeTab === 'alerts' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-toss-blue" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-toss-grey-100 rounded-3xl shadow-sm overflow-hidden">
        {activeTab === 'notifications' && (
          <>
            {notifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-toss-grey-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BellOff className="w-8 h-8 text-toss-grey-300" />
                </div>
                <h3 className="text-lg font-bold text-toss-grey-900 mb-2">{t('notifications.noData')}</h3>
                <p className="text-sm text-toss-grey-500">{t('notifications.noDataDesc')}</p>
              </div>
            ) : (
              <div className="divide-y divide-toss-grey-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-5 hover:bg-toss-grey-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-toss-grey-100 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className={`font-semibold text-toss-grey-900 ${!notification.is_read ? 'font-bold' : ''}`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-toss-grey-600 mt-1">{notification.message}</p>
                            <span className="text-xs text-toss-grey-400 mt-2 block">
                              {formatRelativeTime(notification.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 hover:bg-toss-grey-200 rounded-lg transition-colors"
                                title={t('notifications.markAsRead')}
                              >
                                <Check className="w-4 h-4 text-toss-grey-500" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title={t('notifications.delete')}
                            >
                              <Trash2 className="w-4 h-4 text-toss-grey-400 hover:text-toss-red" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'alerts' && (
          <>
            {alerts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-toss-grey-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-toss-grey-300" />
                </div>
                <h3 className="text-lg font-bold text-toss-grey-900 mb-2">{t('notifications.noPriceAlerts')}</h3>
                <p className="text-sm text-toss-grey-500 mb-4">{t('notifications.noPriceAlertsDesc')}</p>
                <button
                  onClick={() => setShowCreateAlert(true)}
                  className="px-6 py-2.5 bg-toss-blue text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  {t('notifications.addAlert')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-toss-grey-100">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-5 hover:bg-toss-grey-50 transition-colors ${
                      !alert.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          alert.condition === 'above' ? 'bg-red-50' : 'bg-blue-50'
                        }`}>
                          {alert.condition === 'above' ? (
                            <TrendingUp className="w-5 h-5 text-toss-red" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-toss-blue" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-toss-grey-900">{alert.ticker}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              alert.condition === 'above'
                                ? 'bg-red-50 text-toss-red'
                                : 'bg-blue-50 text-toss-blue'
                            }`}>
                              {alert.condition === 'above' ? t('notifications.modal.above') : t('notifications.modal.below')}
                            </span>
                          </div>
                          <div className="text-sm text-toss-grey-600 mt-1">
                            {t('notifications.targetPrice')}: <span className="font-semibold">{formatCurrency(alert.target_price)}</span>
                          </div>
                          <span className="text-xs text-toss-grey-400">
                            {new Date(alert.created_at).toLocaleDateString()} {t('notifications.created')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAlert(alert.id)}
                          className={`relative w-12 h-7 rounded-full transition-colors ${
                            alert.is_active ? 'bg-toss-blue' : 'bg-toss-grey-300'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              alert.is_active ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('notifications.delete')}
                        >
                          <Trash2 className="w-4 h-4 text-toss-grey-400 hover:text-toss-red" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateAlert && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-toss-grey-100">
              <h3 className="text-lg font-bold text-toss-grey-900">{t('notifications.modal.title')}</h3>
              <button
                onClick={() => setShowCreateAlert(false)}
                className="p-2 hover:bg-toss-grey-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-toss-grey-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-toss-grey-700 mb-2">{t('notifications.modal.stock')}</label>
                <input
                  type="text"
                  placeholder={t('notifications.modal.stockPlaceholder')}
                  value={newAlert.ticker}
                  onChange={(e) => setNewAlert({ ...newAlert, ticker: e.target.value.toUpperCase() })}
                  className="w-full bg-toss-grey-50 border border-toss-grey-200 rounded-xl px-4 py-3 focus:outline-none focus:border-toss-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-toss-grey-700 mb-2">{t('notifications.modal.targetPrice')}</label>
                <input
                  type="number"
                  placeholder={t('notifications.modal.targetPricePlaceholder')}
                  value={newAlert.target_price}
                  onChange={(e) => setNewAlert({ ...newAlert, target_price: e.target.value })}
                  className="w-full bg-toss-grey-50 border border-toss-grey-200 rounded-xl px-4 py-3 focus:outline-none focus:border-toss-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-toss-grey-700 mb-2">{t('notifications.modal.condition')}</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewAlert({ ...newAlert, condition: 'above' })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                      newAlert.condition === 'above'
                        ? 'bg-red-50 text-toss-red border-2 border-red-200'
                        : 'bg-toss-grey-50 text-toss-grey-600 border-2 border-transparent'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    {t('notifications.modal.above')}
                  </button>
                  <button
                    onClick={() => setNewAlert({ ...newAlert, condition: 'below' })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                      newAlert.condition === 'below'
                        ? 'bg-blue-50 text-toss-blue border-2 border-blue-200'
                        : 'bg-toss-grey-50 text-toss-grey-600 border-2 border-transparent'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 inline mr-2" />
                    {t('notifications.modal.below')}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-toss-grey-100">
              <button
                onClick={() => setShowCreateAlert(false)}
                className="flex-1 py-3 bg-toss-grey-100 text-toss-grey-700 rounded-xl font-medium hover:bg-toss-grey-200 transition-colors"
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={createAlert}
                disabled={!newAlert.ticker || !newAlert.target_price}
                className="flex-1 py-3 bg-toss-blue text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('buttons.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
