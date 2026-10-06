import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...coreWebVitals,
  ...typescript,
  { ignores: [".next/**", ".next-studio/**", "node_modules/**", "public/ocr/**", "playwright-report/**", "test-results/**"] },
];

export default config;
