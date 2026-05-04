import { Hono } from "hono"
import { handle } from "hono/vercel"
import { HTTPException } from "hono/http-exception"

import changelog from "./changelog"
import { inferErrorStatus, parseErrorMessage } from "./errors"
import edit from "./edit"
import github from "./github"
import gemini from "./gemini"

export const runtime = "edge"

const app = new Hono().basePath("/api")

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return error.getResponse()
  }

  const message = parseErrorMessage(error, "Internal server error")
  const status = inferErrorStatus(message)
  return c.json({ error: message }, status)
})

const routes = app
  .route("/changelog", changelog)
  .route("/edit", edit)
  .route("/github", github)
  .route("/ai", gemini)

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;