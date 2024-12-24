// Validing my .env file by using the envalid library for ts implementation

import { cleanEnv, str } from "envalid";

const env = cleanEnv(process.env, {
  MODAL_API_KEY: str(),
});

export default env;
