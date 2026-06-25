import React, { useState } from 'react';
import type { ServerInfo } from '../types';

interface MobileShareGuideProps {
  serverInfo: ServerInfo | null;
}

export const MobileShareGuide: React.FC<MobileShareGuideProps> = ({ serverInfo }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (serverInfo) {
      navigator.clipboard.writeText(serverInfo.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!serverInfo) {
    return (
      <div className="mobile-guide-container" style={{ gridTemplateColumns: '1fr', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading network and server sharing information...</p>
      </div>
    );
  }

  return (
    <div className="mobile-guide-container">
      <div className="guide-text-content">
        <h2>📱 Connect Your Mobile Phone</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Take the Tindahan Helper database with you! You can view stock levels, check locations, and see prices on your phone while standing at the shelves or shopping at the supermarket.
        </p>

        <div className="guide-step">
          <div className="guide-step-number">1</div>
          <div className="guide-step-detail">
            Connect your phone to the <strong>same Wi-Fi network</strong> as this computer.
          </div>
        </div>

        <div className="guide-step">
          <div className="guide-step-number">2</div>
          <div className="guide-step-detail">
            Scan the QR code on the right with your phone camera, or type this web address into your mobile web browser:
            <div className="ip-link-box">
              <span className="ip-badge">{serverInfo.url}</span>
              <button className="btn-secondary" onClick={handleCopyLink} style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
            </div>
          </div>
        </div>

        <div className="guide-step">
          <div className="guide-step-number">3</div>
          <div className="guide-step-detail">
            Bookmark the link on your phone for instant access anytime your computer server is running!
          </div>
        </div>
      </div>

      <div className="qr-code-section">
        <div className="qr-img-wrapper">
          <img src={serverInfo.qrCode} alt="Network sharing QR Code" className="qr-code-img" />
        </div>
        <div className="qr-caption">
          Scan to open this app on your phone
        </div>
      </div>
    </div>
  );
};
