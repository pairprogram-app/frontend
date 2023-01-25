import "./App.css";
import Editor from "@monaco-editor/react";
import ShareDBMonaco from "sharedb-monaco";
import { VscAccount } from "react-icons/vsc";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  connectionAtom,
  darkModeAtom,
  editorLanguageAtom,
  myNameAtom,
  shareUrlAtom,
  userListAtom,
} from "./components/atoms";
import { useEffect, useRef } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { getHash, languages, makeHash } from "./components/hash";
import {
  Box,
  Center,
  Image,
  Flex,
  Badge,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Stack,
  Select,
  useClipboard,
  Input,
  Button,
  Grid,
  GridItem,
  List,
  ListItem,
  UnorderedList,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { User } from "./components/User";

function App() {
  const [darkMode, setDarkMode] = useRecoilState(darkModeAtom);
  const [connectionStatus, setConnectionStatus] =
    useRecoilState(connectionAtom);
  const [shareUrl, setShareUrl] = useRecoilState(shareUrlAtom);
  const [editorLanguage, setEditorLanguage] =
    useRecoilState(editorLanguageAtom);
  const bindingRef = useRef(null);
  const shareUrlClipboard = useClipboard("");
  const { onCopy, setValue, hasCopied } = useClipboard();
  const baseUrl = "https://shreyjoshi.com/pairprogram.app/#";
  const [userList, setUserList] = useRecoilState(userListAtom);
  const [myName, setMyName] = useRecoilState(myNameAtom);

  const loadingScreen = (
    <Text h={"full"} w={"full"} bgColor={"#1e1e1e"} textColor={"white"}>
      Loading Editor...
    </Text>
  );

  const DEBUG = false;

  const file_path = "foo.js";
  const language_id = "javascript";

  const handleEditorMount = (editor, monaco) => {
    const sharedb = require("sharedb/lib/client");

    // Open WebSocket connection to ShareDB server
    const socket = new ReconnectingWebSocket(
      DEBUG ? "ws://localhost:8080" : "wss://pairprogram-backend.herokuapp.com"
    );
    const connection = new sharedb.Connection(socket);

    socket.addEventListener("open", (event) => {
      setConnectionStatus(true);
    });

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      if (data.username) {
        setMyName(data.username);
      } else if (data.names) {
        setUserList(data.names);
      } else {
        // message is malformed, so throw error
      }
      // then update userlist with setUserList() to include new people
    });

    const docID = getHash();
    const doc = connection.get(docID, file_path);
    doc.fetch(() => {
      if (doc.type === null)
        doc.create({
          content: `// Share this URL to allow others to edit and see your changes in real-time:\n// ${baseUrl}${docID}`,
        });
    });

    const binding = new ShareDBMonaco({
      id: file_path,
      monaco: monaco,
      sharePath: "content",
      namespace: docID,
      connection: connection,
      loadingText: "Loading file...",
    });

    bindingRef.current = binding;

    binding.add(editor, {
      langId: language_id,
    });
  };

  // this runs once at the beginning to ensure that hash exists in URL
  useEffect(() => {
    const hash = getHash();

    // if hash in URL, set share URL and proceed normally. If not, add hash to url
    console.log("first hash is ", hash);
    if (hash) {
      setShareUrl(hash);
      setValue(baseUrl + hash);
      console.log("hash valid, setting share URL");
    } else {
      console.log("invalid so making new");
      const newHash = makeHash();
      setShareUrl(newHash);
      setValue(baseUrl + newHash);
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
    <Grid
      templateAreas={`"header header" "nav main"`}
      gridTemplateRows={"30px 1fr"}
      gridTemplateColumns={"300px 1fr"}
      height={"200px"}
    >
      <GridItem py={1} bgColor={"#333"} area={`header`}>
        <Center>
          <Text
            mr={0}
            fontWeight={"normal"}
            fontSize={"sm"}
            textColor={"#e3e3e3"}
          >
            pairprogram.app
          </Text>
        </Center>
      </GridItem>

      <GridItem py={5} textColor={"#e3e3e3"} bgColor={"#232323"} area={`nav`}>
        <Box mx={4}>
          <Box
            className={`inline-block align-middle rounded-full w-2 h-2 ${
              connectionStatus ? "bg-green-700" : "bg-red-700"
            }`}
          ></Box>

          <Text className="inline-block" ml={3} mb={5} fontSize="sm">
            <em>{connectionStatus ? "Connected!" : "Connecting..."}</em>
          </Text>
          {/* 
                <Box display="flex" alignItems="center">
                  <FormLabel
                    htmlFor="dark-mode"
                    fontSize="lg"
                    fontWeight="bold"
                    mb="0"
                  >
                    Dark Mode:
                  </FormLabel>
                  <Switch
                    id="dark-mode"
                    defaultChecked
                    onChange={() => {
                      setDarkMode(!darkMode);
                    }}
                  />
                </Box> */}

          <Stack spacing={2}>
            <Text fontWeight="bold" fontSize="lg">
              Language:
            </Text>
            <Select
              size="sm"
              value={editorLanguage}
              bgColor={"#232323"}
              onChange={(e) => {
                setEditorLanguage(e.target.value);
                bindingRef.current.setLangId(e.target.value);
              }}
            >
              {languages.map((value, i) => {
                return (
                  <option key={i} value={value}>
                    {value}
                  </option>
                );
              })}
            </Select>
          </Stack>

          <Text fontSize="lg" fontWeight="bold" mt={5} mb={2}>
            Share Link:
          </Text>

          <Flex mb={2}>
            <Input
              fontSize={"xs"}
              px={2}
              value={`${baseUrl}${shareUrl}`}
              mr={2}
              readOnly
            />
            <Button color={"#232323"} bgColor={"#d3d3d3"} onClick={onCopy}>
              {hasCopied ? "Copied!" : "Copy"}
            </Button>
          </Flex>
          <Text fontSize={"lg"} fontWeight={"bold"} mt={5}>
            Active Users:
          </Text>
          <List>
            {userList.map((name, idx) => {
              return (
                <ListItem key={idx}>
                  <User name={name} isMe={name === myName}></User>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </GridItem>

      <GridItem area={"main"} minWidth={100}>
        <Editor
          height="100vh"
          width="100"
          language={editorLanguage}
          loading={loadingScreen}
          theme={darkMode ? "vs-dark" : "light"}
          onMount={handleEditorMount}
          defaultValue=""
        />
      </GridItem>
    </Grid>
  );
}

export default App;
