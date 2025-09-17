import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  CheckSquare, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Brain,
  FileText,
  DollarSign,
  Newspaper,
  Users,
  Lightbulb
} from 'lucide-react';
import { tasksAPI, ingestAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage = () => {
  // Fetch recent tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery(
    'recentTasks',
    () => tasksAPI.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  // Fetch recent ingests
  const { data: ingestsData, isLoading: ingestsLoading } = useQuery(
    'recentIngests',
    () => ingestAPI.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    { refetchInterval: 30000 }
  );

  const tasks = tasksData?.data?.tasks || [];
  const ingests = ingestsData?.data?.ingests || [];

  // Calculate stats
  const stats = {
    totalTasks: tasksData?.data?.pagination?.total || 0,
    completedTasks: tasks.filter(task => task.status === 'completed').length,
    runningTasks: tasks.filter(task => task.status === 'running').length,
    totalIngests: ingestsData?.data?.pagination?.total || 0,
  };

  const agentCards = [
    {
      name: 'Data Extraction',
      description: 'Extract structured data from various sources',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/ingest',
    },
    {
      name: 'Financial Analysis',
      description: 'Analyze financial data and generate insights',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/ingest',
    },
    {
      name: 'News Summarization',
      description: 'Summarize and analyze news content',
      icon: Newspaper,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/ingest',
    },
    {
      name: 'Analyst Support',
      description: 'Provide comparative analysis and recommendations',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/ingest',
    },
    {
      name: 'Recommendations',
      description: 'Generate personalized recommendations',
      icon: Lightbulb,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      href: '/ingest',
    },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'running':
        return <Clock className="h-4 w-4 text-warning-600 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-error-600" />;
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
      case 'failed':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  };

  if (tasksLoading || ingestsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600">
          Welcome to Re-Zero AI Framework. Manage your data processing and analysis tasks.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckSquare className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">
                  Total Tasks
                </dt>
                <dd className="text-lg font-medium text-secondary-900">
                  {stats.totalTasks}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">
                  Completed
                </dt>
                <dd className="text-lg font-medium text-secondary-900">
                  {stats.completedTasks}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">
                  Running
                </dt>
                <dd className="text-lg font-medium text-secondary-900">
                  {stats.runningTasks}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Upload className="h-8 w-8 text-secondary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">
                  Data Sources
                </dt>
                <dd className="text-lg font-medium text-secondary-900">
                  {stats.totalIngests}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Available Agents */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-secondary-900">Available Agents</h3>
            <Link
              to="/ingest"
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {agentCards.map((agent) => (
              <Link
                key={agent.name}
                to={agent.href}
                className="flex items-center p-3 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className={`flex-shrink-0 p-2 rounded-lg ${agent.bgColor}`}>
                  <agent.icon className={`h-5 w-5 ${agent.color}`} />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-secondary-900">
                    {agent.name}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {agent.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-secondary-900">Recent Tasks</h3>
            <Link
              to="/tasks"
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-secondary-500 text-center py-4">
                No tasks yet. Create your first task to get started.
              </p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-secondary-200">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <p className="text-sm font-medium text-secondary-900">
                        {task.name}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {task.selectedAgents?.join(', ')}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Data Sources */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-secondary-900">Recent Data Sources</h3>
          <Link
            to="/ingest"
            className="text-sm text-primary-600 hover:text-primary-500 font-medium"
          >
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {ingests.length === 0 ? (
            <p className="text-sm text-secondary-500 text-center py-4">
              No data sources yet. Upload your first file to get started.
            </p>
          ) : (
            ingests.map((ingest) => (
              <div key={ingest.id} className="flex items-center justify-between p-3 rounded-lg border border-secondary-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <FileText className="h-5 w-5 text-secondary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-900">
                      {ingest.metadata?.filename || `Data Source ${ingest.id.slice(-8)}`}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {ingest.type} • {new Date(ingest.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`badge ${getStatusColor(ingest.status)}`}>
                  {ingest.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Start */}
      <div className="card p-6 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <Brain className="h-8 w-8 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-primary-900">
              Ready to get started?
            </h3>
            <p className="text-primary-700">
              Upload your data and let our AI agents process it for you.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              to="/ingest"
              className="btn btn-upload btn-lg"
            >
              Upload Data
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
