import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Play,
  Pause,
  Trash2,
  Download,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { tasksAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import StructuredDataDisplay from '../components/StructuredDataDisplay';

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedResults, setExpandedResults] = useState(new Set());

  // Helper function to clean up content and convert [object Object] to readable text
  const cleanContent = (content) => {
    if (typeof content !== 'string') {
      return content;
    }
    
    // Replace [object Object] with a more informative message
    return content.replace(/\[object Object\]/g, '[Complex Object - See Structured Data below]');
  };

  const { data, isLoading, error, refetch } = useQuery(
    ['task', id],
    () => tasksAPI.getById(id),
    { refetchInterval: 5000 } // Refetch every 5 seconds for real-time updates
  );

  const task = data?.data?.task;
  const agentJobs = data?.data?.agentJobs || [];
  const agentResults = data?.data?.agentResults || [];

  const toggleResultExpansion = (resultId) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'running':
        return <Play className="h-5 w-5 text-warning-600 animate-pulse" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-secondary-400" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-error-600" />;
      case 'cancelled':
        return <Pause className="h-5 w-5 text-secondary-400" />;
      default:
        return <Clock className="h-5 w-5 text-secondary-400" />;
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
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-error-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900">Task not found</h3>
        <p className="mt-1 text-sm text-secondary-500">
          The task you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/tasks')}
            className="btn btn-primary"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/tasks')}
            className="p-2 text-secondary-400 hover:text-secondary-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{task.name}</h1>
            {task.description && (
              <p className="text-secondary-600">{task.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            className="btn btn-outline btn-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="btn btn-outline btn-sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Task Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Task Status */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">Task Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Status</span>
              <div className="flex items-center">
                {getStatusIcon(task.status)}
                <span className={`ml-2 badge ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Progress</span>
              <span className="text-sm font-medium">{task.progress || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Priority</span>
              <span className="text-sm font-medium capitalize">{task.priority}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Duration</span>
              <span className="text-sm font-medium">
                {formatDuration(task.actualDuration)}
              </span>
            </div>
          </div>
        </div>

        {/* Agent Jobs */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">Agent Jobs</h3>
          <div className="space-y-3">
            {agentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <p className="text-sm font-medium text-secondary-900">
                      {job.agentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {formatDuration(job.actualDuration)}
                    </p>
                  </div>
                </div>
                <span className={`badge ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Info */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">Task Information</h3>
          <div className="space-y-4">
            <div>
              <span className="text-sm text-secondary-600">Created</span>
              <p className="text-sm font-medium">{formatDate(task.createdAt)}</p>
            </div>
            {task.startedAt && (
              <div>
                <span className="text-sm text-secondary-600">Started</span>
                <p className="text-sm font-medium">{formatDate(task.startedAt)}</p>
              </div>
            )}
            {task.completedAt && (
              <div>
                <span className="text-sm text-secondary-600">Completed</span>
                <p className="text-sm font-medium">{formatDate(task.completedAt)}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-secondary-600">Agents</span>
              <p className="text-sm font-medium">{task.selectedAgents?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Results */}
      {agentResults.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">Agent Results</h3>
          <div className="space-y-4">
            {agentResults.map((result) => (
              <div key={result.id} className="border border-secondary-200 rounded-lg">
                <div className="p-4 border-b border-secondary-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-secondary-900">
                        {result.title}
                      </h4>
                      <span className="badge badge-primary">
                        {result.agentType.replace(/_/g, ' ')}
                      </span>
                      <span className="badge badge-secondary">
                        {result.resultType}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-secondary-500">
                        Confidence: {Math.round((result.confidence || 0) * 100)}%
                      </span>
                      <button
                        onClick={() => toggleResultExpansion(result.id)}
                        className="text-secondary-400 hover:text-secondary-600"
                      >
                        {expandedResults.has(result.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {expandedResults.has(result.id) && (
                  <div className="p-4">
                    {/* Content Display */}
                    {typeof result.content === 'string' ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={tomorrow}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {cleanContent(result.content)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <StructuredDataDisplay 
                        data={result.content} 
                        title="Content"
                      />
                    )}
                    
                    {/* Additional Structured Data */}
                    {result.structuredData && Object.keys(result.structuredData).length > 0 && (
                      <StructuredDataDisplay 
                        data={result.structuredData} 
                        title="Structured Data"
                      />
                    )}
                    
                    {result.tags && result.tags.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-secondary-900 mb-2">
                          Tags
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {result.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {task.error && (
        <div className="card p-6 border-error-200 bg-error-50">
          <h3 className="text-lg font-medium text-error-900 mb-2">Error Details</h3>
          <div className="text-sm text-error-700">
            <p className="font-medium">{task.error.message}</p>
            {task.error.stack && (
              <pre className="mt-2 text-xs bg-error-100 p-3 rounded overflow-x-auto">
                {task.error.stack}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailPage;
