import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Save, Trash2, Plus, RotateCcw, Zap, Info } from 'lucide-react';

interface QuantumGate {
  id: string;
  type: 'X' | 'Y' | 'Z' | 'H' | 'CNOT' | 'SWAP' | 'MEASURE';
  position: { qubit: number; time: number };
  params?: any;
}

interface QuantumCircuit {
  id: string;
  name: string;
  qubits: number;
  gates: QuantumGate[];
}

interface CircuitBuilderProps {
  className?: string;
}

const CircuitBuilder: React.FC<CircuitBuilderProps> = ({ className = '' }) => {
  const [circuit, setCircuit] = useState<QuantumCircuit>({
    id: 'circuit-1',
    name: 'Quantum Circuit',
    qubits: 3,
    gates: []
  });
  
  const [selectedGate, setSelectedGate] = useState<QuantumGate['type']>('H');
  const [selectedTime, setSelectedTime] = useState(0);
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any[]>([]);

  const gateTypes: QuantumGate['type'][] = ['X', 'Y', 'Z', 'H', 'CNOT', 'SWAP', 'MEASURE'];
  
  const gateInfo: Record<QuantumGate['type'], { name: string; description: string; color: string }> = {
    'X': { name: 'Pauli-X', description: 'Bit flip gate', color: 'bg-red-500' },
    'Y': { name: 'Pauli-Y', description: 'Bit and phase flip', color: 'bg-green-500' },
    'Z': { name: 'Pauli-Z', description: 'Phase flip gate', color: 'bg-blue-500' },
    'H': { name: 'Hadamard', description: 'Superposition gate', color: 'bg-purple-500' },
    'CNOT': { name: 'CNOT', description: 'Controlled NOT', color: 'bg-orange-500' },
    'SWAP': { name: 'SWAP', description: 'Swap qubits', color: 'bg-teal-500' },
    'MEASURE': { name: 'Measure', description: 'Measure qubit', color: 'bg-gray-500' }
  };

  const addGate = useCallback(() => {
    const newGate: QuantumGate = {
      id: `gate-${Date.now()}`,
      type: selectedGate,
      position: { qubit: selectedQubit, time: selectedTime }
    };

    setCircuit(prev => ({
      ...prev,
      gates: [...prev.gates.filter(g => 
        !(g.position.qubit === selectedQubit && g.position.time === selectedTime)
      ), newGate]
    }));
  }, [selectedGate, selectedQubit, selectedTime]);

  const removeGate = useCallback((gateId: string) => {
    setCircuit(prev => ({
      ...prev,
      gates: prev.gates.filter(g => g.id !== gateId)
    }));
  }, []);

  const clearCircuit = useCallback(() => {
    setCircuit(prev => ({ ...prev, gates: [] }));
    setSimulationResults([]);
  }, []);

  const simulateCircuit = useCallback(async () => {
    setIsSimulating(true);
    setSimulationResults([]);

    // Simulate quantum circuit execution
    const steps = circuit.gates.length;
    const results = [];

    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const currentGates = circuit.gates.slice(0, i);
      const state = simulateQuantumState(currentGates, circuit.qubits);
      
      results.push({
        step: i,
        state,
        gates: currentGates,
        probabilities: state.map((amp: any) => Math.abs(amp) ** 2)
      });
    }

    setSimulationResults(results);
    setIsSimulating(false);
  }, [circuit]);

  const simulateQuantumState = (gates: QuantumGate[], numQubits: number) => {
    // Simplified quantum state simulation
    const dimension = 2 ** numQubits;
    const state = new Array(dimension).fill(0);
    state[0] = 1; // Start with |000...⟩

    // Apply gates (simplified)
    gates.forEach(gate => {
      if (gate.type === 'H' && gate.position.qubit === 0) {
        state[0] = 1 / Math.sqrt(2);
        state[1] = 1 / Math.sqrt(2);
      } else if (gate.type === 'X' && gate.position.qubit === 0) {
        [state[0], state[1]] = [state[1], state[0]];
      }
      // Add more gate operations as needed
    });

    return state;
  };

  const addQubit = useCallback(() => {
    setCircuit(prev => ({ ...prev, qubits: prev.qubits + 1 }));
  }, []);

  const removeQubit = useCallback(() => {
    setCircuit(prev => ({ 
      ...prev, 
      qubits: Math.max(1, prev.qubits - 1),
      gates: prev.gates.filter(g => g.position.qubit < prev.qubits - 1)
    }));
  }, []);

  const maxTime = Math.max(5, ...circuit.gates.map(g => g.position.time)) + 2;

  return (
    <div className={`p-6 bg-gray-800 rounded-xl shadow-xl ${className}`} data-testid="circuit-builder">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <Zap className="w-6 h-6 text-purple-400" />
          Quantum Circuit Builder
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={simulateCircuit}
            disabled={isSimulating || circuit.gates.length === 0}
            className="control-button bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            {isSimulating ? <Play className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
            {isSimulating ? 'Simulating...' : 'Simulate'}
          </button>
          
          <button
            onClick={clearCircuit}
            className="control-button bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Circuit Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            {/* Qubit Lines */}
            <div className="min-w-max">
              {Array.from({ length: circuit.qubits }, (_, qubitIndex) => (
                <div key={qubitIndex} className="flex items-center mb-4">
                  <div className="w-16 text-white text-sm font-mono">
                    q{qubitIndex}
                  </div>
                  
                  {/* Wire */}
                  <div className="flex-1 h-0.5 bg-gray-600 relative">
                    {/* Time steps */}
                    {Array.from({ length: maxTime }, (_, timeIndex) => (
                      <div key={timeIndex} className="absolute top-1/2 transform -translate-y-1/2" style={{ left: `${(timeIndex / maxTime) * 100}%` }}>
                        <div className="w-px h-4 bg-gray-500" />
                      </div>
                    ))}
                    
                    {/* Gates */}
                    {circuit.gates
                      .filter(gate => gate.position.qubit === qubitIndex)
                      .map(gate => (
                        <motion.div
                          key={gate.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer"
                          style={{ 
                            left: `${(gate.position.time / maxTime) * 100}%`,
                            marginLeft: '-20px'
                          }}
                          onClick={() => removeGate(gate.id)}
                        >
                          <div className={`w-10 h-10 ${gateInfo[gate.type].color} rounded-lg flex items-center justify-center text-white font-bold text-xs hover:scale-110 transition-transform`}>
                            {gate.type}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Multi-qubit gates (CNOT, SWAP) */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {circuit.gates.map(gate => {
                if (gate.type === 'CNOT' && gate.position.qubit < circuit.qubits - 1) {
                  const x1 = ((gate.position.time / maxTime) * 100) + 6.67; // Adjust for positioning
                  const y1 = (gate.position.qubit * 64) + 32; // Approximate position
                  const y2 = ((gate.position.qubit + 1) * 64) + 32;
                  
                  return (
                    <g key={gate.id}>
                      <line
                        x1={`${x1}%`}
                        y1={y1}
                        x2={`${x1}%`}
                        y2={y2}
                        stroke="#f97316"
                        strokeWidth="2"
                      />
                      <circle
                        cx={`${x1}%`}
                        cy={y1}
                        r="4"
                        fill="#f97316"
                      />
                      <circle
                        cx={`${x1}%`}
                        cy={y2}
                        r="4"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2"
                      />
                    </g>
                  );
                }
                return null;
              })}
            </svg>
          </div>

          {/* Simulation Results */}
          {simulationResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-gray-700/50 rounded-lg p-4"
            >
              <h4 className="text-lg font-semibold text-white mb-3">Simulation Results</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {simulationResults.map((result, index) => (
                  <div key={index} className="bg-gray-800 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Step {result.step}</span>
                      <span className="text-gray-400 text-sm">
                        {result.gates.length} gate{result.gates.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {result.probabilities.map((prob: number, i: number) => (
                        <div key={i} className="text-xs bg-gray-700 rounded px-2 py-1">
                          |{i.toString(2).padStart(circuit.qubits, '0')}⟩: {(prob * 100).toFixed(1)}%
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Gate Selection */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Gate Selection</h4>
            <div className="grid grid-cols-2 gap-2">
              {gateTypes.map(gateType => (
                <button
                  key={gateType}
                  onClick={() => setSelectedGate(gateType)}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    selectedGate === gateType
                      ? `${gateInfo[gateType].color} text-white`
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  <div className="font-bold">{gateType}</div>
                  <div className="text-xs opacity-75">{gateInfo[gateType].name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Position Controls */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Position</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Qubit</label>
                <select
                  value={selectedQubit}
                  onChange={(e) => setSelectedQubit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg"
                >
                  {Array.from({ length: circuit.qubits }, (_, i) => (
                    <option key={i} value={i}>q{i}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Time Step</label>
                <input
                  type="range"
                  min="0"
                  max={maxTime - 1}
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-white text-sm">{selectedTime}</div>
              </div>
              
              <button
                onClick={addGate}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Gate
              </button>
            </div>
          </div>

          {/* Qubit Management */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Qubits</h4>
            <div className="flex items-center justify-between">
              <span className="text-white">{circuit.qubits} qubits</span>
              <div className="flex gap-2">
                <button
                  onClick={addQubit}
                  className="p-1 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={removeQubit}
                  disabled={circuit.qubits <= 1}
                  className="p-1 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Gate Info */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Gate Info
            </h4>
            <div className="text-sm text-gray-300">
              <div className="font-medium text-white mb-1">{gateInfo[selectedGate].name}</div>
              <div>{gateInfo[selectedGate].description}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircuitBuilder;