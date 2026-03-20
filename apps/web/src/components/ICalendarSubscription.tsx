import React, { useState } from 'react';
import type { ICalendarSubscriptionInfo } from '@protecht-bim/shared-types';
import { icalendarService } from '../services/icalendarService';

interface ICalendarSubscriptionProps {
  projectId?: string;
  onClose?: () => void;
}

const ICalendarSubscription: React.FC<ICalendarSubscriptionProps> = ({
  projectId,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const subscriptionInfo: ICalendarSubscriptionInfo = projectId
    ? icalendarService.getProjectSubscriptionInfo(projectId)
    : icalendarService.getUserSubscriptionInfo();

  const handleCopyUrl = async () => {
    try {
      await icalendarService.copySubscriptionUrl(subscriptionInfo.subscription_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      if (projectId) {
        await icalendarService.downloadProjectCalendar(projectId);
      } else {
        await icalendarService.downloadUserCalendar();
      }
    } catch (error) {
      console.error('Failed to download calendar:', error);
      alert('Failed to download calendar. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSubscribe = () => {
    // Open webcal URL which will prompt the user's default calendar app
    window.location.href = subscriptionInfo.webcal_url;
  };

  return (
    <div className="card max-w-2xl elevation-5 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <div className="w-1 h-8 bg-gradient-to-b from-primary-400 to-primary-600 rounded-full mr-3"></div>
          Calendar Subscription
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-hint hover:text-white p-2 -mr-2 rounded-lg hover:bg-surface-light transition-all duration-200"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <p className="text-secondary mb-6">{subscriptionInfo.description}</p>

      <div className="space-y-4">
        {/* Subscribe button */}
        <div>
          <button
            onClick={handleSubscribe}
            className="btn-primary w-full"
          >
            <svg className="h-5 w-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Subscribe in Calendar App
          </button>
          <p className="text-sm text-hint mt-2">
            Opens your default calendar application (Apple Calendar, Outlook, etc.)
          </p>
        </div>

        {/* Download button */}
        <div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-secondary w-full"
          >
            {downloading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </span>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download ICS File
              </>
            )}
          </button>
          <p className="text-sm text-hint mt-2">
            Download a one-time snapshot of the calendar
          </p>
        </div>

        {/* Subscription URL */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Subscription URL
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={subscriptionInfo.subscription_url}
              readOnly
              className="input-material flex-1 font-mono text-sm"
            />
            <button
              onClick={handleCopyUrl}
              className="btn-secondary whitespace-nowrap"
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : 'Copy'}
            </button>
          </div>
          <p className="text-sm text-hint mt-2">
            Use this URL to manually add the calendar subscription in your calendar app
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-primary-400 mb-2">
            How to subscribe:
          </h3>
          <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
            <li>
              <strong className="text-white">Apple Calendar:</strong> Click "Subscribe in Calendar App" or go to
              File → New Calendar Subscription
            </li>
            <li>
              <strong className="text-white">Google Calendar:</strong> Copy the URL, then go to Settings → Add
              calendar → From URL
            </li>
            <li>
              <strong className="text-white">Outlook:</strong> Copy the URL, then go to Calendar → Add calendar →
              Subscribe from web
            </li>
          </ul>
        </div>

        {/* Note about updates */}
        <div className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-4">
          <p className="text-sm text-warning-400">
            <strong>Note:</strong> Subscribed calendars automatically update when work
            packages change. The download option provides a one-time snapshot that won't
            update automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ICalendarSubscription;
