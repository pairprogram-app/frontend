const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const idLen = 6;

export const makeHash = () => {
  let id = "";
    for (let i = 0; i < idLen; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    window.history.replaceState(null, "", "#" + id);
    return id
}

export const getHash = () => {
  if (window.location.hash) return window.location.hash.slice(1);
  else return null
}

export const languages = [
  "bat",
  "c",
  "clojure",
  "coffeescript",
  "cpp",
  "csharp",
  "css",
  "dart",
  "dockerfile",
  "fsharp",
  "go",
  "graphql",
  "html",
  "ini",
  "java",
  "javascript",
  "json",
  "julia",
  "kotlin",
  "lua",
  "markdown",
  "objective - c",
  "pascal",
  "perl",
  "php",
  "plaintext",
  "powerquery",
  "powershell",
  "python",
  "r",
  "restructuredtext",
  "ruby",
  "rust",
  "scala",
  "shell",
  "sql",
  "swift",
  "systemverilog",
  "typescript",
  "vb",
  "xml",
  "yaml",
];
