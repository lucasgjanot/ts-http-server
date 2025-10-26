import { Request, Response } from "express";
import { config } from "../../config.js";
import { deleteUsers } from "../../db/query/user.js";
import { UserForbiddenError } from "../../errors.js";


export async function handlerReset(_: Request, res: Response) {
  if (config.api.platform != "dev") {
    throw new UserForbiddenError("Reset is only allowed in dev environment.");
  } 
  config.api.fileServerHits = 0;
  await deleteUsers()
  res.write("Hits reset to 0 and all user were deleted from database");
  res.end();
}

