import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'v8id_device_id';

export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server-side-device-id';

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId as string;
};

export const getDeviceName = (): string => {
  if (typeof window === 'undefined') return 'Server';

  const userAgent = window.navigator.userAgent;
  let browserName = 'Unknown Browser';

  if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
  } else if (userAgent.indexOf('SamsungBrowser') > -1) {
    browserName = 'Samsung Internet';
  } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
    browserName = 'Opera';
  } else if (userAgent.indexOf('Trident') > -1) {
    browserName = 'Internet Explorer';
  } else if (userAgent.indexOf('Edge') > -1) {
    browserName = 'Edge';
  } else if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
  }

  // Detect OS
  let osName = 'Unknown OS';
  if (userAgent.indexOf('Win') !== -1) osName = 'Windows';
  if (userAgent.indexOf('Mac') !== -1) osName = 'MacOS';
  if (userAgent.indexOf('X11') !== -1) osName = 'UNIX';
  if (userAgent.indexOf('Linux') !== -1) osName = 'Linux';
  if (userAgent.indexOf('Android') !== -1) osName = 'Android';
  if (userAgent.indexOf('like Mac') !== -1) osName = 'iOS';

  return `${browserName} on ${osName}`;
};
