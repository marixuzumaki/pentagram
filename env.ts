// Validing my .env file by using the envalid library for ts implementation

import { cleanEnv, str } from "envalid";

const env = cleanEnv(process.env, {
  API_KEY: str(),
});

export default env;
