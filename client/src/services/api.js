const demoNow = '2026-06-10T10:00:00.000Z';
const demoToken = 'demo-rezero-token';

const demoUserTemplate = {
  _id: 'user-demo-1',
  userId: 'demo-user-1',
  name: 'Demo Admin',
  email: 'demo@rezero.local',
  role: 'admin',
  isActive: true,
  createdAt: '2026-01-10T09:00:00.000Z',
  lastLogin: demoNow,
  preferences: {
    theme: 'light',
    notifications: true,
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const createTaskDetail = ({
  id,
  name,
  description,
  status,
  progress,
  priority,
  actualDuration,
  createdAt,
  startedAt,
  completedAt,
  selectedAgents,
  agentJobs,
  agentResults,
  error,
}) => ({
  task: {
    id,
    name,
    description,
    status,
    progress,
    priority,
    actualDuration,
    createdAt,
    startedAt,
    completedAt,
    selectedAgents,
    error,
  },
  agentJobs,
  agentResults,
});

const demoState = {
  user: clone(demoUserTemplate),
  tasks: [
    {
      id: 'task-1001',
      name: 'Market intelligence brief',
      description: 'Demo task for dashboard visibility and review flows.',
      status: 'completed',
      progress: 100,
      priority: 'high',
      actualDuration: 1830000,
      createdAt: '2026-06-09T09:15:00.000Z',
      startedAt: '2026-06-09T09:16:00.000Z',
      completedAt: '2026-06-09T09:46:30.000Z',
      selectedAgents: ['data_extraction', 'financial_analysis', 'news_summarization'],
    },
    {
      id: 'task-1002',
      name: 'Competitive scan for quarterly review',
      description: 'Keeps the task list active with a running example.',
      status: 'running',
      progress: 64,
      priority: 'medium',
      actualDuration: 0,
      createdAt: '2026-06-10T09:34:00.000Z',
      startedAt: '2026-06-10T09:35:00.000Z',
      completedAt: null,
      selectedAgents: ['analyst_support', 'recommender'],
    },
  ],
  taskDetails: {
    'task-1001': createTaskDetail({
      id: 'task-1001',
      name: 'Market intelligence brief',
      description: 'Demo task for dashboard visibility and review flows.',
      status: 'completed',
      progress: 100,
      priority: 'high',
      actualDuration: 1830000,
      createdAt: '2026-06-09T09:15:00.000Z',
      startedAt: '2026-06-09T09:16:00.000Z',
      completedAt: '2026-06-09T09:46:30.000Z',
      selectedAgents: ['data_extraction', 'financial_analysis', 'news_summarization'],
      agentJobs: [
        { id: 'job-1001-1', agentType: 'data_extraction', status: 'completed', actualDuration: 240000 },
        { id: 'job-1001-2', agentType: 'financial_analysis', status: 'completed', actualDuration: 540000 },
        { id: 'job-1001-3', agentType: 'news_summarization', status: 'completed', actualDuration: 360000 },
      ],
      agentResults: [
        {
          id: 'result-1001-1',
          title: 'Executive Summary',
          agentType: 'financial_analysis',
          resultType: 'success',
          confidence: 0.96,
          content: '# Executive Summary\n\nRevenue momentum is stable, margins are improving, and the sample data supports a positive outlook for the next quarter.',
          structuredData: {
            revenueGrowth: '15%',
            marginTrend: 'Improving',
            outlook: 'Positive',
          },
          tags: ['summary', 'finance', 'demo'],
        },
        {
          id: 'result-1001-2',
          title: 'Structured Market Signals',
          agentType: 'data_extraction',
          resultType: 'success',
          confidence: 0.91,
          content: {
            company: 'TechCorp Solutions',
            region: 'Europe',
            signals: ['Funding secured', 'Market expansion', 'New platform launch'],
          },
          structuredData: {
            keyThemes: ['Growth', 'Expansion', 'AI adoption'],
          },
          tags: ['signals', 'structured-data'],
        },
      ],
    }),
    'task-1002': createTaskDetail({
      id: 'task-1002',
      name: 'Competitive scan for quarterly review',
      description: 'Keeps the task list active with a running example.',
      status: 'running',
      progress: 64,
      priority: 'medium',
      actualDuration: 0,
      createdAt: '2026-06-10T09:34:00.000Z',
      startedAt: '2026-06-10T09:35:00.000Z',
      completedAt: null,
      selectedAgents: ['analyst_support', 'recommender'],
      agentJobs: [
        { id: 'job-1002-1', agentType: 'analyst_support', status: 'running', actualDuration: 310000 },
        { id: 'job-1002-2', agentType: 'recommender', status: 'pending', actualDuration: 0 },
      ],
      agentResults: [],
    }),
  },
  ingests: [
    {
      id: 'ingest-2001',
      type: 'text',
      title: 'Q4 investor notes',
      description: 'Demo text source used to populate the upload history.',
      status: 'processed',
      createdAt: '2026-06-09T09:14:00.000Z',
      sourceCount: 1,
      contentPreview: 'Revenue increased by 15% with stronger retention metrics.',
    },
    {
      id: 'ingest-2002',
      type: 'multiple_sources',
      title: 'Combined briefing pack',
      description: 'A mixed input demo for the upload flow.',
      status: 'processing',
      createdAt: '2026-06-10T09:36:00.000Z',
      sourceCount: 3,
      contentPreview: 'Text, URL, and file sources queued for processing.',
    },
  ],
  users: [
    {
      _id: 'user-demo-1',
      name: 'Demo Admin',
      email: 'demo@rezero.local',
      role: 'admin',
      isActive: true,
      createdAt: '2026-01-10T09:00:00.000Z',
    },
    {
      _id: 'user-demo-2',
      name: 'Analyst One',
      email: 'analyst@rezero.local',
      role: 'user',
      isActive: true,
      createdAt: '2026-02-18T12:30:00.000Z',
    },
  ],
  logs: [
    {
      _id: 'log-1',
      action: 'Demo session loaded',
      resourceType: 'auth',
      message: 'The app opened in local demo mode without backend login.',
      createdAt: demoNow,
    },
    {
      _id: 'log-2',
      action: 'Sample task processed',
      resourceType: 'tasks',
      message: 'Completed task data is preloaded for the dashboard.',
      createdAt: '2026-06-09T09:46:30.000Z',
    },
  ],
  counters: {
    task: 1003,
    ingest: 2003,
  },
};

const demoAgents = [
  {
    type: 'data_extraction',
    capabilities: {
      agentType: 'Data Extraction Agent',
      inputTypes: ['text', 'json', 'csv'],
    },
  },
  {
    type: 'financial_analysis',
    capabilities: {
      agentType: 'Financial Analysis Agent',
      inputTypes: ['text', 'json', 'csv'],
    },
  },
  {
    type: 'news_summarization',
    capabilities: {
      agentType: 'News Summarization Agent',
      inputTypes: ['text', 'url'],
    },
  },
  {
    type: 'analyst_support',
    capabilities: {
      agentType: 'Analyst Support Agent',
      inputTypes: ['text', 'json'],
    },
  },
  {
    type: 'recommender',
    capabilities: {
      agentType: 'Recommender Agent',
      inputTypes: ['text', 'json'],
    },
  },
];

const response = (data) => Promise.resolve({ data: clone(data) });

const persistUser = (user) => {
  demoState.user = { ...demoState.user, ...user };
  localStorage.setItem('user', JSON.stringify(demoState.user));
  localStorage.setItem('token', demoToken);
  return demoState.user;
};

const getCurrentUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return { ...demoState.user, ...JSON.parse(storedUser) };
    }
  } catch (error) {
    return demoState.user;
  }

  return demoState.user;
};

const listWithPagination = (items, params = {}) => {
  const searchTerm = (params.search || '').toLowerCase();
  const statusFilter = (params.status || '').toLowerCase();
  const limit = Number(params.limit) > 0 ? Number(params.limit) : items.length;

  const filtered = items.filter((item) => {
    const matchesSearch = !searchTerm
      || Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm));
    const matchesStatus = !statusFilter || String(item.status || '').toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  const paged = sorted.slice(0, limit);

  return {
    items: paged,
    pagination: {
      total: filtered.length,
      page: 1,
      limit,
      totalPages: 1,
    },
  };
};

const getTaskDetail = (id) => {
  if (demoState.taskDetails[id]) {
    return demoState.taskDetails[id];
  }

  return createTaskDetail({
    id,
    name: 'Ad hoc demo task',
    description: 'Generated automatically so task detail pages stay visible.',
    status: 'running',
    progress: 42,
    priority: 'medium',
    actualDuration: 0,
    createdAt: demoNow,
    startedAt: demoNow,
    completedAt: null,
    selectedAgents: ['analyst_support'],
    agentJobs: [
      { id: `${id}-job-1`, agentType: 'analyst_support', status: 'running', actualDuration: 120000 },
    ],
    agentResults: [],
  });
};

const createTaskRecord = (taskData = {}) => {
  const id = `task-${demoState.counters.task++}`;
  const createdAt = new Date().toISOString();
  const task = {
    id,
    name: taskData.name || 'Demo task',
    description: taskData.description || 'Automatically generated demo task.',
    status: 'running',
    progress: 20,
    priority: 'medium',
    actualDuration: 0,
    createdAt,
    startedAt: createdAt,
    completedAt: null,
    selectedAgents: taskData.selectedAgents || [],
  };

  demoState.tasks.unshift(task);
  demoState.taskDetails[id] = createTaskDetail({
    ...task,
    agentJobs: (taskData.selectedAgents || ['analyst_support']).map((agentType, index) => ({
      id: `${id}-job-${index + 1}`,
      agentType,
      status: index === 0 ? 'running' : 'pending',
      actualDuration: index === 0 ? 90000 : 0,
    })),
    agentResults: [],
  });

  return task;
};

const createIngestRecord = (ingestData = {}) => {
  const id = `ingest-${demoState.counters.ingest++}`;
  const ingest = {
    id,
    type: ingestData.type || 'text',
    title: ingestData.metadata?.title || ingestData.title || 'Demo ingest',
    description: ingestData.metadata?.description || ingestData.description || 'Generated from the local demo flow.',
    status: 'processed',
    createdAt: new Date().toISOString(),
    sourceCount: ingestData.metadata?.sourceCount || 1,
    contentPreview: 'Demo content stored locally so the upload flow stays interactive.',
  };

  demoState.ingests.unshift(ingest);
  return ingest;
};

const authPayload = (user) => ({
  user: persistUser({
    ...demoUserTemplate,
    ...user,
    lastLogin: new Date().toISOString(),
  }),
  token: demoToken,
});

export const authAPI = {
  login: async (credentials) => response(authPayload({
    name: credentials?.name || demoUserTemplate.name,
    email: credentials?.email || demoUserTemplate.email,
  })),
  testLogin: async () => response(authPayload({})),
  register: async (userData) => response(authPayload({
    name: userData?.name || demoUserTemplate.name,
    email: userData?.email || demoUserTemplate.email,
  })),
  getProfile: async () => response({ user: getCurrentUser() }),
  updateProfile: async (userData) => response({ user: persistUser({ ...userData }) }),
  logout: async () => {
    persistUser(demoUserTemplate);
    return response({ success: true });
  },
};

export const ingestAPI = {
  create: async (ingestData) => response({ ingestId: createIngestRecord(ingestData).id }),
  upload: async (formData) => {
    const metadata = formData?.get ? JSON.parse(formData.get('metadata') || '{}') : {};
    return response({ ingestId: createIngestRecord({ type: 'file', metadata }).id });
  },
  getById: async (id) => response({ ingest: demoState.ingests.find((ingest) => ingest.id === id) || null }),
  list: async (params = {}) => {
    const { items, pagination } = listWithPagination(demoState.ingests, params);
    return response({ ingests: items, pagination });
  },
  delete: async (id) => {
    demoState.ingests = demoState.ingests.filter((ingest) => ingest.id !== id);
    return response({ success: true });
  },
};

export const tasksAPI = {
  create: async (taskData) => {
    const task = createTaskRecord(taskData || {});
    return response({ taskId: task.id, task });
  },
  getById: async (id) => response(getTaskDetail(id)),
  list: async (params = {}) => {
    const { items, pagination } = listWithPagination(demoState.tasks, params);
    return response({ tasks: items, pagination });
  },
  update: async (id, taskData) => {
    const taskIndex = demoState.tasks.findIndex((task) => task.id === id);
    if (taskIndex >= 0) {
      demoState.tasks[taskIndex] = {
        ...demoState.tasks[taskIndex],
        ...taskData,
      };
    }
    return response({ task: demoState.tasks[taskIndex] || getTaskDetail(id).task });
  },
  cancel: async (id) => {
    const detail = getTaskDetail(id);
    detail.task.status = 'cancelled';
    demoState.taskDetails[id] = detail;
    return response({ success: true, task: detail.task });
  },
  delete: async (id) => {
    demoState.tasks = demoState.tasks.filter((task) => task.id !== id);
    delete demoState.taskDetails[id];
    return response({ success: true });
  },
  getAvailableAgents: async () => response({ agents: demoAgents }),
};

export const healthAPI = {
  check: async () => response({ status: 'ok', mode: 'demo' }),
};

export const adminAPI = {
  getStats: async () => response({
    users: { total: demoState.users.length },
    tasks: {
      total: demoState.tasks.length,
      active: demoState.tasks.filter((task) => task.status === 'running').length,
    },
    ingests: { total: demoState.ingests.length },
    recentErrors: [],
  }),
  getUsers: async (params = {}) => {
    const { items } = listWithPagination(demoState.users, params);
    return response({ users: items });
  },
  getLogs: async (params = {}) => {
    const { items } = listWithPagination(demoState.logs, params);
    return response({ logs: items });
  },
};

export default {};