import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

const API_BASE_URL = 'https://web.izrk.zrc-sazu.si'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('izrk.jwt')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api, API_BASE_URL }
