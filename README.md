# Instruction Marker App

A React application for marking instruction applicability and evaluating model responses against instruction rubrics.

## Features

### 1. Applicability Marking
- Input query and case description
- Parse instructions JSON
- Mark each instruction as applicable (true/false)
- Navigate through instructions with previous/next buttons

### 2. Evaluation Step
- Input model responses (Claude, Gemini, OpenAI)
- Split view showing model response and evaluation panel
- Evaluate each rubric with Yes/No/Not Applicable
- Automatic formatting of model responses
- Progress tracking through applicable instructions

### 3. Results Export
- Summary statistics (total instructions, applicable instructions, rubrics, completed rubrics)
- Export final instructions JSON with applicability marked
- Export evaluated instructions JSON for each model
- Progress tracking with visual indicators
- Copy to clipboard functionality

## User Flow

### Step 1: Applicability Marking
1. Paste the query in the query text box
2. Paste the case description in the case description text box
3. Paste the instructions JSON in the instructions text box
4. Click "Parse Instructions" to load the instructions
5. For each instruction, mark whether it's applicable (true/false)
6. Navigate through all instructions using Previous/Next buttons
7. Click "Complete & Continue to Evaluation" when done

### Step 2: Evaluation
1. Switch to the "Evaluation" tab
2. Paste model responses in their respective text boxes
3. Select a model to evaluate (Claude, Gemini, or OpenAI)
4. For each applicable instruction and its rubrics:
   - Review the instruction and rubric
   - Mark the evaluation result (Yes/No/Not Applicable)
   - Navigate through rubrics using Previous/Next buttons
5. The app automatically handles non-applicable instructions (sets all rubrics to "Not Applicable")

### Step 3: Results
- View summary statistics
- Copy final instructions JSON (with applicability marked)
- Copy evaluated instructions JSON for each model
- Track progress with visual indicators

## Data Structure

### Input JSON Format
```json
[
  {
    "instruction": "Instruction text",
    "rubrics": [
      {
        "rubric": "Rubric text",
        "rubric_verifier": "Both"
      }
    ],
    "labels": ["Label1", "Label2"],
    "applicable": true,
    "type": "BUSINESS_LOGIC_DEVELOPER_INSTRUCTIONS"
  }
]
```

### Output JSON Format
```json
[
  {
    "instruction": "Instruction text",
    "rubrics": [
      {
        "rubric": "Rubric text",
        "rubric_verifier": "Both",
        "evaluation_result": "Yes"
      }
    ],
    "labels": ["Label1", "Label2"],
    "applicable": true,
    "type": "BUSINESS_LOGIC_DEVELOPER_INSTRUCTIONS"
  }
]
```

## Installation and Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually http://localhost:5173)

## Technologies Used

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Modern React hooks for state management

## Project Structure

```
src/
├── components/
│   ├── ApplicabilityStep.tsx    # Step 1: Mark instruction applicability
│   ├── EvaluationStep.tsx       # Step 2: Evaluate model responses
│   └── ResultsStep.tsx          # Step 3: Export results
├── types/
│   └── index.ts                 # TypeScript type definitions
├── App.tsx                      # Main application component
├── index.css                    # Tailwind CSS imports
└── main.tsx                     # Application entry point
```

## Usage Example

1. **Start with Applicability Step:**
   - Paste your query: "Can you notify the QA team about some Jira issues that are ready for testing?"
   - Paste case description: "Testing notification workflow for QA team"
   - Paste instructions JSON from your sample files
   - Mark each instruction as applicable or not

2. **Move to Evaluation Step:**
   - Paste Claude, Gemini, and OpenAI responses
   - Select a model to evaluate
   - Go through each applicable instruction and rubric
   - Mark evaluation results

3. **Export Results:**
   - Copy the final instructions JSON
   - Copy the evaluated instructions JSON for each model
   - Use the exported JSONs for your analysis

## Notes

- Instructions marked as `applicable: false` will automatically have all rubrics set to "Not Applicable"
- The app provides a formatted preview of model responses for better readability
- All data is stored in browser memory (no persistence - refresh will clear data)
- The app supports the exact JSON structure from your sample files
