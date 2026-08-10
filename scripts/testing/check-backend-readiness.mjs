#!/usr/bin/env node

import fs from "node:fs";
import process from "node:process";

import { checkBackendReadiness } from "./backend-preflight.mjs";

if (!process.env.EXAMPLE_API_BASE_URL && fs.existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const result = await checkBackendReadiness();
const output = result.ok ? console.log : console.error;
output(result.message);
if (!result.ok) process.exitCode = 1;
