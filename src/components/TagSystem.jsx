import { useState, useEffect } from 'react'
import { Plus, X, Tag, Hash } from 'lucide-react'
import { supabase } from '../lib/supabase'

function TagSystem({ user, selectedTags, onTagChange, onDatabaseSetupNeeded }) {
  const [tags, setTags] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTag, setNewTag] = useState({ name: '', color: '#6b7280' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTags()
  }, [user])

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tags:', error)
        // If table doesn't exist, notify parent component
        if (error.code === '42P01') {
          console.log('Tags table does not exist yet')
          setTags([])
          if (onDatabaseSetupNeeded) {
            onDatabaseSetupNeeded()
          }
          return
        }
        throw error
      }
      setTags(data || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
      setTags([])
    }
  }

  const addTag = async () => {
    if (!newTag.name.trim()) {
      setError('Tag name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([{ 
          ...newTag, 
          user_id: user.id,
          name: newTag.name.trim()
        }])
        .select()

      if (error) {
        console.error('Error adding tag:', error)
        if (error.code === '42P01') {
          setError('Database table not set up. Please run the SQL setup in your Supabase dashboard.')
          if (onDatabaseSetupNeeded) {
            onDatabaseSetupNeeded()
          }
        } else {
          setError('Failed to add tag. Please try again.')
        }
        return
      }

      await fetchTags()
      setShowAddModal(false)
      setNewTag({ name: '', color: '#6b7280' })
    } catch (error) {
      console.error('Error adding tag:', error)
      setError('Failed to add tag. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deleteTag = async (id) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchTags()
    } catch (error) {
      console.error('Error deleting tag:', error)
    }
  }

  const toggleTag = (tagName) => {
    if (selectedTags.includes(tagName)) {
      onTagChange(selectedTags.filter(tag => tag !== tagName))
    } else {
      onTagChange([...selectedTags, tagName])
    }
  }

  const predefinedTags = [
    { name: 'Dream Company', color: '#ef4444' },
    { name: 'Priority', color: '#f59e0b' },
    { name: 'Tech', color: '#3b82f6' },
    { name: 'Finance', color: '#10b981' },
    { name: 'Remote', color: '#8b5cf6' },
    { name: 'Startup', color: '#ec4899' }
  ]

  const allTags = [...predefinedTags, ...tags]

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tags & Filters
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Tag</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {allTags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => toggleTag(tag.name)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedTags.includes(tag.name)
                  ? 'text-white shadow-md'
                  : 'hover:shadow-sm'
              }`}
              style={{ 
                backgroundColor: selectedTags.includes(tag.name) ? tag.color : `${tag.color}20`,
                color: selectedTags.includes(tag.name) ? 'white' : tag.color,
                border: `1px solid ${tag.color}40`
              }}
            >
              <Hash className="h-3 w-3" />
              <span className="font-medium">{tag.name}</span>
              {selectedTags.includes(tag.name) && (
                <X className="h-3 w-3" />
              )}
            </button>
          ))}
        </div>

        {selectedTags.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 justify-center sm:justify-start">
            <Tag className="h-4 w-4" />
            <span>Filtering by: {selectedTags.join(', ')}</span>
            <button
              onClick={() => onTagChange([])}
              className="text-primary-600 hover:text-primary-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Add Tag Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Add Custom Tag
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setError('')
                    setNewTag({ name: '', color: '#6b7280' })
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
                    Tag Name
                  </label>
                  <input
                    type="text"
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Dream Company, Priority"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setError('')
                    setNewTag({ name: '', color: '#6b7280' })
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={addTag}
                  disabled={loading || !newTag.name.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Add Tag'
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

export default TagSystem 