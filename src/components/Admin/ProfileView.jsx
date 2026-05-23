import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Key, Camera, AlertCircle } from 'lucide-react';
import { updateProfileRequest, updatePasswordRequest } from '../../store/slices/auth.slice.js';
import { isImageSrc } from '../../utils/image.util.js';

export default function ProfileView() {
  const user = useSelector(state => state.auth.user);
  const loading = useSelector(state => state.auth.loading);
  const error = useSelector(state => state.auth.error);

  const dispatch = useDispatch();

  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileBio(user.bio || '');
      setProfileAvatar(user.avatar || '');
    }
  }, [user]);

  if (!user) return null;

  const getInitials = (name = "Unassigned") => {
    if (name === "Unassigned") return "?";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    dispatch(updateProfileRequest({
      name: profileName,
      bio: profileBio,
      avatar: profileAvatar
    }));
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setPwError('');
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }

    dispatch(updatePasswordRequest({
      currentPassword,
      newPassword,
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image file size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="view-header" style={{ marginBottom: 0 }}>
        <h1 className="view-title">My Profile</h1>
        <p className="view-subtitle">Manage your personal information, description, profile photo, and password.</p>
      </div>

      <div className="profile-grid">
        {/* Left Card: Photo and Meta */}
        <div className="profile-card profile-photo-card">
          <h3 className="profile-card-title">Profile Photo</h3>
          <div className="profile-avatar-container">
            <div className="profile-avatar-large">
              {isImageSrc(profileAvatar) ? (
                <img src={profileAvatar} alt="Profile Avatar" className="profile-img-large" />
              ) : (
                getInitials(user.name)
              )}
              <label className="avatar-upload-overlay" htmlFor="avatar-file-input">
                <Camera size={24} />
                <span>Upload Photo</span>
              </label>
            </div>
            <input 
              type="file" 
              id="avatar-file-input" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              style={{ display: 'none' }} 
            />
          </div>
          <p className="profile-photo-hint">Supported formats: JPG, PNG. Max size 2MB.</p>
          {isImageSrc(profileAvatar) && (
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              onClick={() => setProfileAvatar('')}
              style={{ marginTop: '12px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            >
              Remove Photo
            </button>
          )}
        </div>

        {/* Right Card: Personal Info & Bio */}
        <div className="profile-card profile-details-card">
          <h3 className="profile-card-title">Account Details</h3>
          <form onSubmit={handleUpdateProfile}>
            {error && <div className="profile-alert alert-danger"><AlertCircle size={16} />{error}</div>}
            
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={profileName} 
                onChange={e => setProfileName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={user.email} 
                  disabled 
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={user.role} 
                  disabled 
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Team</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={user.team} 
                  disabled 
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Short Description / Bio</label>
              <textarea 
                className="form-control" 
                rows="4" 
                placeholder="Tell your team about yourself..." 
                value={profileBio} 
                onChange={e => setProfileBio(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>

      {/* Password Change Card */}
      <div className="profile-card password-change-card" style={{ marginTop: '24px' }}>
        <h3 className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={18} /> Change Password
        </h3>
        <form onSubmit={handleUpdatePassword} style={{ maxWidth: '600px' }}>
          {pwError && <div className="profile-alert alert-danger"><AlertCircle size={16} />{pwError}</div>}

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={currentPassword} 
              onChange={e => setCurrentPassword(e.target.value)} 
              placeholder="Enter current password" 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Enter new password" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="Confirm new password" 
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
