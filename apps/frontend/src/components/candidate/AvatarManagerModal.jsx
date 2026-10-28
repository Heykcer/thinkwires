import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserAvatar } from '../../store/slices/authSlice';

const PRESET_AVATARS = [
  { id: 1, label: 'Staff Architect', path: '/avatars/presets/tech-engineer-1.svg' },
  { id: 2, label: 'Full Stack Lead', path: '/avatars/presets/tech-engineer-2.svg' },
  { id: 3, label: 'Cloud / DevOps Expert', path: '/avatars/presets/tech-engineer-3.svg' },
  { id: 4, label: 'AI / Systems Specialist', path: '/avatars/presets/tech-engineer-4.svg' },
  { id: 5, label: 'Platform Engineer', path: '/avatars/presets/tech-engineer-5.svg' },
  { id: 6, label: 'Systems & Security Lead', path: '/avatars/presets/tech-engineer-6.svg' },
  { id: 7, label: 'Frontend Specialist', path: '/avatars/presets/tech-engineer-7.svg' },
  { id: 8, label: 'Solutions Architect', path: '/avatars/presets/tech-engineer-8.svg' },
];

const AvatarManagerModal = ({ isOpen, onClose, onAvatarChanged }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'upload'
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const currentAvatarUrl = user?.avatarUrl;
  const currentAvatarType = user?.avatarType || 'initials';

  const handleSelectPreset = async (preset) => {
    setSelectedPresetId(preset.id);
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/candidate/avatar/preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ presetIndex: preset.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        dispatch(setUserAvatar({ avatarUrl: data.avatarUrl, avatarType: 'preset' }));
        setSuccessMsg('Preset avatar applied successfully.');
        if (onAvatarChanged) onAvatarChanged(data.avatarUrl);
      } else {
        setErrorMsg(data.error || 'Failed to update preset avatar.');
      }
    } catch {
      setErrorMsg('Network error updating preset avatar.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Supported formats: JPG, PNG, WebP (up to 5MB).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 5MB limit.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/candidate/avatar/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        dispatch(setUserAvatar({ avatarUrl: data.avatarUrl, avatarType: 'upload' }));
        setSuccessMsg('Profile photo uploaded successfully.');
        if (onAvatarChanged) onAvatarChanged(data.avatarUrl);
      } else {
        setErrorMsg(data.error || 'Failed to upload photo.');
      }
    } catch {
      setErrorMsg('Network error uploading avatar.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToMonogram = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/candidate/avatar', {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        dispatch(setUserAvatar({ avatarUrl: null, avatarType: 'initials' }));
        setSuccessMsg('Reset to initials monogram.');
        if (onAvatarChanged) onAvatarChanged(null);
      } else {
        setErrorMsg(data.error || 'Failed to reset avatar.');
      }
    } catch {
      setErrorMsg('Network error resetting avatar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="tw-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="tw-modal-card"
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              className="material-symbols-outlined"
              style={{ color: '#0037B0', fontSize: '1.4rem' }}
            >
              account_circle
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                Manage Profile Avatar
              </h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                Select a verified engineer vector preset or upload your personal portrait
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem 0 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            background: '#FFFFFF',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            style={{
              padding: '0.55rem 1rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'presets' ? '2px solid #0037B0' : '2px solid transparent',
              color: activeTab === 'presets' ? '#0037B0' : '#64748B',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
              palette
            </span>
            Tech Presets (8)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '0.55rem 1rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'upload' ? '2px solid #0037B0' : '2px solid transparent',
              color: activeTab === 'upload' ? '#0037B0' : '#64748B',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
              photo_camera
            </span>
            Upload Photo
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Notifications */}
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                background: '#FEF2F2',
                border: '1px solid #FECDD3',
                borderRadius: '8px',
                color: '#991B1B',
                fontSize: '0.82rem',
                marginBottom: '1rem',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>
                warning
              </span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                color: '#166534',
                fontSize: '0.82rem',
                marginBottom: '1rem',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>
                check_circle
              </span>
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'presets' ? (
            <div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: '#475569' }}>
                Choose an official Thinkwires vector avatar representing your tech specialization:
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.85rem',
                }}
              >
                {PRESET_AVATARS.map((preset) => {
                  const isCurrent =
                    currentAvatarUrl === preset.path ||
                    (selectedPresetId === preset.id && currentAvatarType === 'preset');

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.65rem 0.45rem',
                        borderRadius: '10px',
                        border: isCurrent ? '2px solid #0037B0' : '1px solid #E2E8F0',
                        background: isCurrent ? '#EFF6FF' : '#FFFFFF',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                      title={preset.label}
                    >
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '2px solid #CBD5E1',
                          background: '#F1F5F9',
                        }}
                      >
                        <img
                          src={preset.path}
                          alt={preset.label}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: isCurrent ? '#0037B0' : '#334155',
                          textAlign: 'center',
                          lineHeight: 1.2,
                        }}
                      >
                        {preset.label}
                      </span>
                      {isCurrent && (
                        <span
                          className="material-symbols-outlined"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            fontSize: '1rem',
                            color: '#0037B0',
                          }}
                        >
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: '#475569' }}>
                Upload a professional headshot. Your photo will be visible to enterprise hiring managers on your verified applications.
              </p>

              <div
                style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '12px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  background: '#F8FAFC',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '2.5rem', color: '#64748B', marginBottom: '0.5rem' }}
                >
                  upload_file
                </span>
                <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>
                  Click or drag your photo here
                </p>
                <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.75rem', color: '#64748B' }}>
                  JPG, PNG, or WebP up to 5MB
                </p>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 1.2rem',
                    background: '#0037B0',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                    photo_camera
                  </span>
                  <span>{loading ? 'Uploading...' : 'Browse File'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={loading}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {currentAvatarUrl ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleResetToMonogram}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: 'none',
                background: 'transparent',
                color: '#64748B',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>
                delete
              </span>
              <span>Reset to Initials Monogram</span>
            </button>
          ) : (
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Using dynamic initials monogram
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarManagerModal;
