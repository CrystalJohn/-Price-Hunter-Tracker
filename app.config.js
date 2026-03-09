// Load .env variables during expo start/build so Constants.expoConfig.extra uses them
const appJson = require("./app.json");
try {
  const dotenv = require("dotenv");
  dotenv.config();
} catch (e) {
  // dotenv not installed or not available in this environment — continue using process.env or app.json extras
}

module.exports = () => {
  const expo = { ...appJson.expo };
  expo.extra = {
    ...expo.extra,
    EXPO_PUBLIC_SUPABASE_URL:
      process.env.EXPO_PUBLIC_SUPABASE_URL ??
      expo.extra?.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      expo.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  };
  return { expo };
};
