/**
 * iCalendar API Types
 * Types for iCalendar feed generation and subscription
 */

/**
 * Response for iCalendar feed endpoints
 * Returns ICS file content as text/calendar
 */
export interface ICalendarFeedResponse {
  // The response is the raw ICS file content (text/calendar)
  // No JSON wrapper - direct ICS content
}

/**
 * iCalendar subscription URL information
 */
export interface ICalendarSubscriptionInfo {
  project_id?: string;
  user_id?: string;
  subscription_url: string;
  webcal_url: string;
  description: string;
}
