import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import { 
  Upload, 
  FileText, 
  Link as LinkIcon, 
  Type, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Files
} from 'lucide-react';
import { ingestAPI, tasksAPI } from '../services/api';
import toast from 'react-hot-toast';

const IngestPage = () => {
  const [activeTab, setActiveTab] = useState('text');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [textInputs, setTextInputs] = useState(['']);
  const [urlInputs, setUrlInputs] = useState(['']);
  const [dragActive, setDragActive] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const fileInputRef = useRef(null);
  const multipleFileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm();

  // Fetch available agents (with error handling for no auth)
  const { data: agentsData } = useQuery('availableAgents', tasksAPI.getAvailableAgents, {
    retry: false,
    onError: (error) => {
      console.log('Agents API not available, using mock data');
    }
  });
  
  // Mock agents for testing when API is not available
  const agents = agentsData?.data?.agents || [
    {
      type: 'data_extraction',
      capabilities: {
        agentType: 'Data Extraction Agent',
        inputTypes: ['text', 'json', 'csv']
      }
    },
    {
      type: 'financial_analysis',
      capabilities: {
        agentType: 'Financial Analysis Agent',
        inputTypes: ['text', 'json', 'csv']
      }
    },
    {
      type: 'news_summarization',
      capabilities: {
        agentType: 'News Summarization Agent',
        inputTypes: ['text', 'url']
      }
    },
    {
      type: 'analyst_support',
      capabilities: {
        agentType: 'Analyst Support Agent',
        inputTypes: ['text', 'json']
      }
    },
    {
      type: 'recommender',
      capabilities: {
        agentType: 'Recommender Agent',
        inputTypes: ['text', 'json']
      }
    }
  ];

  // Create ingest mutation
  const createIngestMutation = useMutation(ingestAPI.create, {
    onSuccess: async (response) => {
      toast.success('Data uploaded successfully!');
      reset();
      setSelectedFile(null);
      setSelectedFiles([]);
      setTextInputs(['']);
      setUrlInputs(['']);
      
      // Automatically create a task after successful upload
      if (response.data?.ingestId) {
        await createTask(response.data.ingestId);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Upload failed');
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation(ingestAPI.upload, {
    onSuccess: async (response) => {
      const successMessage = activeTab === 'multiple' 
        ? `Multiple data sources uploaded successfully! (${textInputs.filter(t => t.trim()).length + urlInputs.filter(u => u.trim()).length + selectedFiles.length} sources)`
        : 'File uploaded successfully!';
      toast.success(successMessage);
      
      setSelectedFile(null);
      setSelectedFiles([]);
      setTextInputs(['']);
      setUrlInputs(['']);
      
      // Automatically create a task after successful upload
      if (response.data?.ingestId) {
        await createTask(response.data.ingestId);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'File upload failed');
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation(tasksAPI.create, {
    onSuccess: (response) => {
      toast.success('Task created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Task creation failed');
    },
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Multiple file handling functions
  const handleMultipleFileSelect = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleMultipleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleMultipleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeMultipleFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    if (multipleFileInputRef.current) {
      multipleFileInputRef.current.value = '';
    }
  };

  // Multiple text inputs management
  const addTextInput = () => {
    setTextInputs(prev => [...prev, '']);
  };

  const removeTextInput = (index) => {
    if (textInputs.length > 1) {
      setTextInputs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateTextInput = (index, value) => {
    setTextInputs(prev => prev.map((text, i) => i === index ? value : text));
  };

  // Multiple URL inputs management
  const addUrlInput = () => {
    setUrlInputs(prev => [...prev, '']);
  };

  const removeUrlInput = (index) => {
    if (urlInputs.length > 1) {
      setUrlInputs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateUrlInput = (index, value) => {
    setUrlInputs(prev => prev.map((url, i) => i === index ? value : url));
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    clearErrors('content'); // Clear any validation errors when switching tabs
    
    // Clear file selections when switching away from file tabs
    if (tabId !== 'file' && tabId !== 'multiple') {
      setSelectedFile(null);
      setSelectedFiles([]);
    }
    
    // Clear multiple data sources when switching away from multiple tab
    if (tabId !== 'multiple') {
      setTextInputs(['']);
      setUrlInputs(['']);
      setSelectedFiles([]);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (activeTab === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await uploadFileMutation.mutateAsync(formData);
      } else if (activeTab === 'multiple') {
        // Handle multiple data sources (text, URLs, files)
        const hasText = textInputs.some(text => text.trim());
        const hasUrls = urlInputs.some(url => url.trim());
        const hasFiles = selectedFiles.length > 0;
        
        if (!hasText && !hasUrls && !hasFiles) {
          toast.error('Please add at least one data source (text, URL, or file)');
          return;
        }

        // Combine all data sources
        let combinedContent = '';
        const sources = [];

        // Add text inputs
        textInputs.forEach((text, index) => {
          if (text.trim()) {
            combinedContent += `=== TEXT INPUT ${index + 1} ===\n${text.trim()}\n\n`;
            sources.push({ type: 'text', content: text.trim(), index: index + 1 });
          }
        });

        // Add URL inputs
        urlInputs.forEach((url, index) => {
          if (url.trim()) {
            combinedContent += `=== URL ${index + 1}: ${url.trim()} ===\n\n`;
            sources.push({ type: 'url', content: url.trim(), index: index + 1 });
          }
        });

        // Add files
        if (hasFiles) {
          const formData = new FormData();
          selectedFiles.forEach((file, index) => {
            formData.append(`file`, file);
            const content = `=== FILE ${index + 1}: ${file.name} ===\n[File content will be processed]\n\n`;
            combinedContent += content;
            sources.push({ type: 'file', content: file.name, index: index + 1 });
          });
          
          formData.append('metadata', JSON.stringify({
            title: data.title || `Multiple Data Sources (${sources.length} sources)`,
            description: data.description || `Combined ${sources.length} data sources for processing`,
            sources: sources,
            sourceCount: sources.length,
            hasText,
            hasUrls,
            hasFiles,
            fileCount: selectedFiles.length,
            textCount: textInputs.filter(t => t.trim()).length,
            urlCount: urlInputs.filter(u => u.trim()).length
          }));
          
          await uploadFileMutation.mutateAsync(formData);
        } else {
          // No files, just text and URLs - use regular ingest
          await createIngestMutation.mutateAsync({
            type: 'multiple_sources',
            content: combinedContent,
            metadata: {
              title: data.title || `Multiple Data Sources (${sources.length} sources)`,
              description: data.description || `Combined ${sources.length} data sources for processing`,
              sources: sources,
              sourceCount: sources.length,
              hasText,
              hasUrls,
              hasFiles,
              textCount: textInputs.filter(t => t.trim()).length,
              urlCount: urlInputs.filter(u => u.trim()).length
            },
          });
        }
      } else {
        await createIngestMutation.mutateAsync({
          type: activeTab,
          content: data.content,
          metadata: {
            title: data.title || undefined,
            description: data.description || undefined,
          },
        });
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Authentication required. Please login first.');
      } else if (error.response?.status === 404) {
        toast.error('API endpoint not found. Please check if the server is running on port 4000.');
      } else {
        toast.error('Upload failed. Please try again or check server connection.');
      }
    }
  };

  const handleAgentToggle = (agentType) => {
    setSelectedAgents(prev => {
      if (prev.includes(agentType)) {
        return prev.filter(type => type !== agentType);
      } else {
        return [...prev, agentType];
      }
    });
  };

  const createTask = async (ingestId) => {
    console.log('Selected agents from state:', selectedAgents);

    if (selectedAgents.length === 0) {
      toast.error('Please select at least one agent');
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        ingestId,
        name: activeTab === 'multiple' 
          ? `Task for multiple data sources (${textInputs.filter(t => t.trim()).length + urlInputs.filter(u => u.trim()).length + selectedFiles.length} sources)`
          : `Task for ${activeTab} data`,
        selectedAgents,
        parameters: {
          // Add any specific parameters here
          ...(activeTab === 'multiple' && {
            sourceCount: textInputs.filter(t => t.trim()).length + urlInputs.filter(u => u.trim()).length + selectedFiles.length,
            textCount: textInputs.filter(t => t.trim()).length,
            urlCount: urlInputs.filter(u => u.trim()).length,
            fileCount: selectedFiles.length,
            fileNames: selectedFiles.map(f => f.name)
          })
        },
      });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const tabs = [
    { id: 'text', name: 'Text Input', icon: Type },
    { id: 'url', name: 'URL', icon: LinkIcon },
    { id: 'file', name: 'File Upload', icon: Upload },
    { id: 'multiple', name: 'Multiple Data Sources', icon: Files },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Upload Data</h1>
        <p className="text-secondary-600">
          Upload your data and select AI agents to process it.
        </p>
        
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upload Form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            {/* Tabs */}
            <div className="border-b border-secondary-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`btn-tab ${
                      activeTab === tab.id
                        ? 'btn-tab-active'
                        : 'btn-tab-inactive'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Text Input */}
              {activeTab === 'text' && (
                <div>
                  <label htmlFor="content" className="label">
                    Text Content
                  </label>
                  <textarea
                    {...register('content', { 
                      required: 'Content is required'
                    })}
                    rows={8}
                    className={`input ${errors.content ? 'border-error-300 focus:ring-error-500' : ''}`}
                    placeholder="Enter your text content here..."
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-error-600">{errors.content.message}</p>
                  )}
                  
                  {/* Sample Text Options */}
                  <div className="mt-4">
                    <p className="text-sm text-secondary-600 mb-2">Quick test with sample data:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          reset({
                            ...watch(),
                            content: `TechCorp Solutions Q4 2023 Report

Company: TechCorp Solutions
Revenue: $5.2M (15% YoY growth)
Employees: 150
Key Products: AI Analytics, Cloud Services, Data Processing

Financial Highlights:
- Q4 Revenue: $1.3M
- Gross Margin: 63%
- Net Income: $480K

Recent News:
- Secured $2M Series A funding
- Expanded to European market
- Launched new AI platform

This is a sample business report for testing the Re-Zero AI Framework's data extraction and analysis capabilities.`
                          });
                        }}
                        className="text-xs px-3 py-1 bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors"
                      >
                        Business Report
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          reset({
                            ...watch(),
                            content: `Financial Analysis Data

Company: TechCorp Solutions
Industry: Technology Services
Market Cap: $50M
P/E Ratio: 25.5

Quarterly Performance:
Q1 2023: Revenue $1.2M, Net Income $400K
Q2 2023: Revenue $1.4M, Net Income $500K  
Q3 2023: Revenue $1.3M, Net Income $450K
Q4 2023: Revenue $1.3M, Net Income $480K

Key Metrics:
- Customer Acquisition Cost: $2,500
- Customer Lifetime Value: $15,000
- Monthly Recurring Revenue: $433K
- Churn Rate: 5%

Market Analysis:
The technology services sector is experiencing 25% annual growth. AI and cloud computing are driving significant demand. TechCorp is well-positioned with innovative solutions and experienced team.`
                          });
                        }}
                        className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                      >
                        Financial Data
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          reset({
                            ...watch(),
                            content: `News Summary - Technology Sector

Recent Headlines:
1. "TechCorp Announces AI Breakthrough" - New machine learning algorithm improves data processing by 40%
2. "Market Analysis: AI Sector Growth" - Industry experts predict 25% growth in AI services market for 2024
3. "TechCorp Secures $2M Funding Round" - Series A funding for product development and market expansion
4. "Cloud Computing Trends 2024" - 80% of companies plan to increase cloud investments
5. "TechCorp Expands to European Market" - New London office, hiring 30 local employees

Market Sentiment: Positive
Key Trends: AI adoption, cloud migration, data analytics
Competitive Landscape: Growing competition in AI services sector
Regulatory Environment: Increasing focus on data privacy and AI ethics

This news summary provides insights into the technology sector's current state and future outlook.`
                          });
                        }}
                        className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        News Summary
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* URL Input */}
              {activeTab === 'url' && (
                <div>
                  <label htmlFor="content" className="label">
                    URL
                  </label>
                  <input
                    {...register('content', { 
                      required: 'URL is required'
                    })}
                    type="url"
                    className={`input ${errors.content ? 'border-error-300 focus:ring-error-500' : ''}`}
                    placeholder="https://example.com"
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-error-600">{errors.content.message}</p>
                  )}
                </div>
              )}

              {/* File Upload */}
              {activeTab === 'file' && (
                <div>
                  <label className="label">File Upload</label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                      dragActive
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-secondary-300 hover:border-secondary-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".txt,.json,.csv,.pdf"
                    />
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-secondary-400" />
                      <div className="mt-4">
                        <p className="text-sm text-secondary-600">
                          <span className="font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-secondary-500">
                          TXT, JSON, CSV, PDF files up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="mt-4 p-3 bg-secondary-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-secondary-400" />
                        <div>
                          <p className="text-sm font-medium text-secondary-900">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-secondary-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-secondary-400 hover:text-secondary-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Multiple Data Sources */}
              {activeTab === 'multiple' && (
                <div className="space-y-6">
                  {/* Text Inputs Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="label mb-0">Text Inputs</label>
                      <button
                        type="button"
                        onClick={addTextInput}
                        className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Text</span>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {textInputs.map((text, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="flex-1">
                            <textarea
                              value={text}
                              onChange={(e) => updateTextInput(index, e.target.value)}
                              className="input min-h-[100px]"
                              placeholder={`Text input ${index + 1}...`}
                            />
                          </div>
                          {textInputs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTextInput(index)}
                              className="text-secondary-400 hover:text-secondary-600 mt-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* URL Inputs Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="label mb-0">URLs</label>
                      <button
                        type="button"
                        onClick={addUrlInput}
                        className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add URL</span>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {urlInputs.map((url, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="flex-1">
                            <input
                              type="url"
                              value={url}
                              onChange={(e) => updateUrlInput(index, e.target.value)}
                              className="input"
                              placeholder={`URL ${index + 1}...`}
                            />
                          </div>
                          {urlInputs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeUrlInput(index)}
                              className="text-secondary-400 hover:text-secondary-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="label mb-0">Files</label>
                      <button
                        type="button"
                        onClick={() => multipleFileInputRef.current?.click()}
                        className="btn btn-outline btn-sm"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Files</span>
                      </button>
                    </div>
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                        dragActive
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-secondary-300 hover:border-secondary-400'
                      }`}
                      onDragEnter={handleMultipleDrag}
                      onDragLeave={handleMultipleDrag}
                      onDragOver={handleMultipleDrag}
                      onDrop={handleMultipleDrop}
                    >
                      <input
                        ref={multipleFileInputRef}
                        type="file"
                        multiple
                        onChange={handleMultipleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".txt,.json,.csv,.pdf"
                      />
                      <div className="text-center">
                        <Files className="mx-auto h-12 w-12 text-secondary-400" />
                        <div className="mt-4">
                          <p className="text-sm text-secondary-600">
                            <span className="font-medium">Click to upload files</span> or drag and drop
                          </p>
                          <p className="text-xs text-secondary-500">
                            TXT, JSON, CSV, PDF files up to 10MB each
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-secondary-900">
                            Selected Files ({selectedFiles.length})
                          </h4>
                          <button
                            type="button"
                            onClick={clearAllFiles}
                            className="text-xs text-secondary-500 hover:text-secondary-700"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="p-3 bg-secondary-50 rounded-lg flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-4 w-4 text-secondary-400" />
                                <div>
                                  <p className="text-sm font-medium text-secondary-900">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-secondary-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMultipleFile(index)}
                                className="text-secondary-400 hover:text-secondary-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="title" className="label">
                    Title (optional)
                  </label>
                  <input
                    {...register('title')}
                    type="text"
                    className="input"
                    placeholder="Enter a title"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="label">
                    Description (optional)
                  </label>
                  <input
                    {...register('description')}
                    type="text"
                    className="input"
                    placeholder="Enter a description"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || (activeTab === 'file' && !selectedFile) || (activeTab === 'multiple' && textInputs.every(t => !t.trim()) && urlInputs.every(u => !u.trim()) && selectedFiles.length === 0)}
                  className="btn btn-upload btn-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {activeTab === 'multiple' ? 'Processing Data Sources...' : 'Uploading...'}
                    </>
                  ) : (
                    activeTab === 'multiple' ? 'Process Data Sources' : 'Upload Data'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Agent Selection */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">
              Select AI Agents
            </h3>
            <p className="text-sm text-secondary-600 mb-4">
              Choose which agents should process your data.
            </p>

            <div className="space-y-3">
              {agents.map((agent) => (
                <div key={agent.type} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={`agent_${agent.type}`}
                    checked={selectedAgents.includes(agent.type)}
                    onChange={() => handleAgentToggle(agent.type)}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor={`agent_${agent.type}`} className="text-sm font-medium text-secondary-900 cursor-pointer">
                      {agent.capabilities.agentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <p className="text-xs text-secondary-500">
                      {agent.capabilities.inputTypes?.join(', ')} support
                    </p>
                  </div>
                </div>
              ))}
            </div>


            <div className="mt-6 p-4 bg-secondary-50 rounded-lg">
              <h4 className="text-sm font-medium text-secondary-900 mb-2">
                Processing Info
              </h4>
              <ul className="text-xs text-secondary-600 space-y-1">
                <li>• Agents run in parallel</li>
                <li>• Results are aggregated automatically</li>
                <li>• Processing time varies by data size</li>
                <li>• You can monitor progress in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngestPage;
