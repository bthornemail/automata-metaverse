#!/usr/bin/env tsx
/**
 * Learning Automaton
 *
 * Extends MemoryOptimizedAutomaton with learning capabilities:
 * - Tracks execution patterns and frequencies
 * - Learns which modifications lead to better outcomes
 * - Adapts modification patterns based on history
 * - Stores learned patterns in knowledge base
 */
import { MemoryOptimizedAutomaton } from './automaton-memory-optimized.js';
import { PatternTracker } from './pattern-tracker.js';
import * as fs from 'fs';
import * as path from 'path';
export class LearningAutomaton extends MemoryOptimizedAutomaton {
    constructor(filePath, config) {
        super(filePath);
        this.lastMemoryUsage = 0;
        this.executionStartTime = 0;
        this.currentActionSequence = [];
        this.learningConfig = {
            enableLearning: config?.enableLearning ?? true,
            patternFile: config?.patternFile || path.join(path.dirname(filePath), 'learned-patterns.jsonl'),
            minPatternConfidence: config?.minPatternConfidence || 0.5,
            adaptationRate: config?.adaptationRate || 0.3,
            trackMemory: config?.trackMemory ?? true,
            trackExecutionTime: config?.trackExecutionTime ?? true
        };
        this.patternTracker = new PatternTracker();
        // Load existing patterns if file exists
        if (this.learningConfig.patternFile && fs.existsSync(this.learningConfig.patternFile)) {
            try {
                const jsonl = fs.readFileSync(this.learningConfig.patternFile, 'utf-8');
                this.patternTracker.loadFromJSONL(jsonl);
                console.log('📚 Loaded learned patterns from:', this.learningConfig.patternFile);
            }
            catch (error) {
                console.warn('⚠️  Failed to load learned patterns:', error);
            }
        }
        // Initialize memory tracking
        if (this.learningConfig.trackMemory) {
            this.lastMemoryUsage = this.getCurrentMemoryUsage();
        }
        console.log('🧠 Learning Automaton initialized');
        console.log(`   Learning: ${this.learningConfig.enableLearning ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`   Pattern File: ${this.learningConfig.patternFile}`);
    }
    /**
     * Override executeAction to track patterns
     */
    executeAction(action, fromState, toState, context = {}) {
        if (!this.learningConfig.enableLearning) {
            super.executeAction(action, fromState, toState, context);
            return;
        }
        // Track execution start
        this.executionStartTime = Date.now();
        const memBefore = this.learningConfig.trackMemory ? this.getCurrentMemoryUsage() : 0;
        // Get current dimension
        const currentDimension = this.currentDimension || 0;
        // Get recommended pattern if available
        const recommendedPattern = this.patternTracker.getRecommendedPattern(currentDimension);
        // Execute action
        super.executeAction(action, fromState, toState, context);
        // Track execution end
        const executionTime = Date.now() - this.executionStartTime;
        const memAfter = this.learningConfig.trackMemory ? this.getCurrentMemoryUsage() : 0;
        const memoryDelta = memAfter - memBefore;
        // Track execution pattern (assume success since no return value)
        this.patternTracker.trackExecution(currentDimension, [...this.currentActionSequence], 'success', memAfter, executionTime, {
            recommendedPattern: recommendedPattern?.id,
            memoryDelta
        });
        // Track modification if one was made
        const lastModification = this.getLastModification();
        if (lastModification) {
            this.trackModification(currentDimension, lastModification, true, memoryDelta, executionTime);
        }
        // Clear action sequence for next execution
        this.currentActionSequence = [];
    }
    /**
     * Generate modification using learned patterns
     */
    generateModification() {
        if (!this.learningConfig.enableLearning) {
            // Return a default modification object
            return {
                id: `modification-${Date.now()}`,
                type: 'text',
                currentState: 'modified',
                dimensionalLevel: this.currentDimension || 0
            };
        }
        const currentDimension = this.currentDimension || 0;
        // Get best patterns for this dimension
        const bestPatterns = this.patternTracker.getBestPatterns(currentDimension, 3);
        // Use learned pattern if confidence is high enough
        if (bestPatterns.length > 0 && bestPatterns[0] && bestPatterns[0].confidence >= this.learningConfig.minPatternConfidence) {
            const learnedPattern = bestPatterns[0].pattern;
            // Try to adapt the pattern
            const adaptedModification = this.adaptPattern(learnedPattern);
            if (adaptedModification) {
                this.currentActionSequence.push(`learned-${learnedPattern.id}`);
                return adaptedModification;
            }
        }
        // Fall back to default generation
        this.currentActionSequence.push('default-generation');
        return {
            id: `modification-${Date.now()}`,
            type: 'text',
            currentState: 'modified',
            dimensionalLevel: currentDimension
        };
    }
    /**
     * Adapt a learned pattern to current context
     */
    adaptPattern(pattern) {
        // Simple adaptation: use pattern as template
        // In a more sophisticated implementation, this would parse the pattern
        // and generate appropriate modifications
        try {
            // Try to parse pattern as JSON
            const parsed = JSON.parse(pattern.pattern);
            return parsed;
        }
        catch {
            // Pattern is not JSON, try to extract structure
            // For now, return null to fall back to default generation
            return null;
        }
    }
    /**
     * Track a modification pattern
     */
    trackModification(dimension, modification, success, memoryDelta, executionTime) {
        const patternType = this.determinePatternType(modification);
        const patternString = JSON.stringify(modification);
        this.patternTracker.trackModification(dimension, patternType, patternString, success, memoryDelta, executionTime);
    }
    /**
     * Determine pattern type from modification
     */
    determinePatternType(modification) {
        if (modification.type === 'add' || modification.action === 'add') {
            return 'add';
        }
        else if (modification.type === 'remove' || modification.action === 'remove') {
            return 'remove';
        }
        else if (modification.type === 'transform' || modification.action === 'transform') {
            return 'transform';
        }
        else {
            return 'modify';
        }
    }
    /**
     * Get last modification made
     */
    getLastModification() {
        // Access parent's execution history if available
        const executionHistory = this.executionHistory;
        if (executionHistory && executionHistory.length > 0) {
            const lastExecution = executionHistory[executionHistory.length - 1];
            return lastExecution.modification || null;
        }
        return null;
    }
    /**
     * Get current memory usage in MB
     */
    getCurrentMemoryUsage() {
        const usage = process.memoryUsage();
        return usage.heapUsed / 1024 / 1024;
    }
    /**
     * Get learning statistics
     */
    getLearningStats() {
        const stats = {
            totalPatterns: this.patternTracker['modificationPatterns'].size,
            learnedPatterns: this.patternTracker['learnedPatterns'].length,
            successRate: 0,
            dimensionStats: []
        };
        // Calculate overall success rate
        const allPatterns = Array.from(this.patternTracker['modificationPatterns'].values());
        const totalSuccess = allPatterns.reduce((sum, p) => sum + p.successCount, 0);
        const totalFailure = allPatterns.reduce((sum, p) => sum + p.failureCount, 0);
        const total = totalSuccess + totalFailure;
        stats.successRate = total > 0 ? totalSuccess / total : 0;
        // Get stats for each dimension (0-7)
        for (let dim = 0; dim <= 7; dim++) {
            const execStats = this.patternTracker.getExecutionStats(dim);
            const successRate = this.patternTracker.getSuccessRate(dim);
            stats.dimensionStats.push({
                dimension: dim,
                successRate,
                averageMemory: execStats.averageMemory,
                averageTime: execStats.averageTime,
                totalExecutions: execStats.totalExecutions
            });
        }
        return stats;
    }
    /**
     * Save learned patterns to file
     */
    saveLearnedPatterns() {
        if (!this.learningConfig.patternFile)
            return;
        try {
            const jsonl = this.patternTracker.exportToJSONL();
            fs.writeFileSync(this.learningConfig.patternFile, jsonl, 'utf-8');
            console.log(`💾 Saved learned patterns to: ${this.learningConfig.patternFile}`);
        }
        catch (error) {
            console.warn('⚠️  Failed to save learned patterns:', error);
        }
    }
    /**
     * Cleanup on destruction
     */
    cleanup() {
        // Save patterns before cleanup
        this.saveLearnedPatterns();
        // Note: cleanup method doesn't exist in base class
    }
}
//# sourceMappingURL=learning-automaton.js.map