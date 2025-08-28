import { useState } from 'react';
import { AppState } from '../types';

interface ResultsStepProps {
  appState: AppState;
}

const ResultsStep = ({ appState }: ResultsStepProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const generateFinalInstructionsJson = () => {
    return JSON.stringify(appState.instructions, null, 2);
  };

  const generateEvaluatedInstructionsJson = (modelName: string) => {
    // Create a copy of instructions with evaluation results
    const evaluatedInstructions = appState.instructions.map(instruction => ({
      ...instruction,
      rubrics: instruction.rubrics.map(rubric => ({
        ...rubric,
        evaluation_result: instruction.applicable ? (rubric.evaluation_result || 'Not Applicable') : 'Not Applicable'
      }))
    }));

    return JSON.stringify(evaluatedInstructions, null, 2);
  };

  const applicableInstructions = appState.instructions.filter(instruction => instruction.applicable);
  const totalInstructions = appState.instructions.length;
  const totalRubrics = applicableInstructions.reduce((sum, instruction) => sum + instruction.rubrics.length, 0);
  const completedRubrics = applicableInstructions.reduce((sum, instruction) => 
    sum + instruction.rubrics.filter(rubric => rubric.evaluation_result).length, 0
  );

  return (
    <div className="space-y-6">
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
            <div className="text-2xl font-bold text-orange-600">{completedRubrics}</div>
            <div className="text-sm text-orange-700">Completed Rubrics</div>
          </div>
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
          {appState.modelResponses.map((model, index) => (
            <div key={model.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">{model.name} Evaluated Instructions JSON</h3>
                <button
                  onClick={() => copyToClipboard(generateEvaluatedInstructionsJson(model.name), `${model.name} Evaluation`)}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                >
                  {copied === `${model.name} Evaluation` ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto max-h-32">
                {generateEvaluatedInstructionsJson(model.name)}
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
