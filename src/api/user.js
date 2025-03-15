import request from '@/utils/request'

// 获取当前用户信息
export function getCurrentUser() {
  return request({
    url: '/users/current',
    method: 'get'
  })
}

// 获取角色列表
export function getRoleList() {
  return request({
    url: '/users/roles',
    method: 'get'
  })
}

// 获取用户列表
export function getUserList() {
  return request({
    url: '/users',
    method: 'get'
  })
}

// 创建用户
export function createUser(data) {
  return request({
    url: '/users',
    method: 'post',
    data
  })
}

// 更新用户
export function updateUser(id, data) {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data
  })
}

// 删除用户
export function deleteUser(id) {
  return request({
    url: `/users/${id}`,
    method: 'delete'
  })
}

// 重置用户密码
export function resetUserPassword(id) {
  return request({
    url: `/users/${id}/reset-password`,
    method: 'post'
  })
}

// 更新个人资料
export function updateProfile(data) {
  return request({
    url: '/users/profile',
    method: 'put',
    data
  })
}

// 更新头像
export function updateAvatar(data) {
  return request({
    url: '/users/avatar',
    method: 'post',
    data
  })
} 