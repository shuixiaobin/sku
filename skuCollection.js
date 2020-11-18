let uid = 0
const idJoinStr = '__'
const defaultId = '_'
const blankSet = new Set()
export default class SkuManagement {
  constructor (skuList = []) {
    this.skuList = skuList
    this.goodsMap = {} // key: ids.join('_') value: 商品详情
    this.dispersedData = {} // {(id)<选择的二进制表示>: {(skuIdStr)<选中sku的id拼接>: [id<与选中sku关联的menuId>] }}
    this.menuMap = {} // key: 菜单名 value: 菜单id
    const skuNames = this.skuNames = skuList.length === 0 ? [] : skuList[0].skuPath.map(item => item.title)
    this.skuMenu = skuNames.map(item => []) // sku菜单
    this.skuIdMenu = skuNames.map(item => []) // sku菜单id
    this.init()
  }

  getMenuIsDisabled (selected) {
    const menuIds = selected.map(n => n && this.menuMap[n] || null)
    const ret = []
    const len = menuIds.length
    for (var i = 0; i < len; i++) {
      let curIds = []
      let curKey = 0
      for (var j = 0; j < len; j++) {
        if (i === j) continue
        if (menuIds[j]) {
          curIds.push(menuIds[j])
          curKey |= 1 << j
        }
      }
      const curId = curIds.length === 0 ? defaultId : curIds.join(idJoinStr)
      const curDispersedSet = (this.dispersedData[curKey] && this.dispersedData[curKey][curId]) 
        ? this.dispersedData[curKey][curId] 
        : blankSet
      ret.push(this.skuIdMenu[i].map(item => !curDispersedSet.has(item)))
    }
    return ret
  }

  getGoods (selected) {
    const ids = selected.map(n => n && this.menuMap[n] || null)
    if (ids.every(item => item))
      return this.goodsMap[ids.join(idJoinStr)]
    return null
  }

  init () {
    const skuList = this.skuList
    for (let i = 0; i < skuList.length; i++) {
      const skuPath = skuList[i].skuPath
      let idKeys = []
      for (var j = 0; j < skuPath.length; j++) {
        const menu = skuPath[j].value
        const menuId = this.findOrGenMenuId(menu, j)
        idKeys.push(menuId)
      }
      this.descartes(idKeys)
      this.goodsMap[idKeys.join(idJoinStr)] = skuList[i]
    }
  }

  descartes (ids) {
    const len = ids.length
    const max = (1 << len) - 1
    for (let i = 0; i < max; i++) {
      const selected = []
      const relation = []
      for (let j = 0; j < len; j++) {
        if ((i & (1 << j)) === 0) 
          relation.push(ids[j])
        else
          selected.push(ids[j])
      }
      const key = selected.length === 0 ? defaultId : selected.join(idJoinStr)
      if (!this.dispersedData[i])
        this.dispersedData[i] = {}
      if (!this.dispersedData[i][key])
        this.dispersedData[i][key] = new Set()
      const set = this.dispersedData[i][key]
      relation.forEach(id => set.add(id))
    }
  }

  findOrGenMenuId (name, i) {
    if (this.menuMap[name]) return this.menuMap[name]
    const menuId = this.createIncId(name)
    this.skuMenu[i].push(name)
    this.skuIdMenu[i].push(menuId)
    return menuId
  }

  createIncId (name) {
    const map = this.menuMap
    if (map[name]) return map[name]
    uid++
    return (map[name] = uid)
  }
}