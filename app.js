const DB_NAME = 'electronic-kitchen-local'
const DB_VERSION = 1
const STORES = {
  dishes: 'dishes',
  checkins: 'checkins'
}

const MEALS = [
  { key: 'breakfast', label: '早餐', icon: './assets/rabbit-spatula.png' },
  { key: 'lunch', label: '午餐', icon: './assets/tiger-chef.png' },
  { key: 'dinner', label: '晚餐', icon: './assets/dinner-badge.png' }
]

const state = {
  dishes: [],
  checkins: [],
  activeMeal: 'lunch',
  keyword: '',
  recordDate: formatDate(new Date())
}

const els = {
  addDishBottom: document.querySelector('#addDishBottom'),
  addDishTop: document.querySelector('#addDishTop'),
  closeDialog: document.querySelector('#closeDialog'),
  deleteDish: document.querySelector('#deleteDish'),
  dialog: document.querySelector('#dishDialog'),
  dialogTitle: document.querySelector('#dialogTitle'),
  dishCategory: document.querySelector('#dishCategory'),
  dishForm: document.querySelector('#dishForm'),
  dishGrid: document.querySelector('#dishGrid'),
  dishId: document.querySelector('#dishId'),
  dishImage: document.querySelector('#dishImage'),
  dishIngredients: document.querySelector('#dishIngredients'),
  dishName: document.querySelector('#dishName'),
  dishNote: document.querySelector('#dishNote'),
  exportData: document.querySelector('#exportData'),
  imageHint: document.querySelector('#imageHint'),
  imagePreview: document.querySelector('#imagePreview'),
  importData: document.querySelector('#importData'),
  mealTitle: document.querySelector('#mealTitle'),
  randomPick: document.querySelector('#randomPick'),
  recommendation: document.querySelector('#recommendation'),
  recordDate: document.querySelector('#recordDate'),
  recordsList: document.querySelector('#recordsList'),
  searchInput: document.querySelector('#searchInput'),
  toast: document.querySelector('#toast'),
  todayText: document.querySelector('#todayText')
}

let db
let pendingImageData = ''
let toastTimer

init()

async function init() {
  db = await openDatabase()
  await seedIfEmpty()
  bindEvents()
  els.todayText.textContent = prettyDate(new Date())
  els.recordDate.value = state.recordDate
  await refresh()

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {})
  }
}

function bindEvents() {
  els.addDishTop.addEventListener('click', () => openDishDialog())
  els.addDishBottom.addEventListener('click', () => openDishDialog())
  els.closeDialog.addEventListener('click', () => els.dialog.close())
  els.dishForm.addEventListener('submit', saveDishFromForm)
  els.deleteDish.addEventListener('click', deleteCurrentDish)
  els.dishImage.addEventListener('change', handleImagePick)
  els.searchInput.addEventListener('input', (event) => {
    state.keyword = event.target.value.trim().toLowerCase()
    renderDishes()
  })
  els.randomPick.addEventListener('click', randomPick)
  els.recordDate.addEventListener('change', async (event) => {
    state.recordDate = event.target.value
    state.checkins = await getAll(STORES.checkins)
    renderRecords()
  })
  els.exportData.addEventListener('click', exportData)
  els.importData.addEventListener('change', importData)

  document.querySelectorAll('.meal-tab').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeMeal = button.dataset.meal
      document.querySelectorAll('.meal-tab').forEach((tab) => tab.classList.toggle('is-active', tab === button))
      renderDishes()
      hideRecommendation()
    })
  })

  document.querySelectorAll('[data-jump]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.jump === 'records' ? document.querySelector('.records-panel') : document.querySelector('.today-panel')
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      document.querySelectorAll('[data-jump]').forEach((item) => item.classList.toggle('is-active', item === button))
    })
  })
}

async function refresh() {
  state.dishes = await getAll(STORES.dishes)
  state.checkins = await getAll(STORES.checkins)
  renderDishes()
  renderRecords()
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORES.dishes)) {
        database.createObjectStore(STORES.dishes, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(STORES.checkins)) {
        database.createObjectStore(STORES.checkins, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transaction(storeName, mode = 'readonly') {
  return db.transaction(storeName, mode).objectStore(storeName)
}

function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const request = transaction(storeName).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function put(storeName, value) {
  return new Promise((resolve, reject) => {
    const request = transaction(storeName, 'readwrite').put(value)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function remove(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = transaction(storeName, 'readwrite').delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    const request = transaction(storeName, 'readwrite').clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function seedIfEmpty() {
  const existing = await getAll(STORES.dishes)
  if (existing.length > 0) return

  const samples = [
    {
      name: '番茄炒蛋',
      ingredients: ['番茄', '鸡蛋', '葱'],
      category: '家常菜',
      mealTypes: ['lunch', 'dinner'],
      note: '酸甜口，适合配米饭。',
      color: '#d95a38'
    },
    {
      name: '鸡蛋三明治',
      ingredients: ['吐司', '鸡蛋', '生菜'],
      category: '早餐',
      mealTypes: ['breakfast'],
      note: '早上十分钟可以完成。',
      color: '#d6a43a'
    },
    {
      name: '青菜豆腐汤',
      ingredients: ['青菜', '豆腐', '菌菇'],
      category: '清淡',
      mealTypes: ['lunch', 'dinner'],
      note: '适合想吃得轻一点的时候。',
      color: '#4c9b67'
    }
  ]

  await Promise.all(samples.map((sample) => put(STORES.dishes, createDish(sample))))
}

function createDish(input) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: input.name,
    ingredients: input.ingredients || [],
    category: input.category || '',
    mealTypes: input.mealTypes || ['lunch', 'dinner'],
    note: input.note || '',
    imageData: input.imageData || '',
    color: input.color || '#d9c4a3',
    createdAt: now,
    updatedAt: now
  }
}

function renderDishes() {
  const meal = MEALS.find((item) => item.key === state.activeMeal)
  els.mealTitle.textContent = '今天想吃什么？'

  const visible = state.dishes
    .filter((dish) => dish.mealTypes.includes(state.activeMeal))
    .filter((dish) => {
      if (!state.keyword) return true
      return [dish.name, dish.category, ...dish.ingredients].join(' ').toLowerCase().includes(state.keyword)
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  if (visible.length === 0) {
    els.dishGrid.innerHTML = `
      <div class="empty-state">
        <div>
          <h2>这里还没有菜</h2>
          <p>新增一道适合${meal.label}的菜，它就会出现在这里。</p>
        </div>
      </div>
    `
    return
  }

  els.dishGrid.innerHTML = visible.map((dish) => dishCard(dish)).join('')
  els.dishGrid.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => openDishDialog(button.dataset.edit))
  })
  els.dishGrid.querySelectorAll('[data-checkin]').forEach((button) => {
    button.addEventListener('click', () => checkin(button.dataset.checkin))
  })
}

function dishCard(dish) {
  const activeMeal = MEALS.find((meal) => meal.key === state.activeMeal)
  const image = dish.imageData
    ? `<img class="dish-photo" src="${dish.imageData}" alt="${escapeHtml(dish.name)}" />`
    : `<div class="dish-placeholder" style="background:${dish.color}">无图</div>`
  const tags = [
    dish.category,
    ...dish.mealTypes.map((key) => MEALS.find((meal) => meal.key === key)?.label)
  ].filter(Boolean)
  const count = state.checkins.filter((item) => item.dishId === dish.id).length
  return `
    <article class="dish-card">
      ${image}
      <div class="dish-body">
        <div class="dish-topline">
          <h3 class="dish-name">${escapeHtml(dish.name)}</h3>
          <button class="tiny-button" data-edit="${dish.id}">编辑</button>
        </div>
        <p class="dish-meta">${escapeHtml(dish.ingredients.join('、') || '未填写主要食材')}</p>
        <div class="tag-row">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <button class="checkin-button" data-checkin="${dish.id}">
          <img class="${state.activeMeal === 'dinner' ? 'dinner-icon' : ''}" src="${activeMeal.icon}" alt="" />
          <span>记为${activeMeal.label}</span>
        </button>
        <div class="dish-count">${count} 次打卡</div>
      </div>
    </article>
  `
}

function renderRecords() {
  const records = state.checkins
    .filter((record) => record.date === state.recordDate)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  els.recordsList.innerHTML = MEALS.map((meal) => {
    const mealRecords = records.filter((record) => record.mealType === meal.key)
    const content = mealRecords.length
      ? mealRecords.map((record) => recordItem(record)).join('')
      : '<p class="muted">还没有记录</p>'
    return `
      <section class="record-column">
        <h3>${meal.label}</h3>
        ${content}
      </section>
    `
  }).join('')
}

function recordItem(record) {
  const image = record.imageData
    ? `<img class="record-thumb" src="${record.imageData}" alt="" />`
    : '<div class="record-thumb"></div>'
  return `
    <div class="record-item">
      ${image}
      <div>
        <div class="record-name">${escapeHtml(record.dishName)}</div>
        <div class="record-time">${new Date(record.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </div>
  `
}

function openDishDialog(id = '') {
  const dish = id ? state.dishes.find((item) => item.id === id) : null
  pendingImageData = dish?.imageData || ''
  els.dialogTitle.textContent = dish ? '编辑菜品' : '新增菜品'
  els.dishId.value = dish?.id || ''
  els.dishName.value = dish?.name || ''
  els.dishIngredients.value = dish?.ingredients.join('、') || ''
  els.dishCategory.value = dish?.category || ''
  els.dishNote.value = dish?.note || ''
  els.deleteDish.classList.toggle('is-hidden', !dish)
  document.querySelectorAll('[name="mealType"]').forEach((input) => {
    input.checked = dish ? dish.mealTypes.includes(input.value) : ['lunch', 'dinner'].includes(input.value)
  })
  updateImagePreview()
  els.dialog.showModal()
}

async function handleImagePick(event) {
  const file = event.target.files[0]
  if (!file) return
  pendingImageData = await fileToDataUrl(file)
  updateImagePreview()
}

function updateImagePreview() {
  els.imagePreview.src = pendingImageData
  els.imagePreview.hidden = !pendingImageData
  els.imageHint.hidden = Boolean(pendingImageData)
}

async function saveDishFromForm(event) {
  event.preventDefault()
  const mealTypes = [...document.querySelectorAll('[name="mealType"]:checked')].map((input) => input.value)
  if (mealTypes.length === 0) {
    showToast('请至少选择一个餐次')
    return
  }

  const id = els.dishId.value
  const existing = id ? state.dishes.find((dish) => dish.id === id) : null
  const dish = {
    ...(existing || createDish({ name: els.dishName.value.trim() })),
    name: els.dishName.value.trim(),
    ingredients: parseIngredients(els.dishIngredients.value),
    category: els.dishCategory.value.trim(),
    mealTypes,
    note: els.dishNote.value.trim(),
    imageData: pendingImageData,
    updatedAt: new Date().toISOString()
  }

  await put(STORES.dishes, dish)
  els.dialog.close()
  showToast('菜品已保存')
  await refresh()
}

async function deleteCurrentDish() {
  const id = els.dishId.value
  if (!id || !confirm('确定删除这道菜吗？历史打卡记录会保留。')) return
  await remove(STORES.dishes, id)
  els.dialog.close()
  showToast('菜品已删除')
  await refresh()
}

async function checkin(dishId) {
  const dish = state.dishes.find((item) => item.id === dishId)
  if (!dish) return

  const today = formatDate(new Date())
  const duplicated = state.checkins.some((item) => item.dishId === dishId && item.mealType === state.activeMeal && item.date === today)
  if (duplicated && !confirm('今天这个餐次已经记录过这道菜，还要再记一次吗？')) return

  await put(STORES.checkins, {
    id: crypto.randomUUID(),
    dishId: dish.id,
    dishName: dish.name,
    imageData: dish.imageData || '',
    mealType: state.activeMeal,
    date: today,
    createdAt: new Date().toISOString()
  })

  state.recordDate = today
  els.recordDate.value = today
  showToast(`已记为${mealLabel(state.activeMeal)}`)
  await refresh()
}

function randomPick() {
  const candidates = state.dishes.filter((dish) => dish.mealTypes.includes(state.activeMeal))
  if (candidates.length === 0) {
    showToast('当前餐次还没有可推荐的菜')
    return
  }

  const recentIds = state.checkins
    .filter((record) => daysBetween(new Date(record.date), new Date()) <= 3)
    .map((record) => record.dishId)
  const fresh = candidates.filter((dish) => !recentIds.includes(dish.id))
  const pool = fresh.length ? fresh : candidates
  const dish = pool[Math.floor(Math.random() * pool.length)]

  els.recommendation.innerHTML = `
    <strong>${escapeHtml(mealLabel(state.activeMeal))}推荐：${escapeHtml(dish.name)}</strong>
    <span>${escapeHtml(dish.ingredients.join('、') || dish.category || '可以安排上')}</span>
  `
  els.recommendation.classList.remove('is-hidden')
}

function hideRecommendation() {
  els.recommendation.classList.add('is-hidden')
}

function exportData() {
  const payload = {
    app: '电子厨房',
    version: 1,
    exportedAt: new Date().toISOString(),
    dishes: state.dishes,
    checkins: state.checkins
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `电子厨房备份-${formatDate(new Date())}.json`
  link.click()
  URL.revokeObjectURL(url)
  showToast('备份文件已导出')
}

async function importData(event) {
  const file = event.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const payload = JSON.parse(text)
    if (!Array.isArray(payload.dishes) || !Array.isArray(payload.checkins)) {
      throw new Error('Invalid backup')
    }
    if (!confirm('导入会覆盖当前本地数据，确定继续吗？')) return
    await clearStore(STORES.dishes)
    await clearStore(STORES.checkins)
    await Promise.all(payload.dishes.map((dish) => put(STORES.dishes, dish)))
    await Promise.all(payload.checkins.map((record) => put(STORES.checkins, record)))
    showToast('备份已导入')
    await refresh()
  } catch (error) {
    console.error(error)
    showToast('备份文件无法导入')
  } finally {
    event.target.value = ''
  }
}

function parseIngredients(value) {
  return value
    .split(/[、,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function prettyDate(date) {
  const d = date instanceof Date ? date : new Date(`${date}T00:00:00`)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function mealLabel(key) {
  return MEALS.find((meal) => meal.key === key)?.label || ''
}

function daysBetween(a, b) {
  return Math.abs(b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0)) / 86400000
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function showToast(message) {
  els.toast.textContent = message
  els.toast.classList.add('is-visible')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => els.toast.classList.remove('is-visible'), 2200)
}
