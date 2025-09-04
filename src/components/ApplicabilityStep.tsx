import { useState } from 'react';
import type { AppState, Instruction } from '../types';

interface ApplicabilityStepProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
  updateInstructions: (instructions: Instruction[]) => void;
  onNext: () => void;
  onStartTimer: () => void;
  timerActive: boolean;
}

const ApplicabilityStep = ({ appState, setAppState, updateInstructions, onNext, onStartTimer, timerActive }: ApplicabilityStepProps) => {
  const [query, setQuery] = useState(appState.query);
  const [caseDescription, setCaseDescription] = useState(appState.caseDescription);
  const [instructionsJson, setInstructionsJson] = useState('');
  const [parsedInstructions, setParsedInstructions] = useState<Instruction[]>([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [error, setError] = useState('');

  const parseInstructions = () => {
    try {
      const parsed = JSON.parse(instructionsJson);
      if (Array.isArray(parsed)) {
        // Ensure each instruction has a type, defaulting to BUSINESS_LOGIC_DEVELOPER_INSTRUCTIONS if not present
        const instructionsWithType = parsed.map(instruction => ({
          ...instruction,
          type: instruction.type || 'BUSINESS_LOGIC_DEVELOPER_INSTRUCTIONS'
        }));
        
        setParsedInstructions(instructionsWithType);
        setError('');
        
        // Start timer when instructions are successfully parsed
        if (!timerActive) {
          onStartTimer();
        }
      } else {
        setError('Instructions must be an array');
      }
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  const updateApplicability = (index: number, applicable: boolean) => {
    const updated = parsedInstructions.map((instruction, i) => 
      i === index ? { ...instruction, applicable } : instruction
    );
    setParsedInstructions(updated);
  };

  const updateInstructionType = (index: number, type: 'BUSINESS_LOGIC_DEVELOPER_INSTRUCTIONS' | 'EXPERT_DEVELOPER_INSTRUCTIONS') => {
    const updated = parsedInstructions.map((instruction, i) => 
      i === index ? { ...instruction, type } : instruction
    );
    setParsedInstructions(updated);
  };

  const handleNext = () => {
    if (parsedInstructions.length === 0) {
      setError('Please parse instructions first');
      return;
    }

    // Initialize evaluation states for all models
    const initializedInstructions = parsedInstructions.map(instruction => ({
      ...instruction,
      rubrics: instruction.rubrics.map(rubric => ({
        ...rubric,
        evaluation_result: instruction.applicable ? undefined : ('Not Applicable' as const)
      }))
    }));

    // Update app state with proper initialization
    const updatedAppState = {
      ...appState,
      query,
      caseDescription,
      instructions: parsedInstructions,
      modelEvaluationStates: {
        Claude: {
          currentInstructionIndex: 0,
          currentRubricIndex: 0,
          evaluatedInstructions: initializedInstructions
        },
        Gemini: {
          currentInstructionIndex: 0,
          currentRubricIndex: 0,
          evaluatedInstructions: initializedInstructions
        },
        OpenAI: {
          currentInstructionIndex: 0,
          currentRubricIndex: 0,
          evaluatedInstructions: initializedInstructions
        }
      }
    };

    setAppState(updatedAppState);
    updateInstructions(parsedInstructions);
    onNext();
  };

  const currentInstruction = parsedInstructions[currentInstructionIndex];

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Input Data</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste the query here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case Description
            </label>
            <textarea
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste the case description here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions JSON
            </label>
            <textarea
              value={instructionsJson}
              onChange={(e) => setInstructionsJson(e.target.value)}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Paste the instructions JSON here..."
            />
            <button
              onClick={parseInstructions}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Parse Instructions
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        </div>
      </div>

      {/* Applicability Marking */}
      {parsedInstructions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Mark Applicability ({currentInstructionIndex + 1} of {parsedInstructions.length})
            </h2>
            {timerActive && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Timer Active</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Query & Context</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>Query:</strong> {query}</p>
                <p><strong>Case Description:</strong> {caseDescription}</p>
              </div>
            </div>

            <div className="border border-gray-200 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Current Instruction</h3>
              <p className="text-sm text-gray-700 mb-3">{currentInstruction.instruction}</p>
              
              {/* Show rubrics */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">Rubrics ({currentInstruction.rubrics.length}):</h4>
                <div className="space-y-2">
                  {currentInstruction.rubrics.map((rubric, rubricIndex) => (
                    <div key={rubricIndex} className="bg-gray-50 p-3 rounded border-l-4 border-gray-300">
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Rubric {rubricIndex + 1}:</strong> {rubric.rubric}
                      </p>
                      <p className="text-xs text-gray-500">
                        <strong>Verifier:</strong> {rubric.rubric_verifier}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`applicable-${currentInstructionIndex}`}
                    checked={currentInstruction.applicable === true}
                    onChange={() => updateApplicability(currentInstructionIndex, true)}
                    className="mr-2"
                  />
                  <span className="text-sm">Applicable (true)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`applicable-${currentInstructionIndex}`}
                    checked={currentInstruction.applicable === false}
                    onChange={() => updateApplicability(currentInstructionIndex, false)}
                    className="mr-2"
                  />
                  <span className="text-sm">Not Applicable (false)</span>
                </label>
              </div>

              {/* User Confirmation Checkbox */}
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={currentInstruction.labels.includes('User Confirmation')}
                    onChange={(e) => {
                      const updated = parsedInstructions.map((instruction, i) => {
                        if (i === currentInstructionIndex) {
                          const newLabels = e.target.checked
                            ? [...instruction.labels, 'User Confirmation']
                            : instruction.labels.filter(label => label !== 'User Confirmation');
                          return { ...instruction, labels: newLabels };
                        }
                        return instruction;
                      });
                      setParsedInstructions(updated);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">User Confirmation</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Check this box to add "User Confirmation" to the instruction labels
                </p>
              </div>

              {/* Instruction Type Dropdown */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instruction Type
                </label>
                <select
                  value={currentInstruction.type}
                  onChange={(e) => updateInstructionType(currentInstructionIndex, e.target.value as 'BUSINESS_LOGIC_DEVELOPER_INSTRUCTIONS' | 'EXPERT_DEVELOPER_INSTRUCTIONS')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="BUSINESS_LOGIC_DEVELOPER_INSTRUCTIONS">Business Logic Developer Instructions</option>
                  <option value="EXPERT_DEVELOPER_INSTRUCTIONS">Expert Developer Instructions</option>
                </select>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                <p><strong>Labels:</strong> {currentInstruction.labels.join(', ')}</p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentInstructionIndex(Math.max(0, currentInstructionIndex - 1))}
                disabled={currentInstructionIndex === 0}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentInstructionIndex < parsedInstructions.length - 1 ? (
                <button
                  onClick={() => setCurrentInstructionIndex(currentInstructionIndex + 1)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Next Instruction
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Complete & Continue to Evaluation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicabilityStep;
