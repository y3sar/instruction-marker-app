import { useState } from 'react';
import { AppState, Instruction } from '../types';

interface ApplicabilityStepProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
  updateInstructions: (instructions: Instruction[]) => void;
  onNext: () => void;
}

const ApplicabilityStep = ({ appState, setAppState, updateInstructions, onNext }: ApplicabilityStepProps) => {
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
        setParsedInstructions(parsed);
        setError('');
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

  const handleNext = () => {
    if (parsedInstructions.length === 0) {
      setError('Please parse instructions first');
      return;
    }

    // Update app state
    setAppState({
      ...appState,
      query,
      caseDescription,
      instructions: parsedInstructions
    });
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
          <h2 className="text-xl font-semibold mb-4">
            Mark Applicability ({currentInstructionIndex + 1} of {parsedInstructions.length})
          </h2>

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

              <div className="mt-3 text-xs text-gray-500">
                <p><strong>Type:</strong> {currentInstruction.type}</p>
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
