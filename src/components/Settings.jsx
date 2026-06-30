import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  User,
  Mail,
  Lock,
  Trash2,
  LogOut,
  Upload,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Settings as SettingsIcon
} from 'lucide-react'
import Toast from './Toast'

function Settings({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [showEmailChange, setShowEmailChange] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Form states
  const [displayName, setDisplayName] = useState(user.user_metadata?.display_name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const fileInputRef = useRef(null)

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('File size must be less than 5MB', 'error')
        return
      }

      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error')
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setAvatarPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async () => {
    if (!avatarFile) return

    setLoading(true)
    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) throw updateError

      showToast('Avatar updated successfully!')
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      showToast('Error uploading avatar. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateDisplayName = async () => {
    if (!displayName.trim()) {
      showToast('Display name cannot be empty', 'error')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() }
      })

      if (error) throw error

      showToast('Display name updated successfully!')
    } catch (error) {
      console.error('Error updating display name:', error)
      showToast('Error updating display name. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      showToast('Password updated successfully!')
      setShowPasswordChange(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error changing password:', error)
      showToast('Error changing password. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const changeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim()
      })

      if (error) throw error

      showToast('Email update initiated. Please check your email to confirm the change.')
      setShowEmailChange(false)
      setNewEmail('')
    } catch (error) {
      console.error('Error changing email:', error)
      showToast('Error changing email. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    setLoading(true)
    try {
      // Delete all user data first
      const { error: deleteInternshipsError } = await supabase
        .from('internships')
        .delete()
        .eq('user_id', user.id)

      if (deleteInternshipsError) {
        console.error('Error deleting internships:', deleteInternshipsError)
      }

      const { error: deleteTagsError } = await supabase
        .from('tags')
        .delete()
        .eq('user_id', user.id)

      if (deleteTagsError) {
        console.error('Error deleting tags:', deleteTagsError)
      }

      // Delete the user account
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) throw error

      showToast('Account deleted successfully')
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting account:', error)
      showToast('Error deleting account. Please try again.', 'error')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const deleteAllInternships = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('internships')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting internships:', error)
        showToast('Error deleting internships. Please try again.', 'error')
        return
      }

      showToast('All internships deleted successfully')
      setShowDeleteAllConfirm(false)
      // Refresh the page to update the dashboard
      window.location.reload()
    } catch (error) {
      console.error('Error deleting internships:', error)
      showToast('Error deleting internships. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetAccount = async () => {
    setLoading(true)
    try {
      // Delete all internships
      const { error: deleteInternshipsError } = await supabase
        .from('internships')
        .delete()
        .eq('user_id', user.id)

      if (deleteInternshipsError) {
        console.error('Error deleting internships:', deleteInternshipsError)
      }

      // Delete all tags
      const { error: deleteTagsError } = await supabase
        .from('tags')
        .delete()
        .eq('user_id', user.id)

      if (deleteTagsError) {
        console.error('Error deleting tags:', deleteTagsError)
      }

      // Reinitialize predefined tags
      const predefinedTags = [
        { name: 'Dream Company', color: '#ef4444' },
        { name: 'Priority', color: '#f59e0b' },
        { name: 'Tech', color: '#3b82f6' },
        { name: 'Finance', color: '#10b981' },
        { name: 'Remote', color: '#8b5cf6' },
        { name: 'Startup', color: '#ec4899' }
      ]

      const tagsToInsert = predefinedTags.map(tag => ({
        name: tag.name,
        color: tag.color,
        user_id: user.id
      }))

      const { error: insertTagsError } = await supabase
        .from('tags')
        .insert(tagsToInsert)

      if (insertTagsError) {
        console.error('Error inserting predefined tags:', insertTagsError)
      }

      showToast('Account reset successfully')
      setShowResetConfirm(false)
      // Refresh the page to update the dashboard
      window.location.reload()
    } catch (error) {
      console.error('Error resetting account:', error)
      showToast('Error resetting account. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      console.log('Attempting to sign out from settings...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        showToast('Error signing out. Please try again.', 'error')
      } else {
        console.log('Successfully signed out from settings')
        // Force a page reload to ensure clean state
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
      showToast('Unexpected error during sign out. Please try again.', 'error')
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Content */}
            <div className="flex-1">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Profile Information
                    </h3>

                    <div className="space-y-4">
                      {/* Avatar Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Profile Picture
                        </label>
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center">
                              {avatarPreview ? (
                                <img
                                  src={avatarPreview}
                                  alt="Avatar preview"
                                  className="w-20 h-20 rounded-full object-cover"
                                />
                              ) : user.user_metadata?.avatar_url ? (
                                <img
                                  src={user.user_metadata.avatar_url}
                                  alt="Avatar"
                                  className="w-20 h-20 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-8 w-8 text-white" />
                              )}
                            </div>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute -bottom-1 -right-1 p-1 bg-primary-600 rounded-full text-white hover:bg-primary-700 transition-colors"
                            >
                              <Upload className="h-3 w-3" />
                            </button>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                          {avatarFile && (
                            <button
                              onClick={uploadAvatar}
                              disabled={loading}
                              className="btn-primary"
                            >
                              {loading ? 'Uploading...' : 'Upload Avatar'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Display Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Display Name
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your display name"
                            className="input-field flex-1"
                          />
                          <button
                            onClick={updateDisplayName}
                            disabled={loading}
                            className="btn-primary"
                          >
                            {loading ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>

                      {/* Email (Read-only) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 flex items-center space-x-2 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{user.email}</span>
                          </div>
                          <button
                            onClick={() => setShowEmailChange(true)}
                            className="btn-secondary"
                          >
                            Change Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Security Settings
                    </h3>

                    <div className="space-y-4">
                      {/* Change Password */}
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Password</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Update your password to keep your account secure
                            </p>
                          </div>
                          <button
                            onClick={() => setShowPasswordChange(!showPasswordChange)}
                            className="btn-secondary"
                          >
                            Change Password
                          </button>
                        </div>

                        {showPasswordChange && (
                          <div className="mt-4 space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showNewPassword ? 'text' : 'password'}
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Enter new password"
                                  className="input-field pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                                >
                                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirm New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="Confirm new password"
                                  className="input-field pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={changePassword}
                                disabled={loading}
                                className="btn-primary"
                              >
                                {loading ? 'Updating...' : 'Update Password'}
                              </button>
                              <button
                                onClick={() => setShowPasswordChange(false)}
                                className="btn-secondary"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Change Email */}
                      {showEmailChange && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Change Email</h4>
                          <div className="space-y-3">
                            <input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="Enter new email address"
                              className="input-field"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={changeEmail}
                                disabled={loading}
                                className="btn-primary"
                              >
                                {loading ? 'Updating...' : 'Update Email'}
                              </button>
                              <button
                                onClick={() => setShowEmailChange(false)}
                                className="btn-secondary"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'danger' && (
                <div className="space-y-6">
                  <div className="card p-6 border-red-200 dark:border-red-800">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">
                      Danger Zone
                    </h3>

                    <div className="space-y-4">
                      {/* Sign Out */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Sign Out</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Sign out of your account
                          </p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="btn-secondary"
                        >
                          Sign Out
                        </button>
                      </div>

                      {/* Delete All Internships */}
                      <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div>
                          <h4 className="font-medium text-orange-900 dark:text-orange-100">Delete All Internships</h4>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            Permanently delete all your internship data
                          </p>
                        </div>
                        <button
                          onClick={() => setShowDeleteAllConfirm(true)}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          Delete All
                        </button>
                      </div>

                      {/* Reset Account */}
                      <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div>
                          <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Reset Account</h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Clear all data and start fresh with default tags
                          </p>
                        </div>
                        <button
                          onClick={() => setShowResetConfirm(true)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          Reset Account
                        </button>
                      </div>

                      {/* Delete Account */}
                      <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div>
                          <h4 className="font-medium text-red-900 dark:text-red-100">Delete Account</h4>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            Permanently delete your account and all data
                          </p>
                        </div>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Delete Account
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={deleteAccount}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete All Internships Confirmation Modal */}
        {showDeleteAllConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteAllConfirm(false)}>
            <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Delete All Internships
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete all your internships? This action cannot be undone and will permanently delete all your internship data.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={deleteAllInternships}
                    disabled={loading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete All Internships'}
                  </button>
                  <button
                    onClick={() => setShowDeleteAllConfirm(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Account Confirmation Modal */}
        {showResetConfirm && (
          <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
            <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Reset Account
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to reset your account? This will delete all internships and tags, then reinitialize with default tags. This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={resetAccount}
                    disabled={loading}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Resetting...' : 'Reset Account'}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {toast.show && (
          <Toast
            message={toast.message}
            isVisible={toast.show}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        )}
      </div>
    </div>
  )
}

export default Settings
