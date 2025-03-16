import request from '@/utils/request'

// 获取项目统计数据
export function getProjectStats() {
  return request({
    url: '/projects/stats',
    method: 'get'
  })
}

// 获取项目列表
export function getProjectList() {
  return request({
    url: '/projects',
    method: 'get'
  })
}

// 创建项目
export function createProject(data) {
  return request({
    url: '/projects',
    method: 'post',
    data
  })
}

// 更新项目
export function updateProject(id, data) {
  return request({
    url: `/projects/${id}`,
    method: 'put',
    data
  })
}

// 删除项目
export function deleteProject(id) {
  return request({
    url: `/projects/${id}`,
    method: 'delete'
  })
}

// 获取库存管理员列表
export function getInventoryManagers(params) {
  return request({
    url: '/api/users',
    method: 'get',
    params: {
      role_id: params?.role_id,
      search: params?.search
    }
  })
} 