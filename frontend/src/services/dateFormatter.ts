export const formatToLocalTime = (utcDateString?: string | null): string => {
  if (!utcDateString) return 'N/A';
  
  // Appends Z if missing to enforce UTC parsing before converting to local browser time (IST)
  const formattedString = utcDateString.endsWith('Z') || utcDateString.includes('+') 
    ? utcDateString 
    : `${utcDateString}Z`;

  return new Date(formattedString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};