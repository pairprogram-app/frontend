import { atom, selector } from "recoil"
import { getHash } from "./hash"

export const darkModeAtom = atom({
    key: 'darkMode',
    default: true
})

export const languageAtom = atom({
    key: 'language',
    default: 'javascript'
})

export const shareUrlAtom = atom({
    key: 'shareUrl',
    default: getHash(),
})

export const connectionAtom = atom({
    key: 'connection',
    default: false
})

export const editorLanguageAtom = atom({
    key: 'editorLanguage',
    default: 'javascript'
})

export const userListAtom = atom({
    key: 'userList',
    default: []
})

export const myNameAtom = atom({
    key: 'myName',
    default: ""
})