export interface Rubric {
  rubric: string;
  rubric_verifier: string;
  evaluation_result?: 'Yes' | 'No' | 'Not Applicable';
}

export interface Instruction {
  instruction: string;
  rubrics: Rubric[];
  labels: string[];
  applicable: boolean;
  type: 'BUSINESS_LOGIC_DEVELOPER_INSTRUCTIONS' | 'EXPERT_DEVELOPER_INSTRUCTIONS';
}

export interface ModelResponse {
  name: 'Claude' | 'Gemini' | 'OpenAI';
  content: string;
}

export interface AppState {
  query: string;
  caseDescription: string;
  instructions: Instruction[];
  modelResponses: ModelResponse[];
  currentStep: 'applicability' | 'evaluation';
  currentModelIndex: number;
  currentInstructionIndex: number;
}
