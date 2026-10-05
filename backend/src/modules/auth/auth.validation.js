import ApiError from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import {
  ACCOUNT_TYPES,
  LANGUAGES,
  TEACHING_STYLES,
} from "../../constants/enums.js";

const ALLOWED_REGISTER_FIELDS = [
  "fullname",
  "username",
  "email",
  "password",
  "accountType",
  "languages",
  "teachingSkills",
  "teachingStyles",
];

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const hasDuplicates = (values) => {
  return new Set(values).size !== values.length;
};

const hasDuplicateSkillIds = (skillIds) => {
  const normalizedIds = skillIds.map((skillId) =>
    skillId.toLowerCase(),
  );

  return new Set(normalizedIds).size !== normalizedIds.length;
};

const validateRegister = (req, _res, next) => {
  const errors = [];

  const body = req.body || {};

  const addError = (field, message, code) => {
    errors.push({
      field,
      message,
      code,
    });
  };


  // 1. Check unknown fields


  const receivedFields = Object.keys(body);

  const unknownFields = receivedFields.filter(
    (field) => !ALLOWED_REGISTER_FIELDS.includes(field),
  );

  unknownFields.forEach((field) => {
    addError(
      field,
      `Unknown registration field: ${field}`,
      ERROR_CODES.INVALID_REQUEST,
    );
  });

  const {
    fullname,
    username,
    email,
    password,
    accountType,
    languages,
    teachingSkills,
    teachingStyles,
  } = body;


  // 2. Fullname


  let normalizedFullname;

  if (
    fullname === undefined ||
    fullname === null ||
    fullname === ""
  ) {
    addError(
      "fullname",
      "Fullname is required",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  } else if (typeof fullname !== "string") {
    addError(
      "fullname",
      "Fullname must be a string",
      ERROR_CODES.INVALID_FIELD_VALUE,
    );
  } else {
    normalizedFullname = fullname.trim();

    if (
      normalizedFullname.length < 2 ||
      normalizedFullname.length > 60
    ) {
      addError(
        "fullname",
        "Fullname must be between 2 and 60 characters",
        ERROR_CODES.INVALID_FIELD_VALUE,
      );
    } else {
      const fullnameRegex = /^[\p{L} '-]+$/u;

      if (!fullnameRegex.test(normalizedFullname)) {
        addError(
          "fullname",
          "Fullname can contain only letters, spaces, hyphens, and apostrophes",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      }
    }
  }


  // 3. Username


  if (
    username === undefined ||
    username === null ||
    username === ""
  ) {
    addError(
      "username",
      "Username is required",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  } else if (typeof username !== "string") {
    addError(
      "username",
      "Username must be a string",
      ERROR_CODES.INVALID_FIELD_VALUE,
    );
  } else {
    const usernameRegex = /^[a-z0-9_]{3,30}$/;

    if (!usernameRegex.test(username)) {
      addError(
        "username",
        "Username must be 3-30 characters and contain only lowercase letters, numbers, and underscores",
        ERROR_CODES.INVALID_FIELD_VALUE,
      );
    }
  }


  // 4. Email


  let normalizedEmail;

  if (
    email === undefined ||
    email === null ||
    email === ""
  ) {
    addError(
      "email",
      "Email is required",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  } else if (typeof email !== "string") {
    addError(
      "email",
      "Email must be a string",
      ERROR_CODES.INVALID_FIELD_VALUE,
    );
  } else {
    normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      addError(
        "email",
        "Please provide a valid email address",
        ERROR_CODES.INVALID_FIELD_VALUE,
      );
    }
  }

  // 5. Password


  if (
    password === undefined ||
    password === null ||
    password === ""
  ) {
    addError(
      "password",
      "Password is required",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  } else if (typeof password !== "string") {
    addError(
      "password",
      "Password must be a string",
      ERROR_CODES.INVALID_FIELD_VALUE,
    );
  } else {
    if (password.length < 8) {
      addError(
        "password",
        "Password must be at least 8 characters long",
        ERROR_CODES.INVALID_FIELD_VALUE,
      );
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialCharacter = /[^A-Za-z0-9\s]/.test(password);

    if (
      !hasUppercase ||
      !hasLowercase ||
      !hasNumber ||
      !hasSpecialCharacter
    ) {
      addError(
        "password",
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        ERROR_CODES.INVALID_FIELD_VALUE,
      );
    }
  }


  // 6. Account type


  const validAccountType =
    typeof accountType === "string" &&
    Object.values(ACCOUNT_TYPES).includes(accountType);

  if (
    accountType === undefined ||
    accountType === null ||
    accountType === ""
  ) {
    addError(
      "accountType",
      "Account type is required",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  } else if (!validAccountType) {
    addError(
      "accountType",
      "Invalid account type",
      ERROR_CODES.INVALID_ACCOUNT_TYPE,
    );
  }


  // 7. Languages


  if (languages === undefined || languages === null) {
    addError(
      "languages",
      "Languages are required",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  } else if (!Array.isArray(languages)) {
    addError(
      "languages",
      "Languages must be an array",
      ERROR_CODES.INVALID_FIELD_VALUE,
    );
  } else if (languages.length === 0) {
    addError(
      "languages",
      "At least one language is required",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  } else {
    const hasInvalidLanguage = languages.some(
      (language) =>
        typeof language !== "string" ||
        !Object.values(LANGUAGES).includes(language),
    );

    if (hasInvalidLanguage) {
      addError(
        "languages",
        "One or more selected languages are invalid",
        ERROR_CODES.INVALID_LANGUAGE,
      );
    }

    if(!hasInvalidLanguage){
        if (hasDuplicates(languages)) {
          addError(
            "languages",
            "Languages must not contain duplicate values",
            ERROR_CODES.INVALID_FIELD_VALUE,
          );
        }
    }
  }


  // 8. Account-type specific validation


  if (validAccountType) {
    
    // Learner
   

    if (accountType === ACCOUNT_TYPES.LEARNER) {
      if (
        Object.prototype.hasOwnProperty.call(
          body,
          "teachingSkills",
        )
      ) {
        addError(
          "teachingSkills",
          "Learner accounts must not provide teaching skills",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          body,
          "teachingStyles",
        )
      ) {
        addError(
          "teachingStyles",
          "Learner accounts must not provide teaching styles",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      }
    }

   
    // Teacher / Teacher-Learner
    

    const isTeachingAccount =
      accountType === ACCOUNT_TYPES.TEACHER ||
      accountType === ACCOUNT_TYPES.TEACHER_LEARNER;

    if (isTeachingAccount) {
     
      // Teaching Skills
     

      if (
        teachingSkills === undefined ||
        teachingSkills === null
      ) {
        addError(
          "teachingSkills",
          "Teaching skills are required",
          ERROR_CODES.TEACHING_PROFILE_INCOMPLETE,
        );
      } else if (!Array.isArray(teachingSkills)) {
        addError(
          "teachingSkills",
          "Teaching skills must be an array",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      } else if (teachingSkills.length === 0) {
        addError(
          "teachingSkills",
          "At least one teaching skill is required",
          ERROR_CODES.TEACHING_PROFILE_INCOMPLETE,
        );
      } else {
        const hasInvalidSkillId = teachingSkills.some(
          (skillId) =>
            typeof skillId !== "string" ||
            !OBJECT_ID_REGEX.test(skillId),
        );

        if (hasInvalidSkillId) {
          addError(
            "teachingSkills",
            "One or more teaching skill IDs are invalid",
            ERROR_CODES.INVALID_FIELD_VALUE,
          );
        }

        const allSkillIdsAreStrings = teachingSkills.every(
          (skillId) => typeof skillId === "string",
        );

        if(!hasInvalidSkillId){
        if (
          hasDuplicateSkillIds(teachingSkills)
        ) {
          addError(
            "teachingSkills",
            "Teaching skills must not contain duplicate values",
            ERROR_CODES.INVALID_FIELD_VALUE,
          );
        }
      }}

  
      // Teaching Styles
     

      if (
        teachingStyles === undefined ||
        teachingStyles === null
      ) {
        addError(
          "teachingStyles",
          "Teaching styles are required",
          ERROR_CODES.TEACHING_PROFILE_INCOMPLETE,
        );
      } else if (!Array.isArray(teachingStyles)) {
        addError(
          "teachingStyles",
          "Teaching styles must be an array",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      } else if (teachingStyles.length === 0) {
        addError(
          "teachingStyles",
          "At least one teaching style is required",
          ERROR_CODES.TEACHING_PROFILE_INCOMPLETE,
        );
      } else {
        const hasInvalidTeachingStyle =
          teachingStyles.some(
            (style) =>
              typeof style !== "string" ||
              !Object.values(TEACHING_STYLES).includes(
                style,
              ),
          );

        if (hasInvalidTeachingStyle) {
          addError(
            "teachingStyles",
            "One or more teaching styles are invalid",
            ERROR_CODES.INVALID_TEACHING_STYLE,
          );
        }
        
        if(!hasInvalidTeachingStyle){
          if (hasDuplicates(teachingStyles)) {
              addError(
               "teachingStyles",
               "Teaching styles must not contain duplicate values",
               ERROR_CODES.INVALID_FIELD_VALUE,
               );
           }
         }
      }
    }
  }


  // 9. Throw all validation errors together


  if (errors.length > 0) {
    throw new ApiError(
      400,
      "Registration validation failed",
      ERROR_CODES.INVALID_REQUEST,
      errors,
    );
  }


  // 10. Normalize only after validation succeeds


  req.body.fullname = normalizedFullname;
  req.body.email = normalizedEmail;

  next();
};

export { validateRegister };
