import request from '@/utils/request'

// 获取任务类型列表
export function getTaskTypes() {
  return request({
    url: '/tasks/types',
    method: 'get'
  })
}

// 获取任务优先级列表
export function getTaskPriorities() {
  return request({
    url: '/tasks/priorities',
    method: 'get'
  })
}

// 获取项目任务列表
export function getProjectTasks(projectId) {
  return request({
    url: `/tasks/project/${projectId}`,
    method: 'get'
  })
}

// 创建任务
export function createTask(data) {
  return request({
    url: '/tasks',
    method: 'post',
    data
  })
}

// 更新任务
export function updateTask(id, data) {
  return request({
    url: `/tasks/${id}`,
    method: 'put',
    data
  })
}

// 删除任务
export function deleteTask(id) {
  return request({
    url: `/tasks/${id}`,
    method: 'delete'
  })
}

// 获取项目步骤数量
export function getProjectSteps(projectId) {
  return request({
    url: `/tasks/steps/${projectId}`,
    method: 'get'
  })
}

// 创建项目步骤-没用
export function createProjectStep(data) {
  return request({
    url: '/projects/steps',
    method: 'post',
    data
  })
}

// 更新项目步骤-没用
export function updateProjectStep(id, data) {
  return request({
    url: `/projects/steps/${id}`,
    method: 'put',
    data
  })
}

// 删除项目步骤-没用
export function deleteProjectStep(id) {
  return request({
    url: `/projects/steps/${id}`,
    method: 'delete'
  })
}

// 更新项目步骤数量
export function updateSteps(projectId, data) {
  return request({
    url: `/tasks/steps/${projectId}`,
    method: 'put',
    data
  })
}