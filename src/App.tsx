import { useState } from 'react';
import ApplicabilityStep from './components/ApplicabilityStep';
import EvaluationStep from './components/EvaluationStep';
import ResultsStep from './components/ResultsStep';
import { loadDemoData } from './components/DemoData';
import { AppState, Instruction, ModelResponse } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>({
    query: '',
    caseDescription: '',
    instructions: [],
    modelResponses: [
      { name: 'Claude', content: '' },
      { name: 'Gemini', content: '' },
      { name: 'OpenAI', content: '' }
    ],
    currentStep: 'applicability',
    currentModelIndex: 0,
    currentInstructionIndex: 0
  });

  const updateInstructions = (instructions: Instruction[]) => {
    setAppState(prev => ({ ...prev, instructions }));
  };

  const updateModelResponse = (index: number, content: string) => {
    setAppState(prev => ({
      ...prev,
      modelResponses: prev.modelResponses.map((response, i) => 
        i === index ? { ...response, content } : response
      )
    }));
  };

  const setCurrentStep = (step: 'applicability' | 'evaluation') => {
    setAppState(prev => ({ ...prev, currentStep: step }));
  };

  const setCurrentModelIndex = (index: number) => {
    setAppState(prev => ({ ...prev, currentModelIndex: index }));
  };

  const setCurrentInstructionIndex = (index: number) => {
    setAppState(prev => ({ ...prev, currentInstructionIndex: index }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Instruction Marker App
          </h1>
          <button
            onClick={() => loadDemoData(setAppState)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Load Demo Data
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setCurrentStep('applicability')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                appState.currentStep === 'applicability'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Applicability
            </button>
            <button
              onClick={() => setCurrentStep('evaluation')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                appState.currentStep === 'evaluation'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Evaluation
            </button>
          </div>
        </div>

        {/* Step Content */}
        {appState.currentStep === 'applicability' && (
          <ApplicabilityStep
            appState={appState}
            setAppState={setAppState}
            updateInstructions={updateInstructions}
            onNext={() => setCurrentStep('evaluation')}
          />
        )}

        {appState.currentStep === 'evaluation' && (
          <EvaluationStep
            appState={appState}
            setAppState={setAppState}
            updateModelResponse={updateModelResponse}
            setCurrentModelIndex={setCurrentModelIndex}
            setCurrentInstructionIndex={setCurrentInstructionIndex}
          />
        )}

        {/* Results */}
        <ResultsStep appState={appState} />
      </div>
    </div>
  );
}

export default App;
