export const getTrackingUrl = (orderId: string) => {
  if (typeof window === 'undefined') {
    return `/track/${orderId}`;
  }

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return `${window.location.origin}${basePath}/track/${orderId}`;
};
