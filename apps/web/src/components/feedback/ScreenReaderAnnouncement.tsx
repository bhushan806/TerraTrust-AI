import React from 'react';

interface ScreenReaderAnnouncementProps {
  message: string;
  assertive?: boolean;
}

export const ScreenReaderAnnouncement: React.FC<ScreenReaderAnnouncementProps> = ({
  message,
  assertive = false,
}) => {
  return (
    <div
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};
