import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  CheckSquare, 
  User, 
  BarChart3,
  Brain,
  FileText,
  TrendingUp
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload Data', href: '/ingest', icon: Upload },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Profile', href: '/profile', icon: User },
];

const agentInfo = [
  { name: 'Data Extraction', icon: FileText, color: 'text-blue-600' },
  { name: 'Financial Analysis', icon: TrendingUp, color: 'text-green-600' },
  { name: 'News Summarization', icon: FileText, color: 'text-purple-600' },
  { name: 'Analyst Support', icon: BarChart3, color: 'text-orange-600' },
  { name: 'Recommendations', icon: Brain, color: 'text-pink-600' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-sm border-r border-secondary-200">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-secondary-900">
              Re-Zero
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-secondary-700 hover:text-primary-700 hover:bg-secondary-50'
                        }`}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${
                            isActive ? 'text-primary-700' : 'text-secondary-400 group-hover:text-primary-700'
                          }`}
                        />
                        {item.name}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* Agent Info */}
            <li>
              <div className="text-xs font-semibold leading-6 text-secondary-500 uppercase tracking-wide">
                Available Agents
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {agentInfo.map((agent) => (
                  <li key={agent.name}>
                    <div className="group flex gap-x-3 rounded-md p-2 text-sm leading-6">
                      <agent.icon
                        className={`h-5 w-5 shrink-0 ${agent.color}`}
                      />
                      <span className="text-secondary-600">{agent.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </li>

            {/* Footer */}
            <li className="mt-auto">
              <div className="text-xs text-secondary-500">
                <p>Re-Zero AI Framework</p>
                <p>Version 1.0.0</p>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
