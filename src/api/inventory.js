import request from '@/utils/request'

// 获取材料列表
export function getMaterialList(params) {
  return request({
    url: '/inventory/materials',
    method: 'get',
    params
  })
}

// 获取单个材料详情
export function getMaterialDetail(id) {
  return request({
    url: `/inventory/materials/${id}`,
    method: 'get'
  })
}

// 新增材料
export function createMaterial(data) {
  return request({
    url: '/inventory/materials',
    method: 'post',
    data
  })
}

// 更新材料信息
export function updateMaterial(id, data) {
  return request({
    url: `/inventory/materials/${id}`,
    method: 'put',
    data
  })
}

// 删除材料
export function deleteMaterial(id) {
  return request({
    url: `/inventory/materials/${id}`,
    method: 'delete'
  })
}

// 材料入库
export function stockInMaterial(id, data) {
  return request({
    url: `/inventory/materials/${id}/stock-in`,
    method: 'post',
    data
  })
}

// 材料出库
export function stockOutMaterial(id, data) {
  return request({
    url: `/inventory/materials/${id}/stock-out`,
    method: 'post',
    data
  })
}

// 获取库存记录
export function getInventoryRecords(params) {
  return request({
    url: '/inventory/records',
    method: 'get',
    params
  })
} 