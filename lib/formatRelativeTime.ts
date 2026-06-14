export function formatTimeAgo(iso?: string, now = Date.now()): string {
  if (!iso) {
    return "never";
  }

  const seconds = Math.max(
    0,
    Math.floor((now - new Date(iso).getTime()) / 1000),
  );

  if (seconds < 60) {
    return seconds === 1 ? "1 sec ago" : `${seconds} secs ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return minutes === 1 ? "1 min ago" : `${minutes} mins ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function formatDuration(totalSeconds?: number): string {
  if (totalSeconds === undefined) {
    return "—";
  }

  if (totalSeconds < 60) {
    return totalSeconds === 1 ? "1 sec" : `${totalSeconds} secs`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    return minutes === 1 ? "1 min" : `${minutes} mins`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
