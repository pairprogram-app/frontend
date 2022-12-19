import logo from "./logo.svg";
import "./App.css";
import Editor from "@monaco-editor/react";
import ShareDBMonaco from "sharedb-monaco";
import { useRecoilState, useRecoilValue } from "recoil";
import { connectionAtom, darkModeAtom, editorLanguageAtom, shareUrlAtom } from "./components/atoms";
import { useEffect, useRef } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { getHash, languages, makeHash } from "./components/hash";

function App() {
  const [darkMode, setDarkMode] = useRecoilState(darkModeAtom);
  const [connectionStatus, setConnectionStatus] =
    useRecoilState(connectionAtom);
  const [shareUrl, setShareUrl] = useRecoilState(shareUrlAtom);
  const [editorLanguage, setEditorLanguage] = useRecoilState(editorLanguageAtom)
  const editorRef = useRef(null);
  const bindingRef = useRef(null)

  const textClassName = darkMode ? "text-[#e3e3e3]" : "text-[#232323]";
  const bgClassName = darkMode ? "bg-[#232323]" : "bg-[#e3e3e3]";

  const loadingScreen = (
    <>
      <div className={"bg-[#1e1e1e] text-white h-full w-full text-xl"}>
        <span className="">Loading....</span>
      </div>
    </>
  );

  const DEBUG = false

  const file_path = "foo.js";
  const language_id = "javascript";

  const handleEditorMount = (editor, monaco) => {
    const sharedb = require("sharedb/lib/client");

    // Open WebSocket connection to ShareDB server
    const socket = new ReconnectingWebSocket(DEBUG ? "ws://localhost:8080" : "wss://pairprogram-backend.herokuapp.com");
    const connection = new sharedb.Connection(socket);

    socket.addEventListener("open", (event) => {
      setConnectionStatus(true);
    });

    const docID = getHash();
    const doc = connection.get(docID, file_path);
    doc.fetch(() => {
      if (doc.type === null) doc.create({ content: "" });
    });

    const binding = new ShareDBMonaco({
      id: file_path,
      monaco: monaco,
      sharePath: "content",
      namespace: docID,
      connection: connection,
      loadingText: "Loading file...",
    });

    editorRef.current = editor
    bindingRef.current = binding

    binding.add(editor, {
      langId: language_id
    });
  };

  // this runs once at the beginning to ensure that hash exists in URL
  useEffect(() => {
    const hash = getHash();
    // if hash in URL, set share URL and proceed normally. If not, add hash to url
    console.log("first hash is ", hash);
    if (hash) {
      setShareUrl(hash);
      console.log("hash valid, setting share URL");
    } else {
      console.log("invalid so making new");
      setShareUrl(makeHash());
    }

    window.addEventListener(
      "hashchange",
      () => {
        window.location.reload();
      },
      false
    );
  }, []);

  return (
    <div className="w-screen h-screen">
      <div className="grid grid-cols-12">
        <div className={`col-span-3 py-5 ${bgClassName} ${textClassName}`}>
          <div className="mx-4">
            <div className="mb-5">
              <div className="grid-cols-12">
                <div
                  className={`inline-block align-middle rounded-full w-2 h-2 ${
                    connectionStatus ? "bg-green-700" : "bg-red-700"
                  }`}
                ></div>
                <p className="ml-3 text-sm inline-block">
                  <em>{connectionStatus ? "Connected!" : "Connecting..."}</em>
                </p>
                <h1 className="text-lg font-bold my-2">Dark Mode:</h1>
                <label className="inline-flex relative items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="sr-only peer"
                    onClick={() => {
                      setDarkMode(!darkMode);
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium">Toggle me</span>
                </label>
              </div>
            </div>

            <div className="my-5">
              <label className="mr-5 text-lg font-bold" htmlFor="language">
                Language:
              </label>
              <select value={editorLanguage} onChange={(e)=>{
                setEditorLanguage(e.target.value)
                bindingRef.current.add(editorRef.current, {langId: e.target.value})
                }} className="text-black">
                {languages.map((value, i) => {
                  return (
                    <option key={i} value={value}>
                      {value}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="my-5">
              <h1 className="text-lg font-bold my-2">Share Link:</h1>
              <div className="copy-link">
                <input
                  type="text"
                  className="copy-link-input text-black"
                  value={`https://pairprogram.me/#${shareUrl}`}
                  readOnly
                />
                <button type="button" className="copy-link-button px-6">
                  <span className="material-icons">Copy</span>
                </button>
              </div>
            </div>

            <div className="mb-0">
              <h1 className="text-lg font-bold">Active Users:</h1>
            </div>
          </div>
        </div>

        <div className="col-span-9 max-w-full">
          <Editor
            height="100vh"
            width="100"
            defaultLanguage="javascript"
            language={editorLanguage}
            loading={loadingScreen}
            theme={darkMode ? "vs-dark" : "light"}
            onMount={handleEditorMount}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
