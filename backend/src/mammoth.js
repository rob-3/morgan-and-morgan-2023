import mammoth from "mammoth";
import pdf from '@c-barron/pdf-parse';
import { Configuration, OpenAIApi } from "openai";
import { readFileSync } from "fs";
import { globby } from "globby";

const WHISPER_API_KEY = '';
const TEXT_MODEL = "text-davinci-003"
const configuration = new Configuration({
	apiKey: WHISPER_API_KEY,
});
const openai = new OpenAIApi(configuration);

let dir = './files';
const filenames = await globby("**", { gitignore: false, dot: true, cwd: dir });

/**
 * Iterate through files and log client information
 * @async
 * @function
 */
async function getFiles() {
	for (const filename of filenames) {
		const text = await determineDocumentTypeAction(filename);
		const clientInformation = await getClientInformation(text.value, "high");
		console.log(clientInformation);
	}
}

/**
 * Determine document type and extract text accordingly
 * @async
 * @function
 * @param {string} filename - Name of the file
 * @return {Promise<string|undefined>} - Extracted text or undefined
 */
async function determineDocumentTypeAction(filename) {
	if (filename.toString().includes(".docx")) {
		return await mammoth.extractRawText({ path: dir + "/" + filename });
	}
	else if (filename.toString().includes(".pdf")) {
		const dataBuffer = readFileSync(dir + "/" + filename);
		const data = await pdf(dataBuffer);
		return data.text;
	} else {
		return undefined;
	}
}

/**
 * Get summary of a given text excerpt
 * @async
 * @function
 * @param {string} body - Text excerpt
 * @param {string} strength - Strength of the summary (low, medium, or high)
 * @return {Promise<string>} - Summary of the text excerpt
 */
async function getSummaryFromTextExcerpt(body, strength) {
	return promptGPT4("Summarize the document: \n\n" + body, strength);
}

/**
 * Get client information from a given text body
 * @async
 * @function
 * @param {string} body - Text body
 * @param {string} strength - Strength of the summary (low, medium, or high)
 * @return {Promise<Array<string>|undefined>} - Array of prompt answers or undefined
 */
async function getClientInformation(body, strength) {
	const prompts = [
		"Identify the receiver name in this document? Return the first and last name only. This should contain no numbers, only a string. \n\n" + body,
		determineCategory(body),
		"Summarize the document: \n\n" + body,
	];

	let promptAnswers = [];
	for (const prompt of prompts) {
		let promptAnswer;
		if (prompt.includes("Summarize the document")) {
			promptAnswer = await promptGPT4(prompt, strength);
			if (promptAnswer.endsWith(".")) {
				promptAnswer = promptAnswer.slice(0, -1);
			}
		} else {
			promptAnswer = await promptGPT4(prompt);
		}
		if (promptAnswer !== "") {
			promptAnswers.push(promptAnswer);
		}
	}
	if (promptAnswers.length === prompts.length) {
		return promptAnswers;
	}
	return undefined;
}

/**
 * Prompt GPT-4 with a given prompt and strength
 * @async
 * @function
 * @param {string} prompt - The prompt to send to GPT-4
 * @param {string} strength - The strength of the response (low, medium, or high)
 * @return {Promise<string>} - The GPT-4 generated response
 */
export async function promptGPT4(prompt, strength) {
	if (strength !== "skip"){
		prompt += "You are required to make this answer ONLY "
	}
	switch (strength) {
		case "low":
			prompt += "two sentences.\n";
			break;
		case "medium":
			prompt += "four sentences.\n";
			break;
		case "high":
			prompt += "six sentences.\n";
			break;
		default:
			break;
	}
	const promptData = await openai.createCompletion({
		model: TEXT_MODEL,
		prompt: prompt,
		temperature: 0,
		max_tokens: 500,
	});
	return promptData.data.choices[0].text.replace(/(\r\n|\n|\r)/gm, "").replace(/\t\t\t\tTELEPHONE: \(\d{3}\) \d{3}-\d{4}/, "");
}

/**
 * Determine the category of a given document
 * @function
 * @param {string} document - The document text to analyze
 * @return {string} - The GPT-4 prompt with the document text
 */
function determineCategory(document) {
	let prompt = "Given the following categories: \n";
	const categories = ["settlement", "health", "accident"];
	for (const category in categories) {
		prompt += categories[category];
		if (category !== (categories.length + 1)) {
			prompt += ",";
		}
	}
	prompt += "\n \nWhat category will this document fall in? Choose one answer and only return one word, do not include punctuation. Please make sure to remember that the result should not contain any numbers, it should only be a string. \n" + document;
	return prompt;
}
