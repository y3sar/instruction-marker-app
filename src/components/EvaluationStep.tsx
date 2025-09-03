import { useState } from 'react';
import type { AppState, Instruction, ModelEvaluationState } from '../types';

interface EvaluationStepProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
  updateModelResponse: (index: number, content: string) => void;
  setCurrentModelIndex: (index: number) => void;
  updateModelEvaluationState: (modelName: 'Claude' | 'Gemini' | 'OpenAI', updates: Partial<ModelEvaluationState>) => void;
}

const EvaluationStep = ({ 
  appState, 
  setAppState, 
  updateModelResponse, 
  setCurrentModelIndex, 
  updateModelEvaluationState 
}: EvaluationStepProps) => {
  const [currentModelIndex, setCurrentModelIndexLocal] = useState(0);

  // Reorder models to: Gemini, Claude, OpenAI
  const modelOrder = ['Gemini', 'Claude', 'OpenAI'] as const;
  const currentModelName = modelOrder[currentModelIndex];
  const currentModel = appState.modelResponses.find(m => m.name === currentModelName)!;
  const currentModelState = appState.modelEvaluationStates[currentModelName];
  
  const applicableInstructions = appState.instructions.filter(instruction => instruction.applicable);
  const currentInstruction = applicableInstructions[currentModelState.currentInstructionIndex];
  
  // In order to compare/edit we need the actual index into the full instructions array
  const actualInstructionIndex = appState.instructions.findIndex(instruction => 
    instruction.instruction === currentInstruction?.instruction
  );

  // Get the current rubric from evaluated instructions, fallback to original instructions if needed
  const currentEvaluatedInstruction = currentModelState.evaluatedInstructions.find(instruction => 
    instruction?.instruction === currentInstruction?.instruction
  );
  
  const instructionToUse = currentEvaluatedInstruction || currentInstruction;
  const currentRubric = instructionToUse?.rubrics[currentModelState.currentRubricIndex];

  // Mismatch detection (applicability/type) between imported evaluation and Final Instructions
  const baseInstruction = actualInstructionIndex >= 0 ? appState.instructions[actualInstructionIndex] : undefined;
  
  // Only check for mismatches if we have imported evaluation data (not just the default state)
  const hasImportedEvaluationData = currentModelState.evaluatedInstructions.length > 0 && 
    currentModelState.evaluatedInstructions.some(instruction => 
      instruction.rubrics.some(rubric => rubric.evaluation_result !== undefined)
    );
  
  // Only check for type mismatches since applicability is auto-corrected
  const hasTypeMismatch = hasImportedEvaluationData && baseInstruction && instructionToUse && 
    baseInstruction.type !== instructionToUse.type;

  // Find all instructions with type mismatches to show them in evaluation
  const instructionsWithMismatches = hasImportedEvaluationData ? 
    appState.instructions.filter((instruction, index) => {
      const evaluatedInstruction = currentModelState.evaluatedInstructions[index];
      return evaluatedInstruction && instruction.type !== evaluatedInstruction.type;
    }) : [];

  // Show mismatched instructions first, then applicable instructions
  const instructionsToShow = [...instructionsWithMismatches, ...applicableInstructions.filter(instruction => 
    !instructionsWithMismatches.some(mismatched => mismatched.instruction === instruction.instruction)
  )];
  
  const currentInstructionToShow = instructionsToShow[currentModelState.currentInstructionIndex];
  
  // Update actual instruction index for the current instruction being shown
  const actualInstructionIndexToShow = appState.instructions.findIndex(instruction => 
    instruction.instruction === currentInstructionToShow?.instruction
  );
  
  // Get the current rubric from evaluated instructions for the instruction being shown
  const currentEvaluatedInstructionToShow = currentModelState.evaluatedInstructions.find(instruction => 
    instruction?.instruction === currentInstructionToShow?.instruction
  );
  
  const instructionToUseToShow = currentEvaluatedInstructionToShow || currentInstructionToShow;
  const currentRubricToShow = instructionToUseToShow?.rubrics[currentModelState.currentRubricIndex];

  // Mismatch detection for the instruction being shown (only type mismatches)
  const baseInstructionToShow = actualInstructionIndexToShow >= 0 ? appState.instructions[actualInstructionIndexToShow] : undefined;
  const hasTypeMismatchToShow = hasImportedEvaluationData && baseInstructionToShow && instructionToUseToShow && 
    baseInstructionToShow.type !== instructionToUseToShow.type;

  const updateBaseInstructionField = (idx: number, updates: Partial<Pick<Instruction,'applicable'|'type'>>) => {
    const nextInstructions = appState.instructions.map((instr, i) => 
      i === idx ? { ...instr, ...updates } : instr
    );
    setAppState({ ...appState, instructions: nextInstructions });
  };

  const updateEvaluationResult = (instructionIndex: number, rubricIndex: number, result: 'Yes' | 'No' | 'Not Applicable') => {
    // Map instructionIndex within instructionsToShow to actual index in full instructions
    const targetInstruction = instructionsToShow[instructionIndex];
    const actualIndex = appState.instructions.findIndex(ins => ins.instruction === targetInstruction.instruction);
    
    const updatedEvaluatedInstructions = currentModelState.evaluatedInstructions.map((instruction, i) => {
      if (i === actualIndex) {
        const updatedRubrics = instruction.rubrics.map((rubric, j) => 
          j === rubricIndex ? { ...rubric, evaluation_result: result } : rubric
        );
        return { ...instruction, rubrics: updatedRubrics };
      }
      return instruction;
    });

    updateModelEvaluationState(currentModelName, {
      evaluatedInstructions: updatedEvaluatedInstructions
    });
  };

  const nextRubric = () => {
    if (currentInstructionToShow && currentModelState.currentRubricIndex < currentInstructionToShow.rubrics.length - 1) {
      updateModelEvaluationState(currentModelName, {
        currentRubricIndex: currentModelState.currentRubricIndex + 1
      });
    } else if (currentModelState.currentInstructionIndex < instructionsToShow.length - 1) {
      updateModelEvaluationState(currentModelName, {
        currentInstructionIndex: currentModelState.currentInstructionIndex + 1,
        currentRubricIndex: 0
      });
    }
  };

  const previousRubric = () => {
    if (currentModelState.currentRubricIndex > 0) {
      updateModelEvaluationState(currentModelName, {
        currentRubricIndex: currentModelState.currentRubricIndex - 1
      });
    } else if (currentModelState.currentInstructionIndex > 0) {
      const prevInstruction = instructionsToShow[currentModelState.currentInstructionIndex - 1];
      updateModelEvaluationState(currentModelName, {
        currentInstructionIndex: currentModelState.currentInstructionIndex - 1,
        currentRubricIndex: prevInstruction.rubrics.length - 1
      });
    }
  };

  const formatModelResponse = (content: string) => {
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

  if (instructionsToShow.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Evaluation</h2>
        <p className="text-gray-600">No instructions to evaluate. Please complete the applicability step first.</p>
      </div>
    );
  }

  if (!currentInstructionToShow || !currentRubricToShow) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Evaluation</h2>
        <p className="text-gray-600">Loading evaluation data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Model Responses</h2>
        <div className="flex space-x-2">
          {modelOrder.map((modelName, index) => (
            <button
              key={modelName}
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
              {modelName}
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
              onChange={(e) => updateModelResponse(appState.modelResponses.findIndex(m => m.name === currentModelName), e.target.value)}
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
            {currentModel.name} Evaluation ({currentModelState.currentInstructionIndex + 1} of {instructionsToShow.length})
          </h3>

          <div className="space-y-4">
            <div className={`p-4 rounded-md ${hasTypeMismatchToShow ? 'border border-red-300 bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Current Instruction</h4>
                  <p className="text-sm text-gray-700">{currentInstructionToShow.instruction}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    <p><strong>Type:</strong> {baseInstructionToShow?.type}</p>
                    <p><strong>Labels:</strong> {currentInstructionToShow.labels.join(', ')}</p>
                    <p><strong>Applicable:</strong> {String(baseInstructionToShow?.applicable)}</p>
                  </div>
                </div>

                {hasTypeMismatchToShow && baseInstructionToShow && instructionToUseToShow && (
                  <div className="ml-4 w-80">
                    <div className="text-sm font-medium text-red-700 mb-3">Mismatch detected - Choose which value to keep:</div>
                    
                    {/* Type Radio Buttons */}
                    <div className="p-3 border border-red-200 rounded bg-red-50">
                      <div className="text-sm font-medium text-red-800 mb-2">Type:</div>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`type-${actualInstructionIndexToShow}`}
                            checked={baseInstructionToShow.type === 'BUSINESS_LOGIC_DEVELOPER_INSTRUCTIONS'}
                            onChange={() => updateBaseInstructionField(actualInstructionIndexToShow, { type: 'BUSINESS_LOGIC_DEVELOPER_INSTRUCTIONS' })}
                            className="mr-2"
                          />
                          <span className="text-sm">Final Instruction Type: <strong>BUSINESS_LOGIC_DEVELOPER_INSTRUCTIONS</strong></span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`type-${actualInstructionIndexToShow}`}
                            checked={baseInstructionToShow.type === 'EXPERT_DEVELOPER_INSTRUCTIONS'}
                            onChange={() => updateBaseInstructionField(actualInstructionIndexToShow, { type: 'EXPERT_DEVELOPER_INSTRUCTIONS' })}
                            className="mr-2"
                          />
                          <span className="text-sm">Evaluation JSON Type: <strong>{instructionToUseToShow.type}</strong></span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-gray-200 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">
                Rubric {currentModelState.currentRubricIndex + 1} of {currentInstructionToShow.rubrics.length}
              </h4>
              <p className="text-sm text-gray-700 mb-3">{currentRubricToShow.rubric}</p>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`evaluation-${currentModelName}-${currentModelState.currentInstructionIndex}-${currentModelState.currentRubricIndex}`}
                    checked={currentRubricToShow.evaluation_result === 'Yes'}
                    onChange={() => updateEvaluationResult(currentModelState.currentInstructionIndex, currentModelState.currentRubricIndex, 'Yes')}
                    className="mr-2"
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`evaluation-${currentModelName}-${currentModelState.currentInstructionIndex}-${currentModelState.currentRubricIndex}`}
                    checked={currentRubricToShow.evaluation_result === 'No'}
                    onChange={() => updateEvaluationResult(currentModelState.currentInstructionIndex, currentModelState.currentRubricIndex, 'No')}
                    className="mr-2"
                  />
                  <span className="text-sm">No</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`evaluation-${currentModelName}-${currentModelState.currentInstructionIndex}-${currentModelState.currentRubricIndex}`}
                    checked={currentRubricToShow.evaluation_result === 'Not Applicable'}
                    onChange={() => updateEvaluationResult(currentModelState.currentInstructionIndex, currentModelState.currentRubricIndex, 'Not Applicable')}
                    className="mr-2"
                  />
                  <span className="text-sm">Not Applicable</span>
                </label>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                <p><strong>Verifier:</strong> {currentRubricToShow.rubric_verifier}</p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={previousRubric}
                disabled={currentModelState.currentInstructionIndex === 0 && currentModelState.currentRubricIndex === 0}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <button
                onClick={nextRubric}
                disabled={currentModelState.currentInstructionIndex === instructionsToShow.length - 1 && currentModelState.currentRubricIndex === currentInstructionToShow.rubrics.length - 1}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationStep;