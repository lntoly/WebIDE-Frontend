import api from 'backendAPI'
import { toJS } from 'mobx'
import FileStore from 'commons/File/store'
import * as TabActions from 'components/Tab/actions'
import state from './state'
import ChatManager from './ot/chat'
import config from 'config'
import remove from 'lodash/remove'
import dispatchCommand from 'commands/dispatchCommand'

export const fetchCollaborators = () => {
  if (state.loading) return
  state.loading = true
  const collaboratorsList = api.fetchCollaborators()
  const requestList = api.fetchCollaborators('Request')
  return Promise.all([collaboratorsList, requestList]).then(([collaboratorsRes, requestRes]) => {
    const res = collaboratorsRes.concat(requestRes)
  // return api.fetchCollaborators().then((res) => {
    state.collaborators = res.map((item) => {
      if (!/^(http|https):\/\/[^ "]+$/.test(item.collaborator.avatar)) {
        item.collaborator.avatar = `https://coding.net${item.collaborator.avatar}`
      }
      const oldItem = state.collaborators.find((c) => c.collaborator.globalKey === item.collaborator.globalKey)
      if (oldItem) {
        item.online = oldItem.online
        item.clientIds = oldItem.clientIds
      } else {
        item.online = false
        item.clientIds = []
      }
      item.path = ''
      const pathItem = state.paths[item.collaborator.globalKey]
      if (pathItem) {
        item.path = pathItem
      }
      return item
    })
    state.loading = false
    return res
  })
}

export const fetchInvitedCollaborators = () => {
  return api.fetchCollaborators('Invited').then((res) => {
    state.invited = res
  })
}

export const rejectCollaborator = (id) => {
  return api.rejectCollaborator(id).then((res) => {
    remove(state.collaborators, (n) => {
      return n.id === id
    })
  })
}

export const postCollaborators = (inviteKey) => {
  return api.postCollaborators(inviteKey).then(res => {
    const chatManager = new ChatManager()
    chatManager.sendAction({ action: 'Add' })
  })
}

export const deleteCollaborators = (id, globalKey) => {
  return api.deleteCollaborators(id).then(res => {
    const chatManager = new ChatManager()
    chatManager.sendAction({ action: 'Remove', globalKey })
  })
}

export const openFile = ({ path }) => {
  dispatchCommand('file:open_file', path)
}

export const saveChat = () => {
  const currentChatList = (toJS(state.chatList))
  let chatStorage = localStorage.getItem('chat')
  if (!chatStorage) {
    chatStorage = {}
    chatStorage[config.spaceKey] = {}
  } else {
    chatStorage = JSON.parse(chatStorage)
    if (!chatStorage[config.spaceKey]) {
      chatStorage[config.spaceKey] = {}
    }
  }
  chatStorage[config.spaceKey][config.globalKey] = currentChatList
  localStorage.setItem('chat', JSON.stringify(chatStorage))
}

export const loadChat = () => {
  let chatStorage = localStorage.getItem('chat')
  if (!chatStorage) {
    chatStorage = {}
  } else {
    chatStorage = JSON.parse(chatStorage)
  }
  if (!chatStorage[config.spaceKey]) {
    chatStorage[config.spaceKey] = {}
  }
  if (!chatStorage[config.spaceKey][config.globalKey]) {
    chatStorage[config.spaceKey][config.globalKey] = []
  }
  state.chatList = chatStorage[config.spaceKey][config.globalKey]
}