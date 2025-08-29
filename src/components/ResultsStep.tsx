import { useState } from 'react';
import type { AppState, Instruction } from '../types';

interface ResultsStepProps {
  appState: AppState;
  updateModelEvaluationState: (modelName: 'Claude' | 'Gemini' | 'OpenAI', updates: any) => void;
}

const ResultsStep = ({ appState, updateModelEvaluationState }: ResultsStepProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importModel, setImportModel] = useState<'Claude' | 'Gemini' | 'OpenAI'>('Gemini');

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const validateAndImportEvaluation = () => {
    try {
      const importedData = JSON.parse(importJson);
      
      // Basic validation
      if (!Array.isArray(importedData)) {
        setImportError('Evaluation JSON must be an array of instructions');
        return;
      }

      // Check if the number of instructions matches
      if (importedData.length !== appState.instructions.length) {
        setImportError(`Instruction count mismatch. Expected ${appState.instructions.length}, got ${importedData.length}`);
        return;
      }

      // Validate each instruction
      for (let i = 0; i < importedData.length; i++) {
        const importedInstruction = importedData[i];
        const originalInstruction = appState.instructions[i];

        // Check instruction text matches
        if (importedInstruction.instruction !== originalInstruction.instruction) {
          setImportError(`Instruction ${i + 1} text mismatch`);
          return;
        }

        // Check applicability matches
        if (importedInstruction.applicable !== originalInstruction.applicable) {
          setImportError(`Instruction ${i + 1} applicability mismatch. Expected ${originalInstruction.applicable}, got ${importedInstruction.applicable}`);
          return;
        }

        // Check rubrics count matches
        if (importedInstruction.rubrics.length !== originalInstruction.rubrics.length) {
          setImportError(`Instruction ${i + 1} rubric count mismatch. Expected ${originalInstruction.rubrics.length}, got ${importedInstruction.rubrics.length}`);
          return;
        }

        // Check each rubric
        for (let j = 0; j < importedInstruction.rubrics.length; j++) {
          const importedRubric = importedInstruction.rubrics[j];
          const originalRubric = originalInstruction.rubrics[j];

          if (importedRubric.rubric !== originalRubric.rubric) {
            setImportError(`Instruction ${i + 1}, Rubric ${j + 1} text mismatch`);
            return;
          }

          if (importedRubric.rubric_verifier !== originalRubric.rubric_verifier) {
            setImportError(`Instruction ${i + 1}, Rubric ${j + 1} verifier mismatch`);
            return;
          }

          // Validate evaluation_result
          if (importedRubric.evaluation_result && 
              !['Yes', 'No', 'Not Applicable'].includes(importedRubric.evaluation_result)) {
            setImportError(`Instruction ${i + 1}, Rubric ${j + 1} has invalid evaluation_result: ${importedRubric.evaluation_result}`);
            return;
          }
        }
      }

      // If validation passes, update the selected model state
      updateModelEvaluationState(importModel, {
        currentInstructionIndex: 0,
        currentRubricIndex: 0,
        evaluatedInstructions: importedData
      });

      setImportSuccess(`Evaluation data imported successfully for ${importModel}! The evaluation state has been updated.`);
      setImportError('');
      setImportJson('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setImportSuccess(''), 5000);

    } catch (err) {
      setImportError('Invalid JSON format');
    }
  };

  const generateFinalInstructionsJson = () => {
    return JSON.stringify(appState.instructions, null, 2);
  };

  const generateEvaluatedInstructionsJson = (modelName: 'Claude' | 'Gemini' | 'OpenAI') => {
    const modelState = appState.modelEvaluationStates[modelName];
    const evaluatedInstructions = modelState.evaluatedInstructions.length > 0 
      ? modelState.evaluatedInstructions 
      : appState.instructions.map(instruction => ({
          ...instruction,
          rubrics: instruction.rubrics.map(rubric => ({
            ...rubric,
            evaluation_result: instruction.applicable ? undefined : 'Not Applicable'
          }))
        }));

    return JSON.stringify(evaluatedInstructions, null, 2);
  };

  const applicableInstructions = appState.instructions.filter(instruction => instruction.applicable);
  const totalInstructions = appState.instructions.length;
  const totalRubrics = applicableInstructions.reduce((sum, instruction) => sum + instruction.rubrics.length, 0);
  
  // Calculate completed rubrics for each model
  const getCompletedRubrics = (modelName: 'Claude' | 'Gemini' | 'OpenAI') => {
    const modelState = appState.modelEvaluationStates[modelName];
    const instructions = modelState.evaluatedInstructions.length > 0 
      ? modelState.evaluatedInstructions 
      : appState.instructions;
    
    return instructions.reduce((sum, instruction) => 
      sum + instruction.rubrics.filter(rubric => rubric.evaluation_result && rubric.evaluation_result !== undefined).length, 0
    );
  };

  return (
    <div className="space-y-6">
      {/* Import Evaluation JSON */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Import Evaluation JSON</h2>
        <p className="text-sm text-gray-600 mb-4">
          Paste an evaluation JSON to automatically populate all model evaluation states. 
          The JSON will be validated against the current instructions and applicability settings.
        </p>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluation JSON
              </label>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Paste evaluation JSON here..."
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Model
              </label>
              <select
                value={importModel}
                onChange={(e) => setImportModel(e.target.value as 'Claude' | 'Gemini' | 'OpenAI')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Gemini">Gemini</option>
                <option value="Claude">Claude</option>
                <option value="OpenAI">OpenAI</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={validateAndImportEvaluation}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Import & Validate
            </button>
            <button
              onClick={() => {
                setImportJson('');
                setImportError('');
                setImportSuccess('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
          
          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm font-medium">Validation Error:</p>
              <p className="text-red-600 text-sm">{importError}</p>
            </div>
          )}
          
          {importSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-green-700 text-sm font-medium">Success:</p>
              <p className="text-green-600 text-sm">{importSuccess}</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Evaluation Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalInstructions}</div>
            <div className="text-sm text-blue-700">Total Instructions</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{applicableInstructions.length}</div>
            <div className="text-sm text-green-700">Applicable Instructions</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{totalRubrics}</div>
            <div className="text-sm text-purple-700">Total Rubrics</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {getCompletedRubrics('Claude') + getCompletedRubrics('Gemini') + getCompletedRubrics('OpenAI')}
            </div>
            <div className="text-sm text-orange-700">Total Completed Rubrics</div>
          </div>
        </div>
      </div>

      {/* Model-specific Rubric Completion */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Rubrics Completed by Model</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['Claude', 'Gemini', 'OpenAI'] as const).map((modelName) => {
            const completedRubrics = getCompletedRubrics(modelName);
            const modelState = appState.modelEvaluationStates[modelName];
            
            return (
              <div key={modelName} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{modelName}</h3>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">{completedRubrics}</div>
                  <div className="text-sm text-gray-600">Rubrics Completed</div>
                  <div className="text-xs text-gray-500">
                    Current: Instruction {modelState.currentInstructionIndex + 1}, Rubric {modelState.currentRubricIndex + 1}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Export Results</h2>
        
        <div className="space-y-4">
          {/* Final Instructions JSON */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-900">Final Instructions JSON</h3>
              <button
                onClick={() => copyToClipboard(generateFinalInstructionsJson(), 'Final Instructions')}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                {copied === 'Final Instructions' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto max-h-32">
              {generateFinalInstructionsJson()}
            </pre>
          </div>

          {/* Model-specific Evaluation JSONs */}
          {(['Claude', 'Gemini', 'OpenAI'] as const).map((modelName) => (
            <div key={modelName} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">{modelName} Evaluated Instructions JSON</h3>
                <button
                  onClick={() => copyToClipboard(generateEvaluatedInstructionsJson(modelName), `${modelName} Evaluation`)}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                >
                  {copied === `${modelName} Evaluation` ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto max-h-32">
                {generateEvaluatedInstructionsJson(modelName)}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Tracking */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Progress Tracking</h2>
        
        <div className="space-y-3">
          {appState.instructions.map((instruction, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Instruction {index + 1}: {instruction.instruction.substring(0, 100)}...
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={`px-2 py-1 text-xs rounded ${
                      instruction.applicable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {instruction.applicable ? 'Applicable' : 'Not Applicable'}
                    </span>
                    <span className="text-xs text-gray-500">{instruction.type}</span>
                  </div>
                </div>
              </div>
              
              {instruction.applicable && (
                <div className="space-y-1">
                  {instruction.rubrics.map((rubric, rubricIndex) => (
                    <div key={rubricIndex} className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-500">Rubric {rubricIndex + 1}:</span>
                      <span className={`px-2 py-1 rounded ${
                        rubric.evaluation_result === 'Yes' 
                          ? 'bg-green-100 text-green-800'
                          : rubric.evaluation_result === 'No'
                          ? 'bg-red-100 text-red-800'
                          : rubric.evaluation_result === 'Not Applicable'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {rubric.evaluation_result || 'Not Evaluated'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsStep;
