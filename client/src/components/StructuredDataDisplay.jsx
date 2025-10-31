import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

// Move ObjectDisplay outside to prevent re-creation on every render
const ObjectDisplay = ({ data, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 3); // Auto-expand first 3 levels for better UX
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return <span className="text-gray-400 italic">{'{}'}</span>;
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center space-x-1 text-left hover:bg-gray-50 rounded px-1 py-0.5 -ml-1"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-gray-400" />
        ) : (
          <ChevronRight className="h-3 w-3 text-gray-400" />
        )}
        <span className="text-gray-400 font-mono text-sm">
          {expanded ? '{' : `{...${entries.length} ${entries.length === 1 ? 'key' : 'keys'}}`}
        </span>
      </button>
      
      {expanded && (
        <div className="ml-4 space-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-start space-x-2">
              <span className="text-blue-600 font-mono text-sm font-medium min-w-[120px]">
                {key}:
              </span>
              <div className="flex-1">
                <ValueRenderer value={value} key={key} depth={depth + 1} />
              </div>
            </div>
          ))}
          <div className="text-gray-400 font-mono text-sm">{'}'}</div>
        </div>
      )}
    </div>
  );
};

// Move ValueRenderer outside to prevent re-creation
const ValueRenderer = ({ value, key = null, depth = 0 }) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">null</span>;
  }

  if (typeof value === 'boolean') {
    return <span className={`font-mono ${value ? 'text-green-600' : 'text-red-600'}`}>{value.toString()}</span>;
  }

  if (typeof value === 'number') {
    return <span className="font-mono text-blue-600">{value}</span>;
  }

  if (typeof value === 'string') {
    // Check if it's a URL
    if (value.match(/^https?:\/\//)) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
        >
          {value}
        </a>
      );
    }
    // Check if it's a long string that should be truncated
    if (value.length > 100) {
      return (
        <div className="space-y-1">
          <div className="font-mono text-sm bg-gray-50 p-2 rounded border max-h-32 overflow-y-auto">
            {value}
          </div>
        </div>
      );
    }
    return <span className="font-mono text-gray-800">"{value}"</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-400 italic">[]</span>;
    }
    return (
      <div className="space-y-1">
        {value.map((item, index) => (
          <div key={index} className="flex items-start space-x-2">
            <span className="text-gray-400 text-sm font-mono min-w-[20px]">{index}:</span>
            <div className="flex-1">
              <ValueRenderer value={item} key={index} depth={depth + 1} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <span className="text-gray-400 italic">{'{}'}</span>;
    }
    return <ObjectDisplay data={value} depth={depth + 1} />;
  }

  return <span className="font-mono text-gray-800">{String(value)}</span>;
};

const StructuredDataDisplay = ({ data, title = "Structured Data" }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Memoize the data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => data, [JSON.stringify(data)]);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-medium text-gray-900">{title}</h5>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy JSON</span>
            </>
          )}
        </button>
      </div>
      
      <div className="bg-gray-50 border rounded-lg p-3 text-sm">
        <ObjectDisplay data={memoizedData} />
      </div>
    </div>
  );
};

export default StructuredDataDisplay;
