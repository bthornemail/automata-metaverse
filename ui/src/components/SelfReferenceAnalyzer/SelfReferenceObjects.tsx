import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Zap, Clock, X } from 'lucide-react';
import { Card } from '@/components/shared/Card';

interface SelfReferenceObject {
  id: string;
  text: string;
  line: number;
}

interface Modification {
  type: string;
  details: string;
  timestamp: number;
}

interface ExecutionEntry {
  action: string;
  from: string;
  to: string;
  iteration: number;
  timestamp: number;
  displayTime: string;
  actionDisplay: string;
}

interface SelfReferenceObjectsProps {
  selfRefObjects: SelfReferenceObject[];
  modifications: Modification[];
  executionHistory: ExecutionEntry[];
  loading?: boolean;
  onActivityClose?: (activity: Modification | ExecutionEntry) => void;
}

export const SelfReferenceObjects: React.FC<SelfReferenceObjectsProps> = ({ 
  selfRefObjects,
  modifications, 
  executionHistory,
  loading = false,
  onActivityClose
}) => {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [closedActivities, setClosedActivities] = useState<Set<string>>(new Set());

  // Convert closed activities to self-reference objects
  const closedActivityRefs = Array.from(closedActivities).map(id => {
    const mod = modifications.find(m => `${m.type}-${m.timestamp}` === id);
    const exec = executionHistory.find(e => `${e.action}-${e.timestamp}` === id);
    
    if (mod) {
      return {
        id: `mod-${mod.timestamp}`,
        text: `${mod.type}: ${mod.details}`,
        line: Math.floor(mod.timestamp / 1000) % 1000,
        source: 'modification' as const,
        timestamp: mod.timestamp
      };
    }
    if (exec) {
      return {
        id: `exec-${exec.timestamp}`,
        text: `${exec.actionDisplay}: ${exec.from} → ${exec.to}`,
        line: exec.iteration,
        source: 'execution' as const,
        timestamp: exec.timestamp
      };
    }
    return null;
  }).filter(Boolean) as Array<SelfReferenceObject & { source: 'modification' | 'execution'; timestamp: number }>;

  // Combine active activities
  const activeActivities = [
    ...modifications
      .filter(mod => !closedActivities.has(`${mod.type}-${mod.timestamp}`))
      .map(mod => ({
        type: 'modification' as const,
        title: mod.type,
        description: mod.details,
        timestamp: mod.timestamp,
        icon: FileText,
        color: 'text-purple-400',
        borderColor: 'border-purple-500',
        id: `${mod.type}-${mod.timestamp}`
      })),
    ...executionHistory
      .filter(exec => !closedActivities.has(`${exec.action}-${exec.timestamp}`))
      .map(exec => ({
        type: 'execution' as const,
        title: exec.actionDisplay,
        description: `${exec.from} → ${exec.to}`,
        timestamp: exec.timestamp,
        icon: Zap,
        color: 'text-blue-400',
        borderColor: 'border-blue-500',
        id: `${exec.action}-${exec.timestamp}`
      }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  // Combine all self-reference objects (original + closed activities)
  const allSelfRefs = [
    ...selfRefObjects,
    ...closedActivityRefs.map(ref => ({
      id: ref.id,
      text: ref.text,
      line: ref.line
    }))
  ];

  const handleCloseActivity = (activityId: string) => {
    setClosedActivities(prev => new Set([...prev, activityId]));
    const mod = modifications.find(m => `${m.type}-${m.timestamp}` === activityId);
    const exec = executionHistory.find(e => `${e.action}-${e.timestamp}` === activityId);
    if (onActivityClose && (mod || exec)) {
      onActivityClose((mod || exec)!);
    }
  };

  if (loading) {
    return (
      <Card title="Self-Reference Objects & Activity">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366f1]"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Self-Reference Objects & Activity">
      <div className="space-y-4">
        {/* Active Activities Section */}
        {activeActivities.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Active Activities
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border-l-4 ${activity.borderColor} bg-gray-700/30 relative group`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`mt-0.5 ${activity.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${activity.color}`}>
                            {activity.title}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {activity.description}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCloseActivity(activity.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-600 rounded"
                        title="Close and convert to self-reference"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-white" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Self-Reference Objects Section */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Self-Reference Objects
            {closedActivityRefs.length > 0 && (
              <span className="text-xs text-gray-400 ml-2">
                ({closedActivityRefs.length} from activities)
              </span>
            )}
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allSelfRefs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No self-reference objects found
              </div>
            ) : (
              allSelfRefs.map((ref, index) => {
                const isFromActivity = closedActivityRefs.some(c => c.id === ref.id);
                return (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 bg-gray-700/50 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedLine === ref.line
                        ? 'border-[#6366f1] bg-[#6366f1]/20'
                        : isFromActivity
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedLine(selectedLine === ref.line ? null : ref.line)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                          isFromActivity ? 'bg-green-600' : 'bg-[#6366f1]'
                        }`}>
                          {ref.line}
                        </div>
                        <div>
                          <div className="text-white font-medium">{ref.id}</div>
                          <div className="text-xs text-gray-400">
                            Line {ref.line}
                            {isFromActivity && <span className="ml-2 text-green-400">• From Activity</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-300 font-mono bg-gray-800 p-2 rounded">
                      {ref.text.length > 100 ? `${ref.text.substring(0, 100)}...` : ref.text}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
