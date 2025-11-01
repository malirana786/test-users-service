import Joi from "joi";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { bindLogContext } from "../utils/logger.js";

const REGION = process.env.AWS_REGION || "eu-west-1";
const QUEUE_URL = process.env.USER_UPSERT_QUEUE_URL;
const sqs = new SQSClient({ region: REGION });

const schema = Joi.object({
  firstname: Joi.string().trim().min(1).max(100).required(),
  lastname: Joi.string().trim().min(1).max(100).required(),
  dob: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({ "string.pattern.base": "dob must be YYYY-MM-DD" }),
  gender: Joi.string().valid("male", "female", "other").insensitive().required(),
  uuid: Joi.string().optional()
}).options({ abortEarly: false, stripUnknown: true });

export const userUpsert = async (event) => {
  const log = bindLogContext({ function: "userUpsert" });
  log.info("Received user upsert request", { body: event.body });

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { value, error } = schema.validate(body);
    if (error) {
      log.warn("Validation failed", { details: error.details.map(d => d.message) });
      return jsonResponse(422, { error: "Validation failed", details: error.details.map(d => d.message) });
    }

    if (!QUEUE_URL) throw new Error("USER_UPSERT_QUEUE_URL not configured");

    const message = {
      action: "UPSERT_USER",
      timestamp: new Date().toISOString(),
      payload: value
    };

    const cmd = new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        action: { DataType: "String", StringValue: "UPSERT_USER" }
      }
    });

    const res = await sqs.send(cmd);
    log.info(`Enqueued user upsert message, MessageId: ${res.MessageId}`);
    return jsonResponse(202, { status: "accepted", messageId: res.MessageId });
  } catch (err) {
    log.error("userUpsert error:", err);
    return jsonResponse(500, { error: "Internal Server Error", details: err.message });
  }
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}
