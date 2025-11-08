import React from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, Zap } from 'lucide-react';
import { Card } from '@/components/shared/Card';

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

interface RecentActivityProps {
  modifications: Modification[];
  executionHistory: ExecutionEntry[];
  loading?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ 
  modifications, 
  executionHistory,
  loading = false 
}) => {
  // Combine and sort by timestamp
  const allActivities = [
    ...modifications.map(mod => ({
      type: 'modification' as const,
      title: mod.type,
      description: mod.details,
      timestamp: mod.timestamp,
      icon: FileText,
      color: 'text-purple-400'
    })),
    ...executionHistory.map(entry => ({
      type: 'execution' as const,
      title: entry.actionDisplay,
      description: `${entry.from} → ${entry.to}`,
      timestamp: entry.timestamp,
      icon: Zap,
      color: 'text-blue-400'
    }))
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

  if (loading) {
    return (
      <Card title="Recent Activity">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366f1]"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Recent Activity">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {allActivities.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No recent activity
          </div>
        ) : (
          allActivities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <motion.div
                key={`${activity.type}-${activity.timestamp}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-lg border-l-4 ${
                  activity.type === 'modification' 
                    ? 'bg-gray-700/30 border-purple-500' 
                    : 'bg-gray-800 border-blue-500'
                }`}
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
                  <div className="text-xs text-gray-500 ml-2">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </Card>
  );
};
