import ApiError from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import {
  ACCOUNT_TYPES,
  TEACHING_STYLES,
  LANGUAGES
} from "../../constants/enums.js";


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

//ACCOUNT UPGRADE

const ALLOWED_ACCOUNT_UPGRADE_FIELDS = [
  "accountType",
  "teachingSkills",
  "teachingStyles",
];

const validateAccountUpgrade = (req, _ , next) => {
  const errors = [];

  const body = req.body || {};

  const addError = (field, message, code) => {
    errors.push({
      field,
      message,
      code,
    });
  };


  // 1. Unknown fields

  const receivedFields = Object.keys(body);

  const unknownFields = receivedFields.filter(
    (field) =>
      !ALLOWED_ACCOUNT_UPGRADE_FIELDS.includes(field),
  );

  unknownFields.forEach((field) => {
    addError(
      field,
      `Unknown account upgrade field: ${field}`,
      ERROR_CODES.INVALID_REQUEST,
    );
  });


  const {
    accountType,
    teachingSkills,
    teachingStyles,
  } = body;


  // 2. Target account type

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
  } else if (
    accountType !== ACCOUNT_TYPES.TEACHER &&
    accountType !== ACCOUNT_TYPES.TEACHER_LEARNER
  ) {
    addError(
      "accountType",
      "Invalid account type for upgrade",
      ERROR_CODES.INVALID_ACCOUNT_TYPE,
    );
  }


  // 3. Teaching skills

  if (teachingSkills !== undefined) {
    if (!Array.isArray(teachingSkills)) {
      addError(
        "teachingSkills",
        "Teaching skills must be an array",
        ERROR_CODES.INVALID_FIELD_VALUE,
      );
    } else if (teachingSkills.length === 0) {
      addError(
        "teachingSkills",
        "Teaching skills must not be empty",
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

      if (
        !hasInvalidSkillId &&
        hasDuplicateSkillIds(teachingSkills)
      ) {
        addError(
          "teachingSkills",
          "Teaching skills must not contain duplicate values",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      }
    }
  }


  // 4. Teaching styles

  if (teachingStyles !== undefined) {
    if (!Array.isArray(teachingStyles)) {
      addError(
        "teachingStyles",
        "Teaching styles must be an array",
        ERROR_CODES.INVALID_FIELD_VALUE,
      );
    } else if (teachingStyles.length === 0) {
      addError(
        "teachingStyles",
        "Teaching styles must not be empty",
        ERROR_CODES.TEACHING_PROFILE_INCOMPLETE,
      );
    } else {
      const hasInvalidTeachingStyle =
        teachingStyles.some(
          (style) =>
            typeof style !== "string" ||
            !Object.values(TEACHING_STYLES).includes(style),
        );

      if (hasInvalidTeachingStyle) {
        addError(
          "teachingStyles",
          "One or more teaching styles are invalid",
          ERROR_CODES.INVALID_TEACHING_STYLE,
        );
      }

      if (
        !hasInvalidTeachingStyle &&
        hasDuplicates(teachingStyles)
      ) {
        addError(
          "teachingStyles",
          "Teaching styles must not contain duplicate values",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      }
    }
  }


  // 5. Throw validation errors

  if (errors.length > 0) {
    throw new ApiError(
      400,
      "Account upgrade validation failed",
      ERROR_CODES.INVALID_REQUEST,
      errors,
    );
  }

  next();
};


//GET USER PROFILE
const validateUserIdParam = (req, res, next) => {
  const { userId } = req.params;

  if (
    !userId ||
    typeof userId !== "string" ||
    !OBJECT_ID_REGEX.test(userId)
  ) {
    throw new ApiError(
      400,
      "Invalid user ID",
      ERROR_CODES.INVALID_FIELD_VALUE,
      [
        {
          field: "userId",
          message: "User ID must be a valid MongoDB ObjectId",
          code: ERROR_CODES.INVALID_FIELD_VALUE,
        },
      ],
    );
  }

  next();
};


//UPDATE USER

const ALLOWED_PROFILE_UPDATE_FIELDS = [
  "fullname",
  "languages",
];

const validateUpdateProfile = (req, _res, next) => {
  const errors = [];

  const body = req.body || {};

  const addError = (field, message, code) => {
    errors.push({
      field,
      message,
      code,
    });
  };


  // 1. Reject unknown body fields

  const receivedFields = Object.keys(body);

  const unknownFields = receivedFields.filter(
    (field) =>
      !ALLOWED_PROFILE_UPDATE_FIELDS.includes(field),
  );

  unknownFields.forEach((field) => {
    addError(
      field,
      `Unknown profile update field: ${field}`,
      ERROR_CODES.INVALID_REQUEST,
    );
  });


  const { fullname } = body;

  let { languages } = body;


  // 2. At least one field must be provided

  if (
    fullname === undefined &&
    languages === undefined &&
    !req.file
  ) {
    addError(
      "profile",
      "At least one profile field must be provided",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  }


  // 3. Fullname

  let normalizedFullname;

  if (fullname !== undefined) {
    if (
      typeof fullname !== "string" ||
      fullname.trim() === ""
    ) {
      addError(
        "fullname",
        "Fullname must be a non-empty string",
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
  }


  // 4. Languages

  if (languages !== undefined) {

    // Multer may give a single value as a string.
    // Normalize it into an array.
    if (typeof languages === "string") {
      languages = [languages];
    }

    if (!Array.isArray(languages)) {
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

      if (
        !hasInvalidLanguage &&
        hasDuplicates(languages)
      ) {
        addError(
          "languages",
          "Languages must not contain duplicate values",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      }
    }
  }


  // 5. Throw validation errors

  if (errors.length > 0) {
    throw new ApiError(
      400,
      "Profile update validation failed",
      ERROR_CODES.INVALID_REQUEST,
      errors,
    );
  }


  // 6. Normalize after validation

  if (normalizedFullname !== undefined) {
    req.body.fullname = normalizedFullname;
  }

  if (languages !== undefined) {
    req.body.languages = languages;
  }


  next();
};

//UPDATE TEACHING FIELDS

const ALLOWED_TEACHING_PROFILE_FIELDS = [
    "teachingSkills",
    "teachingStyles",
  ];

const validateUpdateTeachingProfile = (req, _res, next) => {
  const errors = [];

  const body = req.body || {};

  const addError = (field, message, code) => {
    errors.push({
      field,
      message,
      code,
    });
  };


  // 1. Allow only teaching profile fields

  const receivedFields = Object.keys(body);

  const unknownFields = receivedFields.filter(
    (field) =>
      !ALLOWED_TEACHING_PROFILE_FIELDS.includes(field),
  );

  unknownFields.forEach((field) => {
    addError(
      field,
      `Unknown teaching profile field: ${field}`,
      ERROR_CODES.INVALID_REQUEST,
    );
  });


  const {
    teachingSkills,
    teachingStyles,
  } = body;


  // 2. At least one field must be provided

  if (
    teachingSkills === undefined &&
    teachingStyles === undefined
  ) {
    addError(
      "teachingProfile",
      "At least one teaching profile field must be provided",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  }


  // 3. Teaching skills

  if (teachingSkills !== undefined) {
    if (!Array.isArray(teachingSkills)) {
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

      if (
        !hasInvalidSkillId &&
        hasDuplicateSkillIds(teachingSkills)
      ) {
        addError(
          "teachingSkills",
          "Teaching skills must not contain duplicate values",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      }
    }
  }


  // 4. Teaching styles

  if (teachingStyles !== undefined) {
    if (!Array.isArray(teachingStyles)) {
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
            !Object.values(TEACHING_STYLES).includes(style),
        );

      if (hasInvalidTeachingStyle) {
        addError(
          "teachingStyles",
          "One or more teaching styles are invalid",
          ERROR_CODES.INVALID_TEACHING_STYLE,
        );
      }

      if (
        !hasInvalidTeachingStyle &&
        hasDuplicates(teachingStyles)
      ) {
        addError(
          "teachingStyles",
          "Teaching styles must not contain duplicate values",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      }
    }
  }


  // 5. Throw collected errors

  if (errors.length > 0) {
    throw new ApiError(
      400,
      "Teaching profile update validation failed",
      ERROR_CODES.INVALID_REQUEST,
      errors,
    );
  }


  next();
};


//CHANGE PASSWORD

const ALLOWED_PASSWORD_CHANGE_FIELDS = [
  "currentPassword",
  "newPassword",
];


const validateChangePassword = (req, _res, next) => {
  const errors = [];

  const body = req.body || {};

  const addError = (field, message, code) => {
    errors.push({
      field,
      message,
      code,
    });
  };


  // 1. Reject unknown fields

  const receivedFields = Object.keys(body);

  const unknownFields = receivedFields.filter(
    (field) =>
      !ALLOWED_PASSWORD_CHANGE_FIELDS.includes(field),
  );

  unknownFields.forEach((field) => {
    addError(
      field,
      `Unknown password change field: ${field}`,
      ERROR_CODES.INVALID_REQUEST,
    );
  });


  const {
    currentPassword,
    newPassword,
  } = body;


  // 2. Current password

  if (
    currentPassword === undefined ||
    currentPassword === null ||
    currentPassword === ""
  ) {
    addError(
      "currentPassword",
      "Current password is required",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  } else if (typeof currentPassword !== "string") {
    addError(
      "currentPassword",
      "Current password must be a string",
      ERROR_CODES.INVALID_FIELD_VALUE,
    );
  }


  // 3. New password

  if (
    newPassword === undefined ||
    newPassword === null ||
    newPassword === ""
  ) {
    addError(
      "newPassword",
      "New password is required",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  } else if (typeof newPassword !== "string") {
    addError(
      "newPassword",
      "New password must be a string",
      ERROR_CODES.INVALID_FIELD_VALUE,
    );
  } else {
    if (newPassword.length < 8) {
      addError(
        "newPassword",
        "New password must be at least 8 characters long",
        ERROR_CODES.INVALID_FIELD_VALUE,
      );
    }


    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialCharacter =
      /[^A-Za-z0-9\s]/.test(newPassword);


    if (
      !hasUppercase ||
      !hasLowercase ||
      !hasNumber ||
      !hasSpecialCharacter
    ) {
      addError(
        "newPassword",
        "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        ERROR_CODES.INVALID_FIELD_VALUE,
      );
    }
  }


  // 4. Throw collected errors

  if (errors.length > 0) {
    throw new ApiError(
      400,
      "Password change validation failed",
      ERROR_CODES.INVALID_REQUEST,
      errors,
    );
  }


  next();
};


export {
  validateAccountUpgrade,
  validateUserIdParam,
  validateUpdateProfile,
  validateUpdateTeachingProfile,
  validateChangePassword
};
