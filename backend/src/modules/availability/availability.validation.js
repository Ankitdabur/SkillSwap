import ApiError from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { DAYS_OF_WEEK } from "../../constants/enums.js";


const ALLOWED_BODY_FIELDS = [
  "availability",
];

const ALLOWED_AVAILABILITY_FIELDS = [
  "day",
  "startTime",
  "endTime",
];

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;


const validateUpdateAvailability = (req, _res, next) => {
  const errors = [];

  const body = req.body || {};

  const addError = (field, message, code) => {
    errors.push({
      field,
      message,
      code,
    });
  };


  // 1. Check unknown request fields


  const receivedFields = Object.keys(body);

  const unknownFields = receivedFields.filter(
    (field) => !ALLOWED_BODY_FIELDS.includes(field),
  );

  unknownFields.forEach((field) => {
    addError(
      field,
      `Unknown field: ${field}`,
      ERROR_CODES.INVALID_REQUEST,
    );
  });

  const {
    availability,
  } = body;


  // 2. Complete availability array


  if (
    availability === undefined ||
    availability === null
  ) {
    addError(
      "availability",
      "Availability is required",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  } else if (!Array.isArray(availability)) {
    addError(
      "availability",
      "Availability must be an array",
      ERROR_CODES.INVALID_FIELD_VALUE,
    );
  } else if (availability.length === 0) {
    addError(
      "availability",
      "At least one availability slot is required",
      ERROR_CODES.MISSING_REQUIRED_FIELDS,
    );
  } else {
    const validAvailabilitySlots = [];

    availability.forEach((slot, index) => {
      if (
        typeof slot !== "object" ||
        slot === null ||
        Array.isArray(slot)
      ) {
        addError(
          `availability[${index}]`,
          "Availability slot must be an object",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );

        return;
      }


      // Unknown availability fields


      const receivedSlotFields = Object.keys(slot);

      const unknownSlotFields = receivedSlotFields.filter(
        (field) =>
          !ALLOWED_AVAILABILITY_FIELDS.includes(field),
      );

      unknownSlotFields.forEach((field) => {
        addError(
          `availability[${index}].${field}`,
          `Unknown availability field: ${field}`,
          ERROR_CODES.INVALID_REQUEST,
        );
      });

      const {
        day,
        startTime,
        endTime,
      } = slot;


      // Day


      const validDay =
        typeof day === "string" &&
        Object.values(DAYS_OF_WEEK).includes(day);

      if (
        day === undefined ||
        day === null ||
        day === ""
      ) {
        addError(
          `availability[${index}].day`,
          "Availability day is required",
          ERROR_CODES.MISSING_REQUIRED_FIELDS,
        );
      } else if (!validDay) {
        addError(
          `availability[${index}].day`,
          "Invalid availability day",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      }


      // Start time


      const validStartTime =
        typeof startTime === "string" &&
        TIME_REGEX.test(startTime);

      if (
        startTime === undefined ||
        startTime === null ||
        startTime === ""
      ) {
        addError(
          `availability[${index}].startTime`,
          "Start time is required",
          ERROR_CODES.MISSING_REQUIRED_FIELDS,
        );
      } else if (!validStartTime) {
        addError(
          `availability[${index}].startTime`,
          "Start time must use HH:mm format",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      }


      // End time


      const validEndTime =
        typeof endTime === "string" &&
        TIME_REGEX.test(endTime);

      if (
        endTime === undefined ||
        endTime === null ||
        endTime === ""
      ) {
        addError(
          `availability[${index}].endTime`,
          "End time is required",
          ERROR_CODES.MISSING_REQUIRED_FIELDS,
        );
      } else if (!validEndTime) {
        addError(
          `availability[${index}].endTime`,
          "End time must use HH:mm format",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      }


      // Time range


      const validTimeRange =
        validStartTime &&
        validEndTime &&
        endTime > startTime;

      if (
        validStartTime &&
        validEndTime &&
        !validTimeRange
      ) {
        addError(
          `availability[${index}].endTime`,
          "End time must be later than start time",
          ERROR_CODES.INVALID_FIELD_VALUE,
        );
      }

      if (
        validDay &&
        validTimeRange
      ) {
        validAvailabilitySlots.push({
          index,
          day,
          startTime,
          endTime,
        });
      }
    });


    // Duplicate and overlapping slots


    validAvailabilitySlots.forEach(
      (currentSlot, currentIndex) => {
        for (
          let previousIndex = 0;
          previousIndex < currentIndex;
          previousIndex += 1
        ) {
          const previousSlot =
            validAvailabilitySlots[previousIndex];

          if (currentSlot.day !== previousSlot.day) {
            continue;
          }

          const duplicateSlot =
            currentSlot.startTime ===
              previousSlot.startTime &&
            currentSlot.endTime ===
              previousSlot.endTime;

          if (duplicateSlot) {
            addError(
              `availability[${currentSlot.index}]`,
              "Availability must not contain duplicate slots",
              ERROR_CODES.INVALID_FIELD_VALUE,
            );

            break;
          }

          const previousStartIsBetweenCurrentSlot =
            previousSlot.startTime >=
              currentSlot.startTime &&
            previousSlot.startTime <
              currentSlot.endTime;

          const previousEndIsBetweenCurrentSlot =
            previousSlot.endTime >
              currentSlot.startTime &&
            previousSlot.endTime <=
              currentSlot.endTime;

          const previousSlotContainsCurrentSlot =
            previousSlot.startTime <
              currentSlot.startTime &&
            previousSlot.endTime >
              currentSlot.endTime;

          const overlappingSlot =
            previousStartIsBetweenCurrentSlot ||
            previousEndIsBetweenCurrentSlot ||
            previousSlotContainsCurrentSlot;

          if (overlappingSlot) {
            addError(
              `availability[${currentSlot.index}]`,
              "Availability slots must not overlap",
              ERROR_CODES.INVALID_FIELD_VALUE,
            );

            break;
          }
        }
      },
    );
  }


  // 3. Throw all validation errors together


  if (errors.length > 0) {
    throw new ApiError(
      400,
      "Availability replacement validation failed",
      ERROR_CODES.INVALID_REQUEST,
      errors,
    );
  }

  next();
};


export {
  validateUpdateAvailability,
};
