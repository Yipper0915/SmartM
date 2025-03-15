import request from '@/utils/request'

// 获取公告列表
export function getNotices() {
  return request({
    url: '/notices',
    method: 'get'
  })
}

// 新增公告
export function addNotice(data) {
  return request({
    url: '/notices',
    method: 'post',
    data
  })
}

// 更新公告
export function updateNotice(data) {
  return request({
    url: `/notices/${data.id}`,
    method: 'put',
    data
  })
}

// 删除公告
export function deleteNotice(id) {
  return request({
    url: `/notices/${id}`,
    method: 'delete'
  })
} 