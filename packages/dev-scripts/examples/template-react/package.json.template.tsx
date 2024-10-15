import type { Project } from "../util";

const template = (project: Project) => ({
  name: "@blocknote/example-" + project.projectSlug,
  description: "AUTO-GENERATED FILE, DO NOT EDIT DIRECTLY",
  private: true,
  version: "0.12.4",
  scripts: {
    start: "vite",
    dev: "vite",
    build: "tsc && vite build",
    preview: "vite preview",
    lint: "eslint . --max-warnings 0",
  },
  dependencies: {
    "@blocknote/core": "latest",
    "@blocknote/multi-column": "latest",
    "@blocknote/react": "latest",
    "@blocknote/ariakit": "latest",
    "@blocknote/mantine": "latest",
    "@blocknote/shadcn": "latest",
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    ...(project.config?.dependencies || {}),
  },
  devDependencies: {
    "@types/react": "^18.0.25",
    "@types/react-dom": "^18.0.9",
    "@vitejs/plugin-react": "^4.3.1",
    eslint: "^8.10.0",
    vite: "^5.3.4",
    ...(project.config?.devDependencies || {}),
  },
  eslintConfig: {
    extends: ["../../../.eslintrc.js"],
  },
  eslintIgnore: ["dist"],
});

export default template;
