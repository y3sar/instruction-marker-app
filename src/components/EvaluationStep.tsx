import { useState } from 'react';
import { AppState, Instruction } from '../types';

interface EvaluationStepProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
  updateModelResponse: (index: number, content: string) => void;
  setCurrentModelIndex: (index: number) => void;
  setCurrentInstructionIndex: (index: number) => void;
}

const EvaluationStep = ({ 
  appState, 
  setAppState, 
  updateModelResponse, 
  setCurrentModelIndex, 
  setCurrentInstructionIndex 
}: EvaluationStepProps) => {
  const [currentModelIndex, setCurrentModelIndexLocal] = useState(0);
  const [currentInstructionIndex, setCurrentInstructionIndexLocal] = useState(0);
  const [currentRubricIndex, setCurrentRubricIndex] = useState(0);

  const currentModel = appState.modelResponses[currentModelIndex];
  const applicableInstructions = appState.instructions.filter(instruction => instruction.applicable);
  const currentInstruction = applicableInstructions[currentInstructionIndex];
  const currentRubric = currentInstruction?.rubrics[currentRubricIndex];

  const updateEvaluationResult = (instructionIndex: number, rubricIndex: number, result: 'Yes' | 'No' | 'Not Applicable') => {
    // Find the actual index in the full instructions array
    const actualInstructionIndex = appState.instructions.findIndex(instruction => 
      instruction === applicableInstructions[instructionIndex]
    );
    
    const updatedInstructions = appState.instructions.map((instruction, i) => {
      if (i === actualInstructionIndex) {
        const updatedRubrics = instruction.rubrics.map((rubric, j) => 
          j === rubricIndex ? { ...rubric, evaluation_result: result } : rubric
        );
        return { ...instruction, rubrics: updatedRubrics };
      }
      return instruction;
    });

    setAppState({
      ...appState,
      instructions: updatedInstructions
    });
  };

  const nextRubric = () => {
    if (currentRubricIndex < currentInstruction.rubrics.length - 1) {
      setCurrentRubricIndex(currentRubricIndex + 1);
    } else if (currentInstructionIndex < applicableInstructions.length - 1) {
      setCurrentInstructionIndexLocal(currentInstructionIndex + 1);
      setCurrentInstructionIndex(currentInstructionIndex + 1);
      setCurrentRubricIndex(0);
    }
  };

  const previousRubric = () => {
    if (currentRubricIndex > 0) {
      setCurrentRubricIndex(currentRubricIndex - 1);
    } else if (currentInstructionIndex > 0) {
      setCurrentInstructionIndexLocal(currentInstructionIndex - 1);
      setCurrentInstructionIndex(currentInstructionIndex - 1);
      setCurrentRubricIndex(applicableInstructions[currentInstructionIndex - 1].rubrics.length - 1);
    }
  };

  const formatModelResponse = (content: string) => {
    // Simple formatting for the model response
    return content.split('\n').map((line, index) => (
      <div key={index} className="mb-1">
        {line.startsWith('###') ? (
          <h3 className="font-semibold text-blue-600 mt-4 mb-2">{line.replace(/^###\s*/, '')}</h3>
        ) : line.startsWith('##') ? (
          <h2 className="font-bold text-gray-800 mt-6 mb-3">{line.replace(/^##\s*/, '')}</h2>
        ) : line.startsWith('#') ? (
          <h1 className="text-xl font-bold text-gray-900 mt-6 mb-3">{line.replace(/^#\s*/, '')}</h1>
        ) : line.startsWith('Entry type:') ? (
          <div className="bg-gray-100 p-2 rounded my-2 font-mono text-sm">{line}</div>
        ) : line.startsWith('Function call:') ? (
          <div className="bg-blue-50 p-2 rounded my-2 font-mono text-sm border-l-4 border-blue-400">{line}</div>
        ) : line.startsWith('Response:') ? (
          <div className="bg-green-50 p-2 rounded my-2 font-mono text-sm border-l-4 border-green-400">{line}</div>
        ) : (
          <span>{line}</span>
        )}
      </div>
    ));
  };

  if (applicableInstructions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Evaluation</h2>
        <p className="text-gray-600">No applicable instructions found. Please complete the applicability step first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Model Responses</h2>
        <div className="flex space-x-2">
          {appState.modelResponses.map((model, index) => (
            <button
              key={model.name}
              onClick={() => {
                setCurrentModelIndexLocal(index);
                setCurrentModelIndex(index);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentModelIndex === index
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {model.name}
            </button>
          ))}
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Response */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">{currentModel.name} Response</h3>
          <div className="space-y-4">
            <textarea
              value={currentModel.content}
              onChange={(e) => updateModelResponse(currentModelIndex, e.target.value)}
              className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder={`Paste ${currentModel.name} response here...`}
            />
            
            {currentModel.content && (
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Formatted Preview:</h4>
                <div className="text-sm max-h-64 overflow-y-auto">
                  {formatModelResponse(currentModel.content)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Evaluation Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">
            Evaluation ({currentInstructionIndex + 1} of {applicableInstructions.length})
          </h3>

          {currentInstruction && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">Current Instruction</h4>
                <p className="text-sm text-gray-700">{currentInstruction.instruction}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <p><strong>Type:</strong> {currentInstruction.type}</p>
                  <p><strong>Labels:</strong> {currentInstruction.labels.join(', ')}</p>
                </div>
              </div>

              <div className="border border-gray-200 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">
                  Rubric {currentRubricIndex + 1} of {currentInstruction.rubrics.length}
                </h4>
                <p className="text-sm text-gray-700 mb-3">{currentRubric.rubric}</p>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`evaluation-${currentInstructionIndex}-${currentRubricIndex}`}
                      checked={currentRubric.evaluation_result === 'Yes'}
                      onChange={() => updateEvaluationResult(currentInstructionIndex, currentRubricIndex, 'Yes')}
                      className="mr-2"
                    />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`evaluation-${currentInstructionIndex}-${currentRubricIndex}`}
                      checked={currentRubric.evaluation_result === 'No'}
                      onChange={() => updateEvaluationResult(currentInstructionIndex, currentRubricIndex, 'No')}
                      className="mr-2"
                    />
                    <span className="text-sm">No</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`evaluation-${currentInstructionIndex}-${currentRubricIndex}`}
                      checked={currentRubric.evaluation_result === 'Not Applicable'}
                      onChange={() => updateEvaluationResult(currentInstructionIndex, currentRubricIndex, 'Not Applicable')}
                      className="mr-2"
                    />
                    <span className="text-sm">Not Applicable</span>
                  </label>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  <p><strong>Verifier:</strong> {currentRubric.rubric_verifier}</p>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={previousRubric}
                  disabled={currentInstructionIndex === 0 && currentRubricIndex === 0}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <button
                  onClick={nextRubric}
                  disabled={currentInstructionIndex === applicableInstructions.length - 1 && currentRubricIndex === currentInstruction.rubrics.length - 1}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationStep;
