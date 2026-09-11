import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * SDK-Driven Google Gemini AI Engine - Crossword Cook Edition
 * Integrates the modern gemini-3.5-flash endpoint to resolve 404 version faults.
 */
const AI_ENGINE = {
    // ⚠️ HACKATHON SETUP: Paste your active Gemini API key inside the quotes below
    API_KEY: process.env.GOOGLE_API_KEY, 

    _getApiKey: function() {
        if (this.API_KEY && this.API_KEY.trim() !== "" && this.API_KEY !== "YOUR_API_KEY_HERE") return this.API_KEY;
        const savedKey = sessionStorage.getItem("GEMINI_API_KEY");
        if (savedKey) return savedKey;

        const inputKey = prompt("🔒 Please enter your Gemini API Key to unlock live AI puzzle generation:");
        if (inputKey) {
            sessionStorage.setItem("GEMINI_API_KEY", inputKey);
            return inputKey;
        }
        return null;
    },

    generateCrosswordPayload: async function(dishName) {
        const apiKey = this._getApiKey();
        if (!apiKey || apiKey === "YOUR_API_KEY_HERE") throw new Error("Missing or invalid API Key. Please insert a valid Gemini Key.");

        const promptText = `
            You are a creative backend layout engine for an absurd culinary crossword puzzle app.
            User input topic dish is: "${dishName}"
            
            DIRECTIONS:
            1. Evaluate if the User Input is a legitimate English dish, recipe, or standard loanword (such as sushi, taco, lasagna, kebab, biryani). If not a food item (e.g. "plastic shoe", "laptop", "brick"), set isValid to false and provide a funny error reason.
            2. If it is valid food, generate exactly 10 items in the data array: 5 with dir "A" (Across) and 5 with dir "D" (Down).
            3. Dynamic Clues: Focus on hyper-abstract, verbose technical verbs describing kinetic pressure or state changes (e.g., SEGREGATE, MACERATE, SATURATE, COAGULATE, VAPORIZE, INCINERATE, EXTRACT). Do not repeat the same clues across runs. Clues MUST NOT mention any ingredients directly. Words must be pure alphabetical uppercase letters.
            
            Output Formatting:
            You must return a raw JSON object matching this schema. Do not include markdown wraps or block formatting codes like \`\`\`json. Just return the text raw.
            {
                "isValid": boolean,
                "reason": "Error reason if isValid is false",
                "data": [
                    {"word": "VAPORIZE", "clue": "Expose aqueous fluid volume to extreme thermal thresholds until state transformation triggers. (8)", "dir": "A"}
                ]
            }
        `;

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            
            // 🛠️ THE CRITICAL ULTIMATE FIX: Targets the modern gemini-3.5-flash distribution pipeline
            const model = genAI.getGenerativeModel({ 
                model: "gemini-3.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const result = await model.generateContent(promptText);
            const rawText = result.response.text();
            const resultMatrix = JSON.parse(rawText.trim());

            if (!resultMatrix.isValid) {
                throw new Error(resultMatrix.reason || "Linguistic culinary verification failed.");
            }

            return resultMatrix.data;

        } catch (error) {
            console.error("SDK Pipeline Exception Tracker:", error);
            if (error.message.includes("429")) {
                throw new Error("⏳ Gemini API Rate limit hit (15 RPM max). Please wait 10 seconds.");
            }
            throw error;
        }
    },

    validateDish: function(dishName) {
        if (!dishName || dishName.trim().length < 2) return false;
        return /^[a-zA-Z\s\-]+$/.test(dishName);
    }
};

window.AI_ENGINE = AI_ENGINE;
