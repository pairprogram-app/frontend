import { HStack, Icon, Text } from "@chakra-ui/react"
import { useRecoilState } from "recoil";
import { darkModeAtom } from "./atoms";
import { VscAccount } from "react-icons/vsc";

export const User = (props) => {
    const [darkMode, setDarkMode] = useRecoilState(darkModeAtom);

    return (
    <HStack
        p={2}
        rounded="md"
        _hover={{
            bgColor: darkMode ? "#464647" : "gray.200",
            // cursor: "pointer",
        }}
    // onClick={() => isMe && onOpen()}
    >
        <Icon as={VscAccount} />
        <Text fontSize={"medium"} fontWeight="normal" color={"#ccc"}>
            {props.name} {props.isMe && "(you)"}
        </Text>

    </HStack>)
}