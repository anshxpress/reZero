import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    Clock,
    AlertCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Brain,
    Sparkles,
    FileText
} from 'lucide-react';
import { tasksAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CurrentTaskDisplay = ({ taskId }) => {
    const [expandedResults, setExpandedResults] = useState(new Set());
    const [elapsedTime, setElapsedTime] = useState(0);

    const { data, isActive } = useQuery(
        ['task', taskId],
        () => tasksAPI.getById(taskId),
        {
            refetchInterval: (data) => {
                // Stop polling if task is completed, failed, or cancelled
                const status = data?.data?.task?.status;
                return (status === 'completed' || status === 'failed' || status === 'cancelled') ? false : 2000;
            },
            enabled: !!taskId
        }
    );

    const task = data?.data?.task;
    const agentJobs = data?.data?.agentJobs || [];
    const agentResults = data?.data?.agentResults || [];
    const isProcessing = task?.status === 'running' || task?.status === 'pending';

    useEffect(() => {
        let interval;
        if (isProcessing) {
            const startTime = new Date(task?.createdAt).getTime();
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } else if (task?.duration) {
            setElapsedTime(Math.floor(task.duration / 1000));
        }
        return () => clearInterval(interval);
    }, [isProcessing, task?.createdAt, task?.duration]);

    const toggleResultExpansion = (resultId) => {
        const newExpanded = new Set(expandedResults);
        if (newExpanded.has(resultId)) {
            newExpanded.delete(resultId);
        } else {
            newExpanded.add(resultId);
        }
        setExpandedResults(newExpanded);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!task) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="card overflow-hidden border-2 border-primary-100"
        >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary-50 to-white p-6 border-b border-primary-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            {isProcessing ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <Loader2 className="h-6 w-6 text-primary-600" />
                                </motion.div>
                            ) : task.status === 'completed' ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : (
                                <AlertCircle className="h-6 w-6 text-red-500" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {isProcessing ? 'Processing Data...' : 'Processing Complete'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {task.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-xs text-secondary-500 uppercase font-semibold tracking-wider">Time Elapsed</p>
                            <p className="text-lg font-mono font-medium text-secondary-900">{formatTime(elapsedTime)}</p>
                        </div>
                        {task.status !== 'completed' && (
                            <div className="badge badge-primary animate-pulse">
                                {task.status}
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-secondary-500">
                        <span>Overall Progress</span>
                        <span>{task.progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progress || 0}%` }}
                            transition={{ type: "spring", stiffness: 50, damping: 15 }}
                        />
                    </div>
                </div>
            </div>

            {/* Agents Status Grid */}
            <div className="p-6 bg-white">
                <h4 className="text-sm font-semibold text-secondary-900 mb-4 flex items-center">
                    <Brain className="w-4 h-4 mr-2 text-primary-500" />
                    Active Agents
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agentJobs.map((job, index) => (
                        <motion.div
                            key={job.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 rounded-xl border ${job.status === 'running'
                                    ? 'border-primary-200 bg-primary-50'
                                    : job.status === 'completed'
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-secondary-100 bg-secondary-50'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm text-gray-900">
                                    {job.agentType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </span>
                                {job.status === 'running' && (
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="w-2 h-2 rounded-full bg-primary-500"
                                    />
                                )}
                                {job.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                {job.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                            </div>
                            <p className="text-xs text-secondary-500">
                                {job.status === 'running' ? 'Analyzing data...' : job.status === 'completed' ? 'Analysis complete' : 'Waiting to start...'}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Results Section - Only when results exist */}
            <AnimatePresence>
                {agentResults.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-secondary-200"
                    >
                        <div className="p-6 bg-secondary-50">
                            <h4 className="text-sm font-semibold text-secondary-900 mb-4 flex items-center">
                                <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                                Analysis Results
                            </h4>
                            <div className="space-y-4">
                                {agentResults.map((result) => (
                                    <motion.div
                                        key={result.id}
                                        layout
                                        className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => toggleResultExpansion(result.id)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-lg ${result.resultType === 'success' ? 'bg-green-100' : 'bg-primary-100'
                                                    }`}>
                                                    <FileText className={`w-5 h-5 ${result.resultType === 'success' ? 'text-green-600' : 'text-primary-600'
                                                        }`} />
                                                </div>
                                                <div className="text-left">
                                                    <h5 className="font-medium text-gray-900">{result.title}</h5>
                                                    <p className="text-xs text-gray-500">
                                                        {result.agentType.replace(/_/g, ' ')} • {Math.round((result.confidence || 0) * 100)}% Confidence
                                                    </p>
                                                </div>
                                            </div>
                                            {expandedResults.has(result.id) ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {expandedResults.has(result.id) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-secondary-100"
                                                >
                                                    <div className="p-4 prose prose-sm max-w-none">
                                                        {typeof result.content === 'string' ? (
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
                                                                {result.content}
                                                            </ReactMarkdown>
                                                        ) : (
                                                            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                                                                {JSON.stringify(result.content, null, 2)}
                                                            </pre>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CurrentTaskDisplay;
