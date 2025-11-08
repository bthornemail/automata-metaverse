/**
 * Pure Scheme/R5RS REPL Component
 * Line-by-line processing without JSONL
 */

import React, { useState, useEffect, useRef } from 'react';
import { schemeREPLService, SchemeREPLResult } from '../../services/scheme-repl-service';
import { motion } from 'framer-motion';

const SchemeREPL: React.FC = () => {
  const [history, setHistory] = useState<Array<{ input: string; result: SchemeREPLResult; timestamp: number }>>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<any>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    schemeREPLService.loadR5RSFunctions();
  }, []);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleEvaluate = async () => {
    if (!currentInput.trim() || isLoading) return;

    const input = currentInput.trim();
    setCurrentInput('');
    setIsLoading(true);

    try {
      const result = await schemeREPLService.evaluateLine(input, context);
      
      setHistory(prev => [...prev, {
        input,
        result,
        timestamp: Date.now()
      }]);

      // Update context if define was used
      if (result.success && result.result) {
        // Context updates handled in service
      }
    } catch (error) {
      setHistory(prev => [...prev, {
        input,
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEvaluate();
    }
  };

  const loadAutomatonLine = async (line: string) => {
    setIsLoading(true);
    try {
      const result = await schemeREPLService.processAutomatonLine(line);
      setHistory(prev => [...prev, {
        input: `(load-automaton-line "${line.substring(0, 50)}...")`,
        result,
        timestamp: Date.now()
      }]);
    } catch (error) {
      setHistory(prev => [...prev, {
        input: `(load-automaton-line "${line.substring(0, 50)}...")`,
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-green-400 font-mono">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h2 className="text-xl font-bold text-white">Scheme/R5RS REPL</h2>
        <p className="text-sm text-gray-400 mt-1">
          Pure Scheme line-by-line processing • No JSONL • R5RS Functions
        </p>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {history.length === 0 && (
          <div className="text-gray-500 text-sm">
            <p>Welcome to the Scheme REPL!</p>
            <p className="mt-2">Try:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><code className="text-green-400">(r5rs:church-add 2 3)</code></li>
              <li><code className="text-green-400">(define x 42)</code></li>
              <li><code className="text-green-400">(r5rs:parse-jsonl-canvas '(...))</code></li>
            </ul>
          </div>
        )}
        
        {history.map((entry, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <div className="text-blue-400">
              <span className="text-gray-500">&gt;</span> {entry.input}
            </div>
            {entry.result.success ? (
              <div className="text-green-300 ml-4">
                {typeof entry.result.result === 'object' ? (
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(entry.result.result, null, 2)}
                  </pre>
                ) : (
                  String(entry.result.result)
                )}
                {entry.result.output && entry.result.output.length > 0 && (
                  <div className="text-gray-400 text-xs mt-1">
                    {entry.result.output.map((out, i) => (
                      <div key={i}>{out}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-400 ml-4">
                Error: {entry.result.error}
              </div>
            )}
          </motion.div>
        ))}
        <div ref={historyEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter Scheme expression... (Enter to evaluate, Shift+Enter for newline)"
            className="flex-1 bg-gray-900 text-green-400 p-2 rounded border border-gray-700 focus:border-green-500 focus:outline-none font-mono text-sm resize-none"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleEvaluate}
            disabled={isLoading || !currentInput.trim()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-mono text-sm transition-colors"
          >
            {isLoading ? '...' : 'Eval'}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span>Pure Scheme/R5RS • Line-by-line • No JSONL parsing</span>
        </div>
      </div>
    </div>
  );
};

export default SchemeREPL;
