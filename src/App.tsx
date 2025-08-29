import { useState, useEffect, useRef } from 'react';
import ApplicabilityStep from './components/ApplicabilityStep';
import EvaluationStep from './components/EvaluationStep';
import ResultsStep from './components/ResultsStep';
import { loadDemoData } from './components/DemoData';
import type { AppState, Instruction, ModelResponse, ModelEvaluationState } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>({
    query: '',
    caseDescription: '',
    instructions: [],
    modelResponses: [
      { name: 'Gemini', content: '' },
      { name: 'Claude', content: '' },
      { name: 'OpenAI', content: '' }
    ],
    modelEvaluationStates: {
      Claude: {
        currentInstructionIndex: 0,
        currentRubricIndex: 0,
        evaluatedInstructions: []
      },
      Gemini: {
        currentInstructionIndex: 0,
        currentRubricIndex: 0,
        evaluatedInstructions: []
      },
      OpenAI: {
        currentInstructionIndex: 0,
        currentRubricIndex: 0,
        evaluatedInstructions: []
      }
    },
    currentStep: 'applicability',
    currentModelIndex: 0
  });

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Timer effect
  useEffect(() => {
    if (timerActive && !taskCompleted) {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Date.now() - startTimeRef.current);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, taskCompleted]);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    setTimerActive(true);
    setTaskCompleted(false);
  };

  const stopTimer = () => {
    setTimerActive(false);
    setTaskCompleted(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const updateInstructions = (instructions: Instruction[]) => {
    setAppState(prev => ({ 
      ...prev, 
      instructions,
      // Reset all model evaluation states when instructions change
      modelEvaluationStates: {
        Claude: {
          currentInstructionIndex: 0,
          currentRubricIndex: 0,
          evaluatedInstructions: instructions.map(instruction => ({
            ...instruction,
            rubrics: instruction.rubrics.map(rubric => ({
              ...rubric,
              evaluation_result: instruction.applicable ? undefined : 'Not Applicable'
            }))
          }))
        },
        Gemini: {
          currentInstructionIndex: 0,
          currentRubricIndex: 0,
          evaluatedInstructions: instructions.map(instruction => ({
            ...instruction,
            rubrics: instruction.rubrics.map(rubric => ({
              ...rubric,
              evaluation_result: instruction.applicable ? undefined : 'Not Applicable'
            }))
          }))
        },
        OpenAI: {
          currentInstructionIndex: 0,
          currentRubricIndex: 0,
          evaluatedInstructions: instructions.map(instruction => ({
            ...instruction,
            rubrics: instruction.rubrics.map(rubric => ({
              ...rubric,
              evaluation_result: instruction.applicable ? undefined : 'Not Applicable'
            }))
          }))
        }
      }
    }));
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

  const updateModelEvaluationState = (modelName: 'Claude' | 'Gemini' | 'OpenAI', updates: Partial<ModelEvaluationState>) => {
    setAppState(prev => ({
      ...prev,
      modelEvaluationStates: {
        ...prev.modelEvaluationStates,
        [modelName]: {
          ...prev.modelEvaluationStates[modelName],
          ...updates
        }
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Timer Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Task Timer
              </h2>
              <div className="text-4xl font-mono font-bold text-blue-600">
                {formatTime(elapsedTime)}
              </div>
            </div>
            <div className="space-y-2">
              {!taskCompleted && (
                <button
                  onClick={stopTimer}
                  className="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
                >
                  Stop Task
                </button>
              )}
              {taskCompleted && (
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Task Completed</div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatTime(elapsedTime)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
            onStartTimer={startTimer}
            timerActive={timerActive}
          />
        )}

        {appState.currentStep === 'evaluation' && (
          <EvaluationStep
            appState={appState}
            setAppState={setAppState}
            updateModelResponse={updateModelResponse}
            setCurrentModelIndex={setCurrentModelIndex}
            updateModelEvaluationState={updateModelEvaluationState}
          />
        )}

        {/* Results */}
        <ResultsStep appState={appState} updateModelEvaluationState={updateModelEvaluationState} />
      </div>
    </div>
  );
}

export default App;
