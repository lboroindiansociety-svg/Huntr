import { useState, useEffect } from 'react'
import { Plus, X, Settings, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

function StatusPipeline({ user, onStatusChange, onDatabaseSetupNeeded }) {
  const [customStatuses, setCustomStatuses] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStatus, setNewStatus] = useState({ name: '', color: '#3b82f6', order: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const defaultStatuses = [
    { name: 'applied', color: '#3b82f6', order: 1 },
    { name: 'interviewing', color: '#f59e0b', order: 2 },
    { name: 'offer', color: '#10b981', order: 3 },
    { name: 'rejected', color: '#ef4444', order: 4 }
  ]

  useEffect(() => {
    fetchCustomStatuses()
  }, [user])

  const fetchCustomStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_statuses')
        .select('*')
        .eq('user_id', user.id)
        .order('order', { ascending: true })

      if (error) {
        console.error('Error fetching custom statuses:', error)
        // If table doesn't exist, notify parent component
        if (error.code === '42P01') {
          console.log('Custom statuses table does not exist yet')
          setCustomStatuses([])
          if (onDatabaseSetupNeeded) {
            onDatabaseSetupNeeded()
          }
          return
        }
        throw error
      }
      setCustomStatuses(data || [])
    } catch (error) {
      console.error('Error fetching custom statuses:', error)
      setCustomStatuses([])
    }
  }

  const addCustomStatus = async () => {
    if (!newStatus.name.trim()) {
      setError('Stage name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('custom_statuses')
        .insert([{ 
          ...newStatus, 
          user_id: user.id,
          name: newStatus.name.trim()
        }])
        .select()

      if (error) {
        console.error('Error adding custom status:', error)
        if (error.code === '42P01') {
          setError('Database table not set up. Please run the SQL setup in your Supabase dashboard.')
          if (onDatabaseSetupNeeded) {
            onDatabaseSetupNeeded()
          }
        } else {
          setError('Failed to add stage. Please try again.')
        }
        return
      }

      await fetchCustomStatuses()
      setShowAddModal(false)
      setNewStatus({ name: '', color: '#3b82f6', order: 0 })
    } catch (error) {
      console.error('Error adding custom status:', error)
      setError('Failed to add stage. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deleteCustomStatus = async (id) => {
    try {
      const { error } = await supabase
        .from('custom_statuses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchCustomStatuses()
    } catch (error) {
      console.error('Error deleting custom status:', error)
    }
  }

  const allStatuses = [...defaultStatuses, ...customStatuses].sort((a, b) => a.order - b.order)

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Application Pipeline
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize your application stages to track progress more effectively
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Stage</span>
        </button>
      </div>

      <div className="space-y-4">
        {allStatuses.map((status, index) => (
          <div key={status.name} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: status.color }}
              ></div>
              <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                {status.name}
              </span>
              {index < allStatuses.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
              )}
            </div>
            {customStatuses.find(s => s.name === status.name) && (
              <button
                onClick={() => deleteCustomStatus(customStatuses.find(s => s.name === status.name).id)}
                className="ml-auto p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Custom Status Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Add Custom Stage
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setError('')
                    setNewStatus({ name: '', color: '#3b82f6', order: 0 })
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stage Name
                  </label>
                  <input
                    type="text"
                    value={newStatus.name}
                    onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Coding Test, HR Call"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newStatus.color}
                    onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    value={newStatus.order}
                    onChange={(e) => setNewStatus({ ...newStatus, order: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setError('')
                    setNewStatus({ name: '', color: '#3b82f6', order: 0 })
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomStatus}
                  disabled={loading || !newStatus.name.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Add Stage'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatusPipeline 