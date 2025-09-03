import { useState } from 'react';
import type { AppState } from '../types';

interface ResultsStepProps {
  appState: AppState;
  updateModelEvaluationState: (modelName: 'Claude' | 'Gemini' | 'OpenAI', updates: any) => void;
}

const ResultsStep = ({ appState, updateModelEvaluationState }: ResultsStepProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [importJsonGemini, setImportJsonGemini] = useState('');
  const [importJsonClaude, setImportJsonClaude] = useState('');
  const [importJsonOpenAI, setImportJsonOpenAI] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const validateAndImportEvaluationFor = (modelName: 'Claude' | 'Gemini' | 'OpenAI', raw: string) => {
    try {
      const importedData = JSON.parse(raw);
      
      if (!Array.isArray(importedData)) {
        setImportError('Evaluation JSON must be an array of instructions');
        setImportSuccess('');
        return;
      }

      if (importedData.length !== appState.instructions.length) {
        setImportError(`Instruction count mismatch. Expected ${appState.instructions.length}, got ${importedData.length}`);
        setImportSuccess('');
        return;
      }

      // Check for mismatches and collect them
      const mismatches: Array<{instructionIndex: number, instruction: string, field: string, finalValue: any, importedValue: any}> = [];
      const autoCorrections: Array<{instructionIndex: number, instruction: string, field: string, oldValue: any, newValue: any}> = [];

      for (let i = 0; i < importedData.length; i++) {
        const importedInstruction = importedData[i];
        const originalInstruction = appState.instructions[i];

        if (importedInstruction.instruction !== originalInstruction.instruction) {
          setImportError(`Instruction ${i + 1} text mismatch`);
          setImportSuccess('');
          return;
        }

        if (typeof importedInstruction.applicable !== 'boolean') {
          setImportError(`Instruction ${i + 1} has invalid applicability (must be boolean)`);
          setImportSuccess('');
          return;
        }

        if (!['BUSINESS_LOGIC_DEVELOPER_INSTRUCTIONS','EXPERT_DEVELOPER_INSTRUCTIONS'].includes(importedInstruction.type)) {
          setImportError(`Instruction ${i + 1} has invalid type`);
          setImportSuccess('');
          return;
        }

        // Auto-correct applicability mismatches
        if (importedInstruction.applicable !== originalInstruction.applicable) {
          const oldApplicable = importedInstruction.applicable;
          const newApplicable = originalInstruction.applicable;
          
          // Update the imported instruction to match Final Instruction
          importedInstruction.applicable = newApplicable;
          
          // If Final Instruction is false, set all rubrics to "Not Applicable"
          if (newApplicable === false) {
            importedInstruction.rubrics.forEach((rubric: any) => {
              rubric.evaluation_result = 'Not Applicable';
            });
          }
          
          autoCorrections.push({
            instructionIndex: i,
            instruction: importedInstruction.instruction.substring(0, 50) + '...',
            field: 'applicable',
            oldValue: oldApplicable,
            newValue: newApplicable
          });
        }

        // Check for type mismatch (no auto-correction, just notification)
        if (importedInstruction.type !== originalInstruction.type) {
          mismatches.push({
            instructionIndex: i,
            instruction: importedInstruction.instruction.substring(0, 50) + '...',
            field: 'type',
            finalValue: originalInstruction.type,
            importedValue: importedInstruction.type
          });
        }

        if (!Array.isArray(importedInstruction.rubrics)) {
          setImportError(`Instruction ${i + 1} rubrics must be an array`);
          setImportSuccess('');
          return;
        }

        if (importedInstruction.rubrics.length !== originalInstruction.rubrics.length) {
          setImportError(`Instruction ${i + 1} rubric count mismatch. Expected ${originalInstruction.rubrics.length}, got ${importedInstruction.rubrics.length}`);
          setImportSuccess('');
          return;
        }

        for (let j = 0; j < importedInstruction.rubrics.length; j++) {
          const importedRubric = importedInstruction.rubrics[j];
          const originalRubric = originalInstruction.rubrics[j];

          if (importedRubric.rubric !== originalRubric.rubric) {
            setImportError(`Instruction ${i + 1}, Rubric ${j + 1} text mismatch`);
            setImportSuccess('');
            return;
          }

          if (importedRubric.rubric_verifier !== originalRubric.rubric_verifier) {
            setImportError(`Instruction ${i + 1}, Rubric ${j + 1} verifier mismatch`);
            setImportSuccess('');
            return;
          }

          if (
            importedRubric.evaluation_result !== undefined &&
            !['Yes','No','Not Applicable'].includes(importedRubric.evaluation_result)
          ) {
            setImportError(`Instruction ${i + 1}, Rubric ${j + 1} invalid evaluation_result`);
            setImportSuccess('');
            return;
          }
        }
      }

      updateModelEvaluationState(modelName, {
        currentInstructionIndex: 0,
        currentRubricIndex: 0,
        evaluatedInstructions: importedData
      });

      setImportError('');
      
      // Build success message with auto-corrections and remaining mismatches
      let successMessage = `Imported evaluation for ${modelName}`;
      
      if (autoCorrections.length > 0) {
        successMessage += `. Auto-corrected ${autoCorrections.length} applicability mismatch(es)`;
      }
      
      if (mismatches.length > 0) {
        successMessage += ` with ${mismatches.length} type mismatch(es) to resolve`;
      }
      
      successMessage += '. Review in Evaluation tab.';
      
      setImportSuccess(successMessage);
      setTimeout(() => setImportSuccess(''), 8000); // Show longer for auto-corrections
    } catch (err) {
      setImportError('Invalid JSON format');
      setImportSuccess('');
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
      {/* Import Evaluation JSON - per model */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Import Evaluation JSONs</h2>
        <p className="text-sm text-gray-600 mb-4">
          Paste evaluated instruction JSONs for each model below. We'll validate against the Final Instructions and auto-populate the Evaluation tab.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gemini */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-2">Gemini</h3>
            <textarea
              value={importJsonGemini}
              onChange={(e) => setImportJsonGemini(e.target.value)}
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              placeholder="Paste Gemini evaluated JSON here..."
            />
            <button
              onClick={() => validateAndImportEvaluationFor('Gemini', importJsonGemini)}
              className="mt-2 w-full px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Import Gemini
            </button>
          </div>

          {/* Claude */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-2">Claude</h3>
            <textarea
              value={importJsonClaude}
              onChange={(e) => setImportJsonClaude(e.target.value)}
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              placeholder="Paste Claude evaluated JSON here..."
            />
            <button
              onClick={() => validateAndImportEvaluationFor('Claude', importJsonClaude)}
              className="mt-2 w-full px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Import Claude
            </button>
          </div>

          {/* OpenAI */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-2">OpenAI</h3>
            <textarea
              value={importJsonOpenAI}
              onChange={(e) => setImportJsonOpenAI(e.target.value)}
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              placeholder="Paste OpenAI evaluated JSON here..."
            />
            <button
              onClick={() => validateAndImportEvaluationFor('OpenAI', importJsonOpenAI)}
              className="mt-2 w-full px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Import OpenAI
            </button>
          </div>
        </div>

        {(importError || importSuccess) && (
          <div className="mt-4">
            {importError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-2">
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
        )}
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
    </div>
  );
};

export default ResultsStep;
