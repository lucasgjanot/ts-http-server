import { Request, Response } from "express";
import { upgradeUser } from "../db/query/user.js";
import { BadRequestError, NotFoundError, UserNotAuthenticatedError } from "../errors.js";
import { getAPIKey } from "../auth.js";
import { config } from "../config.js";

export async function handlerPolkaWebhook(req: Request, res: Response) {
    type parameters = {
        event: string,
        data: {
            userId: string
        } 
    }
    const apiKey = getAPIKey(req)
    if (apiKey != config.api.polkaKey) throw new UserNotAuthenticatedError("Invalid ApiKey") 
    const params: parameters = req.body

    if (!params || !params.event || !params.data || !params.data.userId) {
        throw new BadRequestError("Missing required fields");
    }

    if (params.event != "user.upgraded") {
        res.status(204).send();
        return;
    }

    const user = await upgradeUser(params.data.userId)
    if (!user) {
        throw new NotFoundError("User not found")
    }
    res.status(204).send()
    
}