import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Trash2,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { tasksAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const TasksPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useQuery(
    ['tasks', { searchTerm, statusFilter }],
    () => tasksAPI.list({
      search: searchTerm,
      status: statusFilter,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  const tasks = data?.data?.tasks || [];
  const pagination = data?.data?.pagination || {};

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'running':
        return <Play className="h-4 w-4 text-warning-600 animate-pulse" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-secondary-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-error-600" />;
      case 'cancelled':
        return <Pause className="h-4 w-4 text-secondary-400" />;
      default:
        return <Clock className="h-4 w-4 text-secondary-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'running':
        return 'badge-warning';
      case 'pending':
        return 'badge-secondary';
      case 'failed':
        return 'badge-error';
      case 'cancelled':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  };


  const formatDuration = (ms) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-error-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900">Error loading tasks</h3>
        <p className="mt-1 text-sm text-secondary-500">
          {error.response?.data?.error || 'Something went wrong'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Tasks</h1>
          <p className="text-secondary-600">
            Manage and monitor your AI processing tasks.
          </p>
        </div>
        <Link
          to="/ingest"
          className="btn btn-upload btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                id="search"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="btn btn-outline btn-sm"
            >
              <Filter className="h-4 w-4 mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900">No tasks found</h3>
            <p className="mt-1 text-sm text-secondary-500">
              Get started by creating your first task.
            </p>
            <div className="mt-6">
              <Link
                to="/ingest"
                className="btn btn-upload"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-96">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Agents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-secondary-900">
                          {task.name}
                        </div>
                        {task.description && (
                          <div className="text-sm text-secondary-500 truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {task.selectedAgents?.slice(0, 2).map((agent) => (
                          <span
                            key={agent}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {agent.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {task.selectedAgents?.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                            +{task.selectedAgents.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(task.status)}
                        <span className={`ml-2 badge ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-secondary-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-secondary-600">
                          {task.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {formatDuration(task.actualDuration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-secondary-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              disabled={pagination.page === 1}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={pagination.page === pagination.pages}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
