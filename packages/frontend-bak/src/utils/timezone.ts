import dayjs from 'dayjs';
import { logger } from './logger';

/**
 * Get user's preferred timezone from localStorage
 */
export const getUserTimezone = (): string => {
  return localStorage.getItem('user-timezone') || 'Asia/Shanghai';
};

/**
 * Format date according to user's timezone preferences
 */
export const formatDateWithUserSettings = (
  date: Date | string | dayjs.Dayjs,
  format: string = 'YYYY-MM-DD HH:mm'
): string => {
  let dayjsDate = dayjs(date);
  
  // Note: Full timezone support would require additional dayjs plugins
  // For now, we just use the standard format
  return dayjsDate.format(format);
};

/**
 * Get timezone display name
 */
export const getTimezoneDisplayName = (timezone: string): string => {
  const timezoneNames: Record<string, string> = {
    'Asia/Shanghai': '中国标准时间 (UTC+8)',
    'America/New_York': '美国东部时间 (UTC-5)',
    'Europe/London': '英国时间 (UTC+0)',
    'Asia/Tokyo': '日本标准时间 (UTC+9)',
    'Europe/Paris': '欧洲中部时间 (UTC+1)',
    'America/Los_Angeles': '美国太平洋时间 (UTC-8)',
  };
  
  return timezoneNames[timezone] || timezone;
};

/**
 * Initialize user settings on app startup
 */
export const initializeUserSettings = () => {
  const timezone = getUserTimezone();
  
  logger.info('User settings initialized', {
    timezone: timezone
  });
};