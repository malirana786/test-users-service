import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../utils/dynamo.js";
import { v4 as uuidv4 } from "uuid";
import { bindLogContext } from "../utils/logger.js";

const TABLE = process.env.USER_TABLE;

export const userUpsertConsumer = async (event) => {
  const log = bindLogContext({ function: "userUpsertConsumer" });

  log.info(`Consumer: received ${event.Records.length} records`);
  for (const rec of event.Records) {
    try {
      const msg = JSON.parse(rec.body);
      const user = msg.payload;

      const uuid = user.uuid ?? uuidv4();
      const fullName = `${user.firstname} ${user.lastname}`.trim();
      const createdAt = new Date().toISOString();

      const item = {
        uuid,
        fullName,
        firstname: user.firstname,
        lastname: user.lastname,
        gender: user.gender,
        dateOfBirth: user.dob,
        createdAt,
        entity: "USER"
      };

      // PutCommand = upsert (overwrite if PK+SK matches)
      const cmd = new PutCommand({
        TableName: TABLE,
        Item: item
      });

      await docClient.send(cmd);
      log.info(`Upserted user ${fullName} (${uuid})`);
    } catch (err) {
      log.error("Consumer record processing failed:", err);
      // Do not swallow serious errors silently; rethrow to trigger Lambda retry if desired.
      // For now we continue to next record; consider pushing failed records to DLQ in infra.
    }
  }
};
