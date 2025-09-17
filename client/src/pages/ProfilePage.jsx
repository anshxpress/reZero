import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  Save, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data) => {
    const result = await updateProfile(data);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Profile</h1>
        <p className="text-secondary-600">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-secondary-900">
                Profile Information
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-outline btn-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="name" className="label">
                    Full Name
                  </label>
                  <input
                    {...register('name', {
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters',
                      },
                    })}
                    type="text"
                    className={`input ${errors.name ? 'border-error-300 focus:ring-error-500' : ''}`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="label">
                    Email Address
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    className={`input ${errors.email ? 'border-error-300 focus:ring-error-500' : ''}`}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-secondary-900">
                      {user?.name}
                    </h4>
                    <p className="text-secondary-600">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-secondary-500">
                      Full Name
                    </label>
                    <p className="text-sm text-secondary-900">{user?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary-500">
                      Email Address
                    </label>
                    <p className="text-sm text-secondary-900">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary-500">
                      Role
                    </label>
                    <p className="text-sm text-secondary-900 capitalize">
                      {user?.role || 'User'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary-500">
                      Status
                    </label>
                    <div className="flex items-center">
                      {user?.isActive ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-success-600 mr-1" />
                          <span className="text-sm text-success-600">Active</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-error-600 mr-1" />
                          <span className="text-sm text-error-600">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Details */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">
              Account Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-secondary-500">
                  Member Since
                </label>
                <p className="text-sm text-secondary-900">
                  {formatDate(user?.createdAt)}
                </p>
              </div>
              {user?.lastLogin && (
                <div>
                  <label className="text-sm font-medium text-secondary-500">
                    Last Login
                  </label>
                  <p className="text-sm text-secondary-900">
                    {formatDate(user?.lastLogin)}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-secondary-500">
                  User ID
                </label>
                <p className="text-sm text-secondary-900 font-mono">
                  {user?.id?.slice(-8)}
                </p>
              </div>
            </div>
          </div>

          {/* Preferences */}
          {user?.preferences && (
            <div className="card p-6 mt-6">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                Preferences
              </h3>
              <div className="space-y-4">
                {user.preferences.defaultAgents && user.preferences.defaultAgents.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-secondary-500">
                      Default Agents
                    </label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {user.preferences.defaultAgents.map((agent, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {agent.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {user.preferences.notificationSettings && (
                  <div>
                    <label className="text-sm font-medium text-secondary-500">
                      Notifications
                    </label>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-900">Email</span>
                        <span className={`text-xs ${user.preferences.notificationSettings.email ? 'text-success-600' : 'text-secondary-500'}`}>
                          {user.preferences.notificationSettings.email ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-900">Task Updates</span>
                        <span className={`text-xs ${user.preferences.notificationSettings.taskUpdates ? 'text-success-600' : 'text-secondary-500'}`}>
                          {user.preferences.notificationSettings.taskUpdates ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
