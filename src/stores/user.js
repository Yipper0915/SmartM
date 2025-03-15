import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {
      full_name: '',
      // 其他用户信息字段
    }
  }),
  actions: {
    // 设置用户信息
    setUserInfo(info) {
      this.userInfo = info
    },
    // 清除用户信息
    clearUserInfo() {
      this.userInfo = {
        full_name: '',
        // 重置其他用户信息字段
      }
    }
  }
}) 