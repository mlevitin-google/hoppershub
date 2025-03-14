// File: pages/api/gemini.js (for Next.js) or similar for your framework
import { GoogleGenerativeAI } from "@google/generative-ai";
//import { GoogleAIFileManager } from "@google/generative-ai/server";
import * as fs from 'fs/promises';  // Import fs.promises for async file operations
import * as path from 'path';      // Import the path module
import { parse } from 'csv-parse/sync'; // Use synchronous parsing for simplicity within the async function


// Load API key from environment variable
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
  throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(apiKey);
//const fileManager = new GoogleAIFileManager(apiKey); // Not directly used for local files, but keeping for potential future use.

// System instruction for the AI
const SYSTEM_INSTRUCTION = `
Welcome to the Hoppers Hub AI companion! You can ask me any question about the Hoppers Hub datasets and I'll do my best to answer:

Role and Purpose:

* You are an analyst on the CG&E sector team tasked with understanding insights from large datasets.
* You will use the Hopper's Hub data, which provides the DM&A (likely Data, Measurement, and Analytics) team with metrics based on the VMAXX strategy.
* Your goal is to help CG&E teams understand their clients' data, tech, and measurement maturity.
* This tool facilitates effective business planning, promotes knowledge sharing, and ensures a unified perspective.

Behaviors and Rules:

1) Data Interpretation:
a) Analyze the Hopper's Hub data to identify key insights and trends related to client maturity.
b) Clearly explain the meaning and implications of various metrics and data points.
c) Connect data insights to the VMAXX strategy and its goals.

2) Client Understanding:
a) Help CG&E teams understand their clients' current state in terms of data, technology, and measurement.
b) Identify areas where clients can improve their maturity and achieve better results.
c) Translate complex data concepts into clear and actionable recommendations for clients.

3) Business Planning:
a) Use data insights to inform business planning and decision-making for CG&E teams.
b) Provide data-driven recommendations for resource allocation, strategy development, and project prioritization.
c) Help teams align their activities with the overall VMAXX strategy and business goals.

4) Knowledge Sharing:
a) Share insights and best practices with CG&E teams to promote knowledge sharing and collaboration.
b) Facilitate discussions and workshops to help teams understand and utilize the Hopper's Hub data effectively.
c) Create clear and concise reports and presentations to communicate key findings to stakeholders.

Tone and Style:
* Maintain a professional and analytical tone.
* Use clear and concise language, avoiding jargon or technical terms when possible.
* Be objective and data-driven in your analysis and recommendations.
* Focus on providing actionable insights that can help CG&E teams achieve their goals.
`;


// Function to read and parse CSV data
async function readAndParseCSV(filePath) {
  try {
    const absolutePath = path.resolve(filePath); // Get absolute path
    const fileContent = await fs.readFile(absolutePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    return records;
  } catch (error) {
    console.error(`Error reading or parsing CSV file ${filePath}:`, error);
    throw new Error(`Failed to read or parse CSV file: ${filePath}`); // Re-throw for better error handling up the chain
  }
}


// Initialize chat history with file loading
const getInitialHistory = async () => {
    // Define relative paths to your CSV files
    const csvFilePaths = [
        './data/cge_hh_h12025.csv',
        './data/cge_hh_h22024.csv',
    ];

    let initialUserParts = [];
    let modelSummaryParts = [];

    for (const filePath of csvFilePaths) {
        try {
            const csvData = await readAndParseCSV(filePath);

            // Instead of summarizing here, we'll prepare the data for the model.
            // We create a string representation of the CSV data.  This is *much* better
            // than trying to JSON.stringify the entire parsed CSV, which would be enormous.
            // The model is much better at handling raw CSV text than a huge JSON object.
            const fileContent = await fs.readFile(path.resolve(filePath), 'utf-8'); // Read raw content again
            initialUserParts.push({ text: `Here is the content of ${path.basename(filePath)}:\n\n${fileContent}` });


            // Create a very concise summary, focusing on file's purpose, not the data details.
            modelSummaryParts.push({
                text: `* File: ${path.basename(filePath)} - Contains raw data related to VMAXX responses and backend data for ${filePath.includes('H1_2025') ? 'H1 2025' : 'H2 2024'}.`,
            });

        } catch (error) {
          //  Handle the error, but don't completely derail the process
          console.error(`Error loading data from ${filePath}:`, error);
          modelSummaryParts.push({ text: `* Failed to load data from ${path.basename(filePath)}.`});
        }
    }

  return [
    {
      role: "user",
      parts: [
        ...initialUserParts,
        { text: "summarize the data" }, // Now using the prepped text parts
      ]
    },
    {
        role: "model",
        parts: [
            {
                text: "Okay, here's a summary of the data you provided, focusing on key aspects relevant to the CG&E DM&A Ops Pillar and the VMAXX strategy:\n\n**Overall Context:**",
            },
            ...modelSummaryParts, // Add the concise file summaries
             {text: "\n\n**Key Themes and Potential Insights (based on column headings):**\n\n" +
             "1.  **Client Segmentation:**\n\n" +
             "    *   `vertical`, `parent`, `division`, `priority_account`, `subvertical`:  These columns allow you to segment clients based on industry, company structure, and account priority.  This is fundamental for understanding if maturity levels vary across different client types.\n\n" +
             "2.  **Value Delivery and Stakeholder Alignment:**\n\n" +
             "    *   `value_brand_building`, `value_consideration`, `value_action`:  These metrics are likely tied to the \"Value\" pillar of VMAXX.  Analyzing these, you can assess how well clients are progressing through the marketing funnel.\n" +
             "    *   `value_delivered_stakeholder`:  Indicates the stakeholder level to whom value is being delivered (Day-to-Day, Mid-Level, C-Level).\n" +
             "    *   `value_delivered_linked`, `value_delivered_group`: Provides info on value delivery and validation.\n\n" +
             "3.  **Data and Measurement Maturity:**\n\n" +
             "    *   `customer_sot_*`:  A significant portion of the data focuses on the \"Source of Truth\" (SOT) for measurement.  This helps gauge the sophistication of a client's data infrastructure and measurement approach.  For example, are they relying on basic Google Analytics, or do they have advanced 3P attribution models?\n" +
             "    *    `maxroi_learning_agenda_score`: A score of the client's learning agenda can help gauge the progress of the clients measurement maturity\n" +
             "    *   `xmedia_*`:  These columns capture how clients are approaching cross-channel measurement, using MMM, MTA, and reach metrics.\n\n" +
             "4.  **Experimentation and Optimization:**\n\n" +
             "    *   `maxroi_experiments_*`:  These columns provide insights into whether clients are actively using experimentation to validate and optimize their marketing efforts.\n\n" +
             "5.  **X-Media Strategy**\n" +
             "    *   `xmedia_triad_group`, `xmedia_trifecta_group`:  These could indicate adoption of a \"Triad\" (likely MMM, MTA, and Experimentation) or \"Trifecta\" approach to marketing measurement and optimization. This is a key indicator of maturity.\n\n" +
             "**Potential Analysis and Next Steps:**\n\n" +
             "1.  **Data Cleaning and Preparation:**  The raw data will likely need cleaning (handling missing values, inconsistencies, etc.) before analysis.\n\n" +
             "2.  **Descriptive Statistics:** Calculate basic statistics (averages, medians, distributions) for key metrics across different client segments.\n\n" +
             "3.  **Correlation Analysis:**  Explore correlations between different metrics.  For example:\n\n" +
             "    *   Is there a correlation between SOT sophistication (e.g., using 3P attribution) and higher conversion values?\n" +
             "    *   Does a higher \"Learning Agenda\" score correlate with better Max ROI metrics?\n" +
             "    *   Is there a correlation between VMAXX scores and rolling revenue metrics?\n\n" +
             "4.  **Trend Analysis:** Compare H2 2024 and H1 2025 data to identify trends in client maturity over time. Are clients generally improving in their data and measurement capabilities?\n\n" +
             "5.  **Benchmarking:**  Establish benchmarks for different maturity levels. This will allow you to quickly assess a client's current state and identify areas for improvement.\n\n" +
             "6.  **Actionable Insights and Recommendations:** Based on the analysis, develop data-driven recommendations for CG&E teams to help their clients improve their VMAXX scores and achieve better business outcomes."
           },
        ],
    },
    {
      role: "user",
      parts: [{ text: "who is the analytical lead for hellofresh?" }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Based on the provided data, the analytical lead for HelloFresh Group is Max Levitin."
        },
      ],
    }
  ];
};



export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    // Create a new chat session for each request
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",  // Or your preferred model
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const generationConfig = {
      temperature: 0.9,  // Adjust as needed
      topP: 1,
      topK: 1,
      maxOutputTokens: 8192,
      // responseMimeType: "text/plain",  // No need to specify, default is fine
    };

    // Get the initial history with file data
    const initialHistory = await getInitialHistory();

    // Add the current prompt to the history.  VERY IMPORTANT: include the prompt *again*
    // in the sendMessage call.  The history is the *past* conversation, the
    // prompt is the *current* message.
    const history = [
      ...initialHistory,
      {
        role: "user",
        parts: [{ text: prompt }],
      }
    ];

    // Start a chat session with the history
    const chatSession = model.startChat({
      generationConfig,
      history: history
    });

    // Get the response.  Pass the prompt here, too!
    const result = await chatSession.sendMessage(prompt);
    const responseText = result.response.text();

    // Return the response
    return res.status(200).json({ response: responseText });

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Failed to process request', details: error.message });
  }
}