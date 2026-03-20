import type { ICalendarSubscriptionInfo } from '@protecht-bim/shared-types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ICalendarService {
  /**
   * Get iCalendar subscription information for a project
   */
  getProjectSubscriptionInfo(projectId: string): ICalendarSubscriptionInfo {
    const token = localStorage.getItem('token');
    const subscriptionUrl = `${API_BASE_URL}/api/v1/icalendar/projects/${projectId}?token=${token}`;
    const webcalUrl = subscriptionUrl.replace(/^https?:/, 'webcal:');

    return {
      project_id: projectId,
      subscription_url: subscriptionUrl,
      webcal_url: webcalUrl,
      description: 'Subscribe to this project\'s work packages in your calendar application',
    };
  }

  /**
   * Get iCalendar subscription information for the current user
   */
  getUserSubscriptionInfo(): ICalendarSubscriptionInfo {
    const token = localStorage.getItem('token');
    const subscriptionUrl = `${API_BASE_URL}/api/v1/icalendar/users/me?token=${token}`;
    const webcalUrl = subscriptionUrl.replace(/^https?:/, 'webcal:');

    return {
      subscription_url: subscriptionUrl,
      webcal_url: webcalUrl,
      description: 'Subscribe to your assigned work packages in your calendar application',
    };
  }

  /**
   * Download iCalendar file for a project
   */
  async downloadProjectCalendar(projectId: string): Promise<void> {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/api/v1/icalendar/projects/${projectId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download calendar');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `project-${projectId}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Download iCalendar file for the current user
   */
  async downloadUserCalendar(): Promise<void> {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/api/v1/icalendar/users/me`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download calendar');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'my-work-packages.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Copy subscription URL to clipboard
   */
  async copySubscriptionUrl(url: string): Promise<void> {
    await navigator.clipboard.writeText(url);
  }
}

export const icalendarService = new ICalendarService();
