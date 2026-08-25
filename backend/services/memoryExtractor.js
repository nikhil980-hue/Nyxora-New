import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();


// ======================================================
// GEMINI API KEY ROTATION
// ======================================================

const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY_6,
  process.env.GEMINI_API_KEY_7,
  process.env.GEMINI_API_KEY_8,
  process.env.GEMINI_API_KEY_9,
  process.env.GEMINI_API_KEY_10,
  process.env.GEMINI_API_KEY_11,
  process.env.GEMINI_API_KEY_12,
  process.env.GEMINI_API_KEY_13,
  process.env.GEMINI_API_KEY_14,
  process.env.GEMINI_API_KEY_15,
].filter(Boolean);

if (API_KEYS.length === 0) {
  throw new Error("No Gemini API keys found.");
}

function getAIClient(apiKey) {
  return new GoogleGenAI({ apiKey });
}

// ======================================================
// MODELS
// ======================================================

const MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
];


// ======================================================
// MEMORY EXTRACTION PROMPT
// ======================================================

const MEMORY_SYSTEM_PROMPT = `
You are the memory extraction system for Nyxora AI.

Your job is to analyze:

1. The user's EXISTING MEMORY.
2. The user's NEW MESSAGE.

Then determine exactly what long-term memory changes
should be made.

You are NOT a chatbot.

Return ONLY valid JSON.


========================================================
OUTPUT STRUCTURE
========================================================

Always return exactly this structure:

{
  "userInfo": {},
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": []
}

Do not create additional top-level fields.


========================================================
EXISTING MEMORY
========================================================

Existing memory may contain:

{
  "userInfo": {},
  "preferences": {},
  "interests": [],
  "skills": []
}

Use existing memory to detect:

- replacements
- corrections
- removals
- contradictions
- duplicates
- already-known information

Do not return existing information again unless the
new message actually changes it.


========================================================
USER INFO
========================================================

Store stable information explicitly stated by the user.

Useful examples:

- name
- occupation
- course
- fieldOfStudy

Never guess.

Example:

Existing:

{
  "userInfo": {
    "course": "B.Tech"
  }
}

Message:

"I study BCA now."

Return:

{
  "userInfo": {
    "course": "BCA"
  },
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": []
}

The newest explicit statement takes priority.


========================================================
USER INFO CORRECTIONS
========================================================

Example:

Existing:

{
  "userInfo": {
    "name": "Nikhil"
  }
}

Message:

"My name is actually Nikhil Kumar."

Return:

{
  "userInfo": {
    "name": "Nikhil Kumar"
  },
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": []
}


========================================================
REMOVE USER INFO
========================================================

When the user explicitly asks Nyxora to forget a stored
user-information field, put the FIELD NAME inside
removeUserInfo.

IMPORTANT:

removeUserInfo contains FIELD NAMES, not field values.

Example:

Existing:

{
  "userInfo": {
    "name": "Nikhil Kumar",
    "course": "BCA"
  }
}

Message:

"Forget my course."

Return:

{
  "userInfo": {},
  "preferences": {},
  "removeUserInfo": [
    "course"
  ],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": []
}


Example:

Message:

"Don't remember my name anymore."

Return:

{
  "userInfo": {},
  "preferences": {},
  "removeUserInfo": [
    "name"
  ],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": []
}


Do NOT remove unrelated userInfo fields.


========================================================
USER INFO REPLACEMENT
========================================================

If the user replaces a value, update it through userInfo.

Do NOT remove the field first.

Example:

Existing:

{
  "userInfo": {
    "course": "B.Tech"
  }
}

Message:

"I switched from B.Tech to BCA."

Return:

{
  "userInfo": {
    "course": "BCA"
  },
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": []
}


========================================================
PREFERENCES
========================================================

Store persistent preferences.

Examples:

- responseStyle
- learningStyle
- theme

Example:

Existing:

{
  "preferences": {
    "responseStyle": "Concise"
  }
}

Message:

"Always give me detailed answers."

Return:

{
  "userInfo": {},
  "preferences": {
    "responseStyle": "Detailed"
  },
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": []
}


Temporary instructions are NOT persistent preferences.

Example:

"Explain this answer in detail."

Do NOT automatically store that.

But:

"Always explain things in detail."

may be stored as a persistent preference.


========================================================
REMOVE PREFERENCES
========================================================

When the user explicitly asks Nyxora to forget a stored
preference, put the FIELD NAME inside removePreferences.

IMPORTANT:

removePreferences contains FIELD NAMES, not values.

Example:

Existing:

{
  "preferences": {
    "theme": "dark",
    "responseStyle": "Concise"
  }
}

Message:

"Forget my theme preference."

Return:

{
  "userInfo": {},
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [
    "theme"
  ],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": []
}


Example:

Message:

"Don't remember my response style anymore."

Return:

{
  "userInfo": {},
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [
    "responseStyle"
  ],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": []
}


========================================================
PREFERENCE REPLACEMENT
========================================================

If the user changes a preference, update the value.

Do NOT remove the preference first.

Example:

Existing:

{
  "preferences": {
    "theme": "dark"
  }
}

Message:

"I prefer light theme now."

Return:

{
  "userInfo": {},
  "preferences": {
    "theme": "light"
  },
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": []
}


========================================================
INTERESTS
========================================================

When the user clearly expresses a persistent interest,
add it using addInterests.

Example:

"I'm interested in cybersecurity."

Return:

{
  "userInfo": {},
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [
    "Cybersecurity"
  ],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": []
}


========================================================
REMOVE INTERESTS
========================================================

When the user explicitly says they are no longer
interested in something, use removeInterests.

Example:

"I'm not interested in robotics anymore."

Return:

{
  "userInfo": {},
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [
    "Robotics"
  ],
  "addSkills": [],
  "removeSkills": []
}


========================================================
INTEREST REPLACEMENT
========================================================

Example:

"I'm no longer interested in Python.
I'm interested in robotics instead."

Return:

{
  "userInfo": {},
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [
    "Robotics"
  ],
  "removeInterests": [
    "Python"
  ],
  "addSkills": [],
  "removeSkills": []
}


========================================================
SKILLS
========================================================

Store technologies or skills the user explicitly says
they know, use, practice, or are learning.

Example:

"I'm learning React."

Return:

{
  "userInfo": {},
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [
    "React"
  ],
  "removeSkills": []
}


========================================================
REMOVE SKILLS
========================================================

Remove a skill when the user clearly says they:

- stopped learning it
- stopped using it
- no longer practice it
- no longer consider it a skill

Example:

"I stopped learning React."

Return:

{
  "userInfo": {},
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": [
    "React"
  ]
}


========================================================
SKILL VS INTEREST
========================================================

Interests and skills are separate.

Example:

Existing:

{
  "interests": [
    "Web Development"
  ],
  "skills": [
    "Web Development"
  ]
}

Message:

"I'm no longer interested in web development."

Remove ONLY the interest.

Return:

{
  "userInfo": {},
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [
    "Web Development"
  ],
  "addSkills": [],
  "removeSkills": []
}

Do NOT remove the skill unless the user explicitly
indicates that the skill itself is no longer applicable.


========================================================
EXPLICIT FORGET REQUESTS
========================================================

Take explicit forget requests seriously.

Examples:

"Forget my course."
"Forget my name."
"Forget that I like robotics."
"Forget that I know React."
"Don't remember my theme preference."
"Remove cybersecurity from my interests."

Use the correct removal category.

Do NOT delete unrelated memory.


========================================================
FORGET EVERYTHING
========================================================

Do NOT interpret phrases like:

"Forget everything about me."

as individual field operations.

Global memory deletion should be handled by Nyxora's
dedicated Clear AI Memory feature instead.

Do not guess which individual fields should be removed.


========================================================
EXPLICIT REMEMBER REQUESTS
========================================================

Statements such as:

"Remember that..."
"Keep in mind that..."
"Don't forget that..."

should only be stored when the information safely fits:

- userInfo
- preferences
- interests
- skills

Do not create arbitrary categories.


========================================================
TEMPORARY INFORMATION
========================================================

Do NOT store temporary information.

Examples:

"I have an exam tomorrow."
"I'm tired today."
"I'm hungry."
"I'm going shopping."
"I'm at college right now."
"I need to finish homework tonight."
"I have a meeting at 5."


========================================================
ORDINARY QUESTIONS
========================================================

Do NOT infer memory from ordinary questions.

Examples:

"What is Python?"
"Explain React."
"Teach me machine learning."
"Tell me about robotics."

These do NOT prove interests or skills.


========================================================
DUPLICATES
========================================================

Compare new information against existing memory.

Treat capitalization differences as the same.

Do not add information that is already stored.


========================================================
SENSITIVE INFORMATION
========================================================

Do NOT store:

- passwords
- API keys
- authentication tokens
- bank/card details
- government identification numbers
- exact home addresses
- medical diagnoses
- sexual information
- political affiliation
- religious identity
- criminal history
- private security credentials


========================================================
CONFLICT RULES
========================================================

The newest explicit user statement takes priority.

For userInfo:
- update through userInfo

For preferences:
- update through preferences

For deleting userInfo:
- use removeUserInfo

For deleting preferences:
- use removePreferences

For interests:
- use addInterests/removeInterests

For skills:
- use addSkills/removeSkills

Never add and remove the same thing simultaneously.

Never remove unrelated information.


========================================================
NO CHANGE RULE
========================================================

If information is already correctly stored and the
message doesn't change it, return no changes.


========================================================
QUALITY RULES
========================================================

1. Extract only explicitly supported information.
2. Use existing memory to detect changes.
3. Never guess.
4. Never invent information.
5. Keep values concise.
6. Preserve proper capitalization.
7. Keep interests and skills separate.
8. Removal of object data uses FIELD NAMES.
9. Removal of interests/skills uses VALUES.
10. Avoid duplicates.
11. Return JSON only.
12. Do not return Markdown.
13. Do not explain your decision.

If nothing should change, return:

{
  "userInfo": {},
  "preferences": {},
  "removeUserInfo": [],
  "removePreferences": [],
  "addInterests": [],
  "removeInterests": [],
  "addSkills": [],
  "removeSkills": []
}
`;


// ======================================================
// EMPTY OPERATIONS
// ======================================================

function emptyMemoryOperations() {

  return {
    userInfo: {},
    preferences: {},
    removeUserInfo: [],
    removePreferences: [],
    addInterests: [],
    removeInterests: [],
    addSkills: [],
    removeSkills: [],
  };

}


// ======================================================
// CLEAN MODEL JSON
// ======================================================

function cleanJSONResponse(text) {

  if (!text) {
    return "";
  }


  let cleaned =
    String(text).trim();


  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();


  const firstBrace =
    cleaned.indexOf("{");

  const lastBrace =
    cleaned.lastIndexOf("}");


  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace >= firstBrace
  ) {

    cleaned =
      cleaned.slice(
        firstBrace,
        lastBrace + 1
      );

  }


  return cleaned;

}


// ======================================================
// NORMALIZE STRING
// ======================================================

function normalizeString(value) {

  if (
    typeof value !== "string"
  ) {
    return null;
  }


  const cleaned =
    value.trim();


  return cleaned || null;

}


// ======================================================
// NORMALIZE ARRAY
// ======================================================

function normalizeArray(value) {

  if (!Array.isArray(value)) {
    return [];
  }


  const result = [];

  const seen = new Set();


  for (const item of value) {

    const normalized =
      normalizeString(item);


    if (!normalized) {
      continue;
    }


    const key =
      normalized
        .toLowerCase();


    if (seen.has(key)) {
      continue;
    }


    seen.add(key);

    result.push(
      normalized
    );

  }


  return result;

}


// ======================================================
// NORMALIZE OBJECT
// ======================================================

function normalizeObject(value) {

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {

    return {};

  }


  const result = {};


  for (
    const [key, item]
    of Object.entries(value)
  ) {

    const normalized =
      normalizeString(item);


    if (!normalized) {
      continue;
    }


    result[key] =
      normalized;

  }


  return result;

}


// ======================================================
// COMPARISON KEY
// ======================================================

function comparisonKey(value) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase();

}


// ======================================================
// FIELD KEY
// ======================================================

function fieldKey(value) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    );

}


// ======================================================
// EXISTING FIELD NAME
// ======================================================

function findExistingField(
  requestedField,
  existingObject
) {

  const requestedKey =
    fieldKey(
      requestedField
    );


  if (!requestedKey) {
    return null;
  }


  for (
    const existingField
    of Object.keys(
      existingObject || {}
    )
  ) {

    if (
      fieldKey(
        existingField
      ) === requestedKey
    ) {

      return existingField;

    }

  }


  return null;

}


// ======================================================
// VALIDATE FIELD REMOVALS
// ======================================================

function validateFieldRemovals(
  removals,
  existingObject
) {

  const result = [];

  const seen = new Set();


  for (
    const requestedField
    of normalizeArray(removals)
  ) {

    const existingField =
      findExistingField(
        requestedField,
        existingObject
      );


    if (!existingField) {
      continue;
    }


    const key =
      fieldKey(
        existingField
      );


    if (seen.has(key)) {
      continue;
    }


    seen.add(key);

    result.push(
      existingField
    );

  }


  return result;

}


// ======================================================
// REMOVE EXISTING ADDITIONS
// ======================================================

function removeExistingAdditions(
  additions,
  existing
) {

  const existingKeys =
    new Set(
      existing.map(
        comparisonKey
      )
    );


  return additions.filter(
    (item) =>
      !existingKeys.has(
        comparisonKey(item)
      )
  );

}


// ======================================================
// REMOVE INVALID REMOVALS
// ======================================================

function removeMissingRemovals(
  removals,
  existing
) {

  const existingKeys =
    new Set(
      existing.map(
        comparisonKey
      )
    );


  return removals.filter(
    (item) =>
      existingKeys.has(
        comparisonKey(item)
      )
  );

}


// ======================================================
// REMOVE UNCHANGED OBJECT VALUES
// ======================================================

function removeUnchangedObjectValues(
  changes,
  existing
) {

  const result = {};


  for (
    const [key, value]
    of Object.entries(changes)
  ) {

    const existingValue =
      existing?.[key];


    if (
      comparisonKey(
        existingValue
      ) ===
      comparisonKey(
        value
      )
    ) {

      continue;

    }


    result[key] =
      value;

  }


  return result;

}


// ======================================================
// RESOLVE ARRAY CONFLICTS
// ======================================================

function resolveArrayConflicts(
  additions,
  removals
) {

  const removalKeys =
    new Set(
      removals.map(
        comparisonKey
      )
    );


  return {

    additions:
      additions.filter(
        (item) =>
          !removalKeys.has(
            comparisonKey(item)
          )
      ),

    removals,

  };

}


// ======================================================
// RESOLVE OBJECT CONFLICTS
// ======================================================

function resolveObjectConflicts(
  updates,
  removals
) {

  const updateKeys =
    new Set(
      Object.keys(updates)
        .map(
          fieldKey
        )
    );


  return removals.filter(
    (field) =>
      !updateKeys.has(
        fieldKey(field)
      )
  );

}


// ======================================================
// VALIDATE OPERATIONS
// ======================================================

function validateMemoryOperations(
  data,
  existingMemory = {}
) {

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {

    return emptyMemoryOperations();

  }


  const existingUserInfo =
    normalizeObject(
      existingMemory.userInfo
    );


  const existingPreferences =
    normalizeObject(
      existingMemory.preferences
    );


  const existingInterests =
    normalizeArray(
      existingMemory.interests
    );


  const existingSkills =
    normalizeArray(
      existingMemory.skills
    );


  // ====================================================
  // USER INFO
  // ====================================================

  const userInfo =
    removeUnchangedObjectValues(

      normalizeObject(
        data.userInfo
      ),

      existingUserInfo

    );


  let removeUserInfo =
    validateFieldRemovals(

      data.removeUserInfo,

      existingUserInfo

    );


  removeUserInfo =
    resolveObjectConflicts(
      userInfo,
      removeUserInfo
    );


  // ====================================================
  // PREFERENCES
  // ====================================================

  const preferences =
    removeUnchangedObjectValues(

      normalizeObject(
        data.preferences
      ),

      existingPreferences

    );


  let removePreferences =
    validateFieldRemovals(

      data.removePreferences,

      existingPreferences

    );


  removePreferences =
    resolveObjectConflicts(
      preferences,
      removePreferences
    );


  // ====================================================
  // INTERESTS
  // ====================================================

  let addInterests =
    normalizeArray(
      data.addInterests
    );


  let removeInterests =
    normalizeArray(
      data.removeInterests
    );


  addInterests =
    removeExistingAdditions(
      addInterests,
      existingInterests
    );


  removeInterests =
    removeMissingRemovals(
      removeInterests,
      existingInterests
    );


  const interestOperations =
    resolveArrayConflicts(
      addInterests,
      removeInterests
    );


  // ====================================================
  // SKILLS
  // ====================================================

  let addSkills =
    normalizeArray(
      data.addSkills
    );


  let removeSkills =
    normalizeArray(
      data.removeSkills
    );


  addSkills =
    removeExistingAdditions(
      addSkills,
      existingSkills
    );


  removeSkills =
    removeMissingRemovals(
      removeSkills,
      existingSkills
    );


  const skillOperations =
    resolveArrayConflicts(
      addSkills,
      removeSkills
    );


  return {

    userInfo,

    preferences,

    removeUserInfo,

    removePreferences,

    addInterests:
      interestOperations.additions,

    removeInterests:
      interestOperations.removals,

    addSkills:
      skillOperations.additions,

    removeSkills:
      skillOperations.removals,

  };

}


// ======================================================
// CHECK FOR CHANGES
// ======================================================

function hasMemoryChanges(
  memory
) {

  return (

    Object.keys(
      memory.userInfo
    ).length > 0 ||

    Object.keys(
      memory.preferences
    ).length > 0 ||

    memory.removeUserInfo
      .length > 0 ||

    memory.removePreferences
      .length > 0 ||

    memory.addInterests
      .length > 0 ||

    memory.removeInterests
      .length > 0 ||

    memory.addSkills
      .length > 0 ||

    memory.removeSkills
      .length > 0

  );

}


// ======================================================
// SAFE EXISTING MEMORY
// ======================================================

function createExistingMemoryContext(
  memory
) {

  if (
    !memory ||
    typeof memory !== "object"
  ) {

    return {
      userInfo: {},
      preferences: {},
      interests: [],
      skills: [],
    };

  }


  return {

    userInfo:
      normalizeObject(
        memory.userInfo
      ),

    preferences:
      normalizeObject(
        memory.preferences
      ),

    interests:
      normalizeArray(
        memory.interests
      ),

    skills:
      normalizeArray(
        memory.skills
      ),

  };

}


// ======================================================
// EXTRACT WITH MODEL
// ======================================================

async function extractUsingModel(
  apiKey,
  model,
  message,
  existingMemory
) {

  const memoryContext =
    createExistingMemoryContext(
      existingMemory
    );


const ai = getAIClient(apiKey);

const response =
  await ai.models.generateContent({

      model,

      contents: [
        {
          role: "user",

          parts: [
            {
              text: `
${MEMORY_SYSTEM_PROMPT}

========================================================
EXISTING MEMORY
========================================================

${JSON.stringify(
  memoryContext,
  null,
  2
)}

========================================================
NEW USER MESSAGE
========================================================

${message}
              `.trim(),
            },
          ],
        },
      ],

    });


  const responseText =
    response.text || "";


  const cleaned =
    cleanJSONResponse(
      responseText
    );


  if (!cleaned) {

    return emptyMemoryOperations();

  }


  const parsed =
    JSON.parse(
      cleaned
    );


  return validateMemoryOperations(
    parsed,
    memoryContext
  );

}


// ======================================================
// MAIN MEMORY EXTRACTOR
// ======================================================

export async function extractMemory(
  message,
  existingMemory = null
) {

  if (
    !message ||
    typeof message !== "string" ||
    !message.trim()
  ) {

    return {};

  }


  const memoryContext =
    createExistingMemoryContext(
      existingMemory
    );


  let lastError = null;


for (const apiKey of API_KEYS) {

  console.log(
    `Using API key ${API_KEYS.indexOf(apiKey) + 1}/${API_KEYS.length}`
  );

  for (const model of MODELS) {

    try {

      console.log(
        `🧠 Memory extraction using: ${model}`
      );

      const operations =
        await extractUsingModel(
          apiKey,
          model,
          message.trim(),
          memoryContext
        );

      if (
        !hasMemoryChanges(
          operations
        )
      ) {

        console.log(
          "🧠 No useful long-term memory changes found."
        );

        return {};

      }

      console.log(
        "🧠 Memory changes extracted:",
        operations
      );

      return operations;

    } catch (error) {

      lastError =
        error;

      console.error(
        `❌ Memory extraction failed with ${model} using API key ${API_KEYS.indexOf(apiKey) + 1}:`,
        error.message || error
      );

    }

  }

}


  console.error(
    "❌ All memory extraction models failed:",
    lastError?.message ||
      lastError
  );


  // Memory extraction failure must
  // never break Nyxora chat.

  return {};

}