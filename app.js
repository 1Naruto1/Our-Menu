const DB_NAME = 'electronic-kitchen-local'
const DB_VERSION = 3
const TITLE_KEY = 'electronic-kitchen-title'
const STORES = {
  dishes: 'dishes',
  ingredients: 'ingredients',
  checkins: 'checkins',
  messages: 'messages'
}

const MEALS = [
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' }
]

const COOKS = {
  rabbit: '兔兔',
  tiger: '虎虎',
  together: '一起'
}

const state = {
  dishes: [],
  ingredients: [],
  checkins: [],
  messages: [],
  activeView: 'menu',
  menuMode: 'pinyin',
  fridgeMode: 'expiry',
  dishKeyword: '',
  ingredientKeyword: '',
  recordDate: formatDate(new Date()),
  pendingDishImage: '',
  pendingIngredientImage: '',
  pendingCheckinPhotos: [],
  messageAuthor: 'rabbit',
  pendingCheckin: null
}

const els = {
  addDish: document.querySelector('#addDish'),
  addIngredient: document.querySelector('#addIngredient'),
  alertRow: document.querySelector('#alertRow'),
  appTitleInput: document.querySelector('#appTitleInput'),
  checkinComment: document.querySelector('#checkinComment'),
  checkinCook: document.querySelector('#checkinCook'),
  checkinDate: document.querySelector('#checkinDate'),
  checkinDialog: document.querySelector('#checkinDialog'),
  checkinForm: document.querySelector('#checkinForm'),
  checkinPhotoPreview: document.querySelector('#checkinPhotoPreview'),
  checkinPhotos: document.querySelector('#checkinPhotos'),
  checkinRating: document.querySelector('#checkinRating'),
  checkinTitle: document.querySelector('#checkinTitle'),
  closeCheckinDialog: document.querySelector('#closeCheckinDialog'),
  closeDishDialog: document.querySelector('#closeDishDialog'),
  closeIngredientDialog: document.querySelector('#closeIngredientDialog'),
  closeMessageDialog: document.querySelector('#closeMessageDialog'),
  closeRecordDetailDialog: document.querySelector('#closeRecordDetailDialog'),
  cancelReply: document.querySelector('#cancelReply'),
  deleteDish: document.querySelector('#deleteDish'),
  deleteIngredient: document.querySelector('#deleteIngredient'),
  dishCategory: document.querySelector('#dishCategory'),
  dishDialog: document.querySelector('#dishDialog'),
  dishDialogTitle: document.querySelector('#dishDialogTitle'),
  dishForm: document.querySelector('#dishForm'),
  dishId: document.querySelector('#dishId'),
  dishImage: document.querySelector('#dishImage'),
  dishImageHint: document.querySelector('#dishImageHint'),
  dishImagePreview: document.querySelector('#dishImagePreview'),
  dishIngredients: document.querySelector('#dishIngredients'),
  dishName: document.querySelector('#dishName'),
  dishNote: document.querySelector('#dishNote'),
  dishSearch: document.querySelector('#dishSearch'),
  exportData: document.querySelector('#exportData'),
  editingMessageId: document.querySelector('#editingMessageId'),
  fridgeContent: document.querySelector('#fridgeContent'),
  fridgeMeta: document.querySelector('#fridgeMeta'),
  heroRecommendTags: document.querySelector('#heroRecommendTags'),
  heroRecommendText: document.querySelector('#heroRecommendText'),
  heroRecommendTitle: document.querySelector('#heroRecommendTitle'),
  importData: document.querySelector('#importData'),
  ingredientDialog: document.querySelector('#ingredientDialog'),
  ingredientDialogTitle: document.querySelector('#ingredientDialogTitle'),
  ingredientExpiry: document.querySelector('#ingredientExpiry'),
  ingredientForm: document.querySelector('#ingredientForm'),
  ingredientId: document.querySelector('#ingredientId'),
  ingredientImage: document.querySelector('#ingredientImage'),
  ingredientImageHint: document.querySelector('#ingredientImageHint'),
  ingredientImagePreview: document.querySelector('#ingredientImagePreview'),
  ingredientName: document.querySelector('#ingredientName'),
  ingredientNote: document.querySelector('#ingredientNote'),
  ingredientQuantity: document.querySelector('#ingredientQuantity'),
  ingredientSearch: document.querySelector('#ingredientSearch'),
  ingredientUnit: document.querySelector('#ingredientUnit'),
  menuContent: document.querySelector('#menuContent'),
  menuMeta: document.querySelector('#menuMeta'),
  messageDialog: document.querySelector('#messageDialog'),
  messageForm: document.querySelector('#messageForm'),
  messageHistory: document.querySelector('#messageHistory'),
  messagePreview: document.querySelector('#messagePreview'),
  messageText: document.querySelector('#messageText'),
  openMessageBoard: document.querySelector('#openMessageBoard'),
  recordDate: document.querySelector('#recordDate'),
  recordDetailContent: document.querySelector('#recordDetailContent'),
  recordDetailDialog: document.querySelector('#recordDetailDialog'),
  recordDetailTitle: document.querySelector('#recordDetailTitle'),
  recordsList: document.querySelector('#recordsList'),
  replyHint: document.querySelector('#replyHint'),
  replyToMessage: document.querySelector('#replyToMessage'),
  saveMessageButton: document.querySelector('#saveMessageButton'),
  toast: document.querySelector('#toast')
}

let db
let toastTimer

init()

async function init() {
  db = await openDatabase()
  await seedIfEmpty()
  bindEvents()
  loadAppTitle()
  syncSelectedDate(state.recordDate)
  await refresh()

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {})
  }
}

function bindEvents() {
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.view))
  })

  document.querySelectorAll('[data-menu-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      state.menuMode = button.dataset.menuMode
      document.querySelectorAll('[data-menu-mode]').forEach((item) => item.classList.toggle('is-active', item === button))
      renderMenu()
    })
  })

  document.querySelectorAll('[data-fridge-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      state.fridgeMode = button.dataset.fridgeMode
      document.querySelectorAll('[data-fridge-mode]').forEach((item) => item.classList.toggle('is-active', item === button))
      renderFridge()
    })
  })

  document.querySelectorAll('[data-star]').forEach((button) => {
    button.addEventListener('click', () => setRating(Number(button.dataset.star)))
  })

  document.querySelectorAll('[data-cook]').forEach((button) => {
    button.addEventListener('click', () => setCook(button.dataset.cook))
  })

  document.querySelectorAll('[data-message-author]').forEach((button) => {
    button.addEventListener('click', () => setMessageAuthor(button.dataset.messageAuthor))
  })

  els.addDish.addEventListener('click', () => openDishDialog())
  els.addIngredient.addEventListener('click', () => openIngredientDialog())
  els.closeDishDialog.addEventListener('click', () => els.dishDialog.close())
  els.closeIngredientDialog.addEventListener('click', () => els.ingredientDialog.close())
  els.closeCheckinDialog.addEventListener('click', () => els.checkinDialog.close())
  els.closeRecordDetailDialog.addEventListener('click', () => els.recordDetailDialog.close())
  els.openMessageBoard.addEventListener('click', openMessageDialog)
  els.closeMessageDialog.addEventListener('click', () => els.messageDialog.close())
  els.cancelReply.addEventListener('click', clearMessageDraft)
  els.deleteDish.addEventListener('click', deleteCurrentDish)
  els.deleteIngredient.addEventListener('click', deleteCurrentIngredient)
  els.dishForm.addEventListener('submit', saveDishFromForm)
  els.ingredientForm.addEventListener('submit', saveIngredientFromForm)
  els.checkinForm.addEventListener('submit', saveCheckin)
  els.messageForm.addEventListener('submit', saveMessage)
  els.dishImage.addEventListener('change', async (event) => {
    state.pendingDishImage = await imageFromEvent(event)
    updateImagePreview(els.dishImagePreview, els.dishImageHint, state.pendingDishImage)
  })
  els.ingredientImage.addEventListener('change', async (event) => {
    state.pendingIngredientImage = await imageFromEvent(event)
    updateImagePreview(els.ingredientImagePreview, els.ingredientImageHint, state.pendingIngredientImage)
  })
  els.checkinPhotos.addEventListener('change', async (event) => {
    const photos = await imagesFromEvent(event)
    state.pendingCheckinPhotos = [...state.pendingCheckinPhotos, ...photos]
    renderCheckinPhotoPreview()
    event.target.value = ''
  })
  els.dishSearch.addEventListener('input', () => {
    state.dishKeyword = els.dishSearch.value.trim().toLowerCase()
    renderMenu()
  })
  els.ingredientSearch.addEventListener('input', () => {
    state.ingredientKeyword = els.ingredientSearch.value.trim().toLowerCase()
    renderFridge()
  })
  els.recordDate.addEventListener('change', () => {
    syncSelectedDate(els.recordDate.value)
    renderRecords()
  })
  els.checkinDate.addEventListener('change', () => syncSelectedDate(els.checkinDate.value))
  els.exportData.addEventListener('click', exportData)
  els.importData.addEventListener('change', importData)
  els.appTitleInput.addEventListener('input', updateAppTitle)
  els.appTitleInput.addEventListener('blur', () => {
    if (!els.appTitleInput.value.trim()) {
      els.appTitleInput.value = '电子厨房'
      updateAppTitle()
    }
  })
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORES.dishes)) {
        database.createObjectStore(STORES.dishes, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(STORES.ingredients)) {
        database.createObjectStore(STORES.ingredients, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(STORES.checkins)) {
        database.createObjectStore(STORES.checkins, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(STORES.messages)) {
        database.createObjectStore(STORES.messages, { keyPath: 'id' })
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
  const existingDishes = await getAll(STORES.dishes)
  const existingIngredients = await getAll(STORES.ingredients)
  if (existingDishes.length || existingIngredients.length) return

  const today = new Date()
  const samples = [
    createIngredient({ name: '青菜', quantity: '1', unit: '把', expiryDate: addDays(today, 1), color: '#6ea577' }),
    createIngredient({ name: '鸡蛋', quantity: '6', unit: '个', expiryDate: addDays(today, 2), color: '#e8c569' }),
    createIngredient({ name: '豆腐', quantity: '1', unit: '盒', expiryDate: addDays(today, 3), color: '#d7b996' }),
    createIngredient({ name: '番茄', quantity: '4', unit: '个', expiryDate: addDays(today, 7), color: '#d95a38' })
  ]
  await Promise.all(samples.map((item) => put(STORES.ingredients, item)))

  const findIngredient = (name) => samples.find((item) => item.name === name)
  const dishes = [
    createDish({
      name: '青菜豆腐汤',
      category: '清淡',
      mealTypes: ['lunch', 'dinner'],
      ingredientUsages: [
        usage(findIngredient('青菜'), '1', '把'),
        usage(findIngredient('豆腐'), '1', '盒')
      ],
      note: '优先消耗快过期青菜。'
    }),
    createDish({
      name: '番茄炒蛋',
      category: '家常菜',
      mealTypes: ['lunch', 'dinner'],
      ingredientUsages: [
        usage(findIngredient('番茄'), '2', '个'),
        usage(findIngredient('鸡蛋'), '3', '个')
      ],
      note: '酸甜口，适合配米饭。'
    }),
    createDish({
      name: '鸡蛋三明治',
      category: '早餐',
      mealTypes: ['breakfast'],
      ingredientUsages: [usage(findIngredient('鸡蛋'), '2', '个')],
      note: '早上十分钟可以完成。'
    })
  ]
  await Promise.all(dishes.map((dish) => put(STORES.dishes, dish)))

  const firstMessage = createMessage({
    author: 'rabbit',
    text: '青菜明天就到期啦，今晚可以先做青菜豆腐汤。',
    createdAt: new Date().toISOString()
  })
  await put(STORES.messages, firstMessage)
  await put(STORES.messages, createMessage({
    author: 'tiger',
    text: '收到，我来端盘子。',
    replyTo: firstMessage.id,
    threadId: firstMessage.threadId,
    createdAt: new Date(Date.now() + 60000).toISOString()
  }))
}

async function refresh() {
  state.dishes = normalizeDishes(await getAll(STORES.dishes))
  state.ingredients = await getAll(STORES.ingredients)
  state.checkins = normalizeCheckins(await getAll(STORES.checkins))
  state.messages = normalizeMessages(await getAll(STORES.messages))
  renderAll()
}

function renderAll() {
  renderHero()
  renderMessages()
  renderMenu()
  renderFridge()
  renderRecords()
}

function renderHero() {
  const urgent = getUrgentIngredients().slice(0, 3)
  els.alertRow.innerHTML = urgent.length
    ? urgent.map((item) => `
      <article class="alert-card ${daysUntil(item.expiryDate) <= 1 ? 'urgent' : ''}">
        <span>${expiryText(item.expiryDate)}</span>
        <strong>${escapeHtml(item.name)}</strong>
        <em>剩 ${escapeHtml(quantityText(item))}</em>
      </article>
    `).join('')
    : '<article class="alert-card empty-alert"><strong>暂无快过期食材</strong><em>冰箱状态很轻松</em></article>'

  const [best] = recommendedDishes()
  if (!best) {
    els.heroRecommendTitle.textContent = '先补一点库存'
    els.heroRecommendText.textContent = '添加食材和菜品后，这里会自动推荐优先安排的菜。'
    els.heroRecommendTags.innerHTML = ''
    return
  }

  els.heroRecommendTitle.textContent = best.dish.name
  els.heroRecommendText.textContent = recommendationReason(best)
  els.heroRecommendTags.innerHTML = [
    best.missing.length ? `缺 ${best.missing.length} 种` : '可做',
    best.urgentHits ? `消耗 ${best.urgentHits} 种快过期食材` : '适合安排'
  ].map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')
}

function renderMessages() {
  const latestThreads = messageThreads()
    .slice(0, 2)

  if (!latestThreads.length) {
    els.messagePreview.innerHTML = `
      <article class="message-empty">
        <strong>还没有留言</strong>
        <span>可以给对方留一句今天想吃什么、哪些食材要先做。</span>
      </article>
    `
  } else {
    els.messagePreview.innerHTML = latestThreads.map(threadPreviewItem).join('')
  }

  if (els.messageDialog.open) renderMessageHistory()
}

function renderMenu() {
  const dishes = filteredDishes()
  const availableCount = state.dishes.filter((dish) => availabilityForDish(dish).missing.length === 0).length
  els.menuMeta.innerHTML = `
    <span>${state.dishes.length} 道菜</span>
    <span>${availableCount} 道冰箱可做</span>
  `

  if (!dishes.length) {
    els.menuContent.innerHTML = emptyState('还没有符合条件的菜', '添加菜品后，可以按拼音、餐次和推荐来查看。')
    return
  }

  if (state.menuMode === 'meal') {
    els.menuContent.innerHTML = MEALS.map((meal) => {
      const group = dishes.filter((dish) => dish.mealTypes.includes(meal.key))
      if (!group.length) return ''
      return groupSection(meal.label, dishGrid(group))
    }).join('')
  } else if (state.menuMode === 'recommend') {
    const ranked = recommendedDishes().filter((item) => dishes.some((dish) => dish.id === item.dish.id)).map((item) => item.dish)
    els.menuContent.innerHTML = groupSection('今日推荐', dishGrid(ranked))
  } else {
    els.menuContent.innerHTML = groupSection('按拼音排序', dishGrid(sortByPinyin(dishes)))
  }

  els.menuContent.querySelectorAll('[data-edit-dish]').forEach((button) => {
    button.addEventListener('click', () => openDishDialog(button.dataset.editDish))
  })
  els.menuContent.querySelectorAll('[data-checkin]').forEach((button) => {
    button.addEventListener('click', () => openCheckinDialog(button.dataset.checkin, button.dataset.meal))
  })
}

function renderFridge() {
  let ingredients = [...state.ingredients]
  if (state.ingredientKeyword) {
    ingredients = ingredients.filter((item) => {
      return [item.name, item.quantity, item.unit, item.note].join(' ').toLowerCase().includes(state.ingredientKeyword)
    })
  }
  if (state.fridgeMode === 'urgent') {
    ingredients = ingredients.filter((item) => daysUntil(item.expiryDate) <= 3)
  }
  if (state.fridgeMode === 'name') {
    ingredients = sortByPinyin(ingredients)
  } else {
    ingredients.sort((a, b) => expiryValue(a.expiryDate) - expiryValue(b.expiryDate))
  }

  els.fridgeMeta.innerHTML = `
    <span>${state.ingredients.length} 种食材</span>
    <span>${getUrgentIngredients().length} 种快过期</span>
  `

  if (!ingredients.length) {
    els.fridgeContent.innerHTML = emptyState('冰箱里还没有食材', '添加食材、余量和保质期后，就能自动提醒和推荐。')
    return
  }

  els.fridgeContent.innerHTML = ingredients.map((item) => ingredientCard(item)).join('')
  els.fridgeContent.querySelectorAll('[data-edit-ingredient]').forEach((button) => {
    button.addEventListener('click', () => openIngredientDialog(button.dataset.editIngredient))
  })
}

function renderRecords() {
  const records = state.checkins
    .filter((record) => record.date === state.recordDate)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  els.recordsList.innerHTML = MEALS.map((meal) => {
    const items = records.filter((record) => record.mealType === meal.key)
    return `
      <section class="record-column">
        <h3>${meal.label}</h3>
        ${items.length ? items.map(recordItem).join('') : '<p class="muted">还没有记录</p>'}
      </section>
    `
  }).join('')

  els.recordsList.querySelectorAll('[data-delete-record]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation()
      deleteCheckin(button.dataset.deleteRecord)
    })
  })
  els.recordsList.querySelectorAll('[data-edit-record]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation()
      openCheckinDialog('', '', button.dataset.editRecord)
    })
  })
  els.recordsList.querySelectorAll('[data-record-detail]').forEach((item) => {
    item.addEventListener('click', () => openRecordDetail(item.dataset.recordDetail))
  })
}

function switchView(view) {
  state.activeView = view
  document.querySelectorAll('.menu-view').forEach((item) => item.classList.toggle('is-hidden', view !== 'menu'))
  document.querySelector('.fridge-view').classList.toggle('is-hidden', view !== 'fridge')
  document.querySelectorAll('.main-tabs [data-view]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === view)
  })
}

function filteredDishes() {
  if (!state.dishKeyword) return [...state.dishes]
  return state.dishes.filter((dish) => {
    const text = [
      dish.name,
      dish.category,
      dish.note,
      ...dish.mealTypes.map(mealLabel),
      ...dish.ingredientUsages.map((item) => `${item.name} ${item.quantity} ${item.unit}`)
    ].join(' ').toLowerCase()
    return text.includes(state.dishKeyword)
  })
}

function dishGrid(dishes) {
  return `<div class="dish-grid">${dishes.map(dishCard).join('')}</div>`
}

function groupSection(title, content) {
  return `
    <div class="group-head">
      <span>${escapeHtml(title)}</span>
      <hr />
    </div>
    ${content}
  `
}

function dishCard(dish) {
  const availability = availabilityForDish(dish)
  const tags = [
    availability.missing.length ? `缺 ${availability.missing.join('、')}` : '冰箱可做',
    ...dish.mealTypes.map(mealLabel)
  ]
  const image = dish.imageData
    ? `<img class="dish-photo" src="${dish.imageData}" alt="${escapeHtml(dish.name)}" />`
    : `<div class="dish-placeholder">无图</div>`
  const ingredientText = dish.ingredientUsages.map((item) => `${item.name} ${item.quantity}${item.unit}`).join('、') || '未填写食材'
  return `
    <article class="dish-card">
      ${image}
      <div class="dish-body">
        <div class="dish-title">
          <h3>${escapeHtml(dish.name)}</h3>
          <button data-edit-dish="${dish.id}">编辑</button>
        </div>
        <p>${escapeHtml(ingredientText)}</p>
        <div class="status-row">${tags.map((tag, index) => `<span class="${index === 0 && !availability.missing.length ? 'ok' : index === 0 ? 'missing' : ''}">${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="checkin-row">
          ${MEALS.map((meal) => `<button data-checkin="${dish.id}" data-meal="${meal.key}">记为${meal.label}</button>`).join('')}
        </div>
      </div>
    </article>
  `
}

function ingredientCard(item) {
  const linked = state.dishes.filter((dish) => dish.ingredientUsages.some((usageItem) => sameName(usageItem.name, item.name)))
  const image = item.imageData
    ? `<img class="ingredient-photo image" src="${item.imageData}" alt="${escapeHtml(item.name)}" />`
    : `<div class="ingredient-photo" style="background:${escapeHtml(item.color || '#83ad8d')}">${escapeHtml(item.name.slice(0, 1))}</div>`
  return `
    <article class="ingredient-card ${daysUntil(item.expiryDate) <= 3 ? 'urgent' : ''}">
      ${image}
      <div class="ingredient-copy">
        <div class="ingredient-title">
          <strong>${escapeHtml(item.name)}</strong>
          <button data-edit-ingredient="${item.id}">编辑</button>
        </div>
        <span>剩 ${escapeHtml(quantityText(item))}</span>
        <em>${escapeHtml(expiryText(item.expiryDate))}</em>
        <p>关联菜品：${escapeHtml(linked.map((dish) => dish.name).join('、') || '暂无')}</p>
      </div>
    </article>
  `
}

function recordItem(record) {
  const dish = state.dishes.find((item) => item.id === record.dishId)
  const photos = recordPhotos(record)
  const thumb = photos.at(-1) || dish?.imageData || ''
  const thumbHtml = thumb
    ? `<img class="record-thumb" src="${thumb}" alt="" />`
    : '<div class="record-thumb fallback">饭</div>'
  const stack = photos.length > 1 ? `<span class="photo-count">${photos.length}张</span>` : ''
  return `
    <div class="record-item" data-record-detail="${record.id}" tabindex="0" role="button">
      <div class="record-thumb-wrap">${thumbHtml}${stack}</div>
      <div class="record-main">
        <div class="record-name">${escapeHtml(record.dishName)}</div>
        <div class="record-rating">${starsText(record.rating)} · ${escapeHtml(COOKS[record.cook] || '未记录做饭人')}</div>
        ${record.comment ? `<div class="record-comment">${escapeHtml(truncateText(record.comment, 34))}</div>` : '<div class="record-comment muted">点击查看完整详情</div>'}
      </div>
      <div class="record-actions">
        <button class="record-review" data-edit-record="${record.id}">修改</button>
        <button class="record-delete" data-delete-record="${record.id}">删除</button>
      </div>
    </div>
  `
}

function openDishDialog(id = '') {
  const dish = id ? state.dishes.find((item) => item.id === id) : null
  state.pendingDishImage = dish?.imageData || ''
  els.dishDialogTitle.textContent = dish ? '编辑菜品' : '添加菜品'
  els.dishId.value = dish?.id || ''
  els.dishName.value = dish?.name || ''
  els.dishCategory.value = dish?.category || ''
  els.dishNote.value = dish?.note || ''
  els.dishIngredients.value = dish ? dish.ingredientUsages.map((item) => `${item.name} ${item.quantity} ${item.unit}`.trim()).join('\n') : ''
  els.deleteDish.classList.toggle('is-hidden', !dish)
  document.querySelectorAll('[name="dishMealType"]').forEach((input) => {
    input.checked = dish ? dish.mealTypes.includes(input.value) : ['lunch', 'dinner'].includes(input.value)
  })
  updateImagePreview(els.dishImagePreview, els.dishImageHint, state.pendingDishImage)
  els.dishDialog.showModal()
}

async function saveDishFromForm(event) {
  event.preventDefault()
  const mealTypes = [...document.querySelectorAll('[name="dishMealType"]:checked')].map((input) => input.value)
  if (!mealTypes.length) {
    showToast('请至少选择一个餐次')
    return
  }
  const id = els.dishId.value
  const existing = id ? state.dishes.find((dish) => dish.id === id) : null
  const dish = {
    ...(existing || createDish({ name: els.dishName.value.trim() })),
    name: els.dishName.value.trim(),
    category: els.dishCategory.value.trim(),
    mealTypes,
    ingredientUsages: parseIngredientUsages(els.dishIngredients.value),
    note: els.dishNote.value.trim(),
    imageData: state.pendingDishImage,
    updatedAt: new Date().toISOString()
  }
  await put(STORES.dishes, dish)
  els.dishDialog.close()
  showToast('菜品已保存')
  await refresh()
}

async function deleteCurrentDish() {
  const id = els.dishId.value
  if (!id || !confirm('确定删除这道菜吗？历史打卡记录会保留。')) return
  await remove(STORES.dishes, id)
  els.dishDialog.close()
  showToast('菜品已删除')
  await refresh()
}

function openIngredientDialog(id = '') {
  const item = id ? state.ingredients.find((ingredient) => ingredient.id === id) : null
  state.pendingIngredientImage = item?.imageData || ''
  els.ingredientDialogTitle.textContent = item ? '编辑食材' : '添加食材'
  els.ingredientId.value = item?.id || ''
  els.ingredientName.value = item?.name || ''
  els.ingredientQuantity.value = item?.quantity || ''
  els.ingredientUnit.value = item?.unit || ''
  els.ingredientExpiry.value = item?.expiryDate || ''
  els.ingredientNote.value = item?.note || ''
  els.deleteIngredient.classList.toggle('is-hidden', !item)
  updateImagePreview(els.ingredientImagePreview, els.ingredientImageHint, state.pendingIngredientImage)
  els.ingredientDialog.showModal()
}

async function saveIngredientFromForm(event) {
  event.preventDefault()
  const id = els.ingredientId.value
  const existing = id ? state.ingredients.find((item) => item.id === id) : null
  const ingredient = {
    ...(existing || createIngredient({ name: els.ingredientName.value.trim() })),
    name: els.ingredientName.value.trim(),
    quantity: els.ingredientQuantity.value.trim(),
    unit: els.ingredientUnit.value.trim(),
    expiryDate: els.ingredientExpiry.value,
    note: els.ingredientNote.value.trim(),
    imageData: state.pendingIngredientImage,
    updatedAt: new Date().toISOString()
  }
  await put(STORES.ingredients, ingredient)
  els.ingredientDialog.close()
  showToast('食材已保存')
  await refresh()
}

async function deleteCurrentIngredient() {
  const id = els.ingredientId.value
  if (!id || !confirm('确定删除这个食材吗？菜品中的用量记录会保留。')) return
  await remove(STORES.ingredients, id)
  els.ingredientDialog.close()
  showToast('食材已删除')
  await refresh()
}

function openCheckinDialog(dishId = '', mealType = '', recordId = '') {
  const record = recordId ? state.checkins.find((item) => item.id === recordId) : null
  const dish = dishId ? state.dishes.find((item) => item.id === dishId) : null
  if (!record && !dish) return
  state.pendingCheckin = record ? { mode: 'edit', recordId } : { mode: 'create', dishId, mealType }
  state.pendingCheckinPhotos = record ? recordPhotos(record) : []
  els.checkinTitle.textContent = record ? `修改：${record.dishName}` : `记录：${dish.name}`
  els.checkinComment.value = record?.comment || ''
  syncSelectedDate(record?.date || state.recordDate)
  setRating(Number(record?.rating || 5))
  setCook(record?.cook || 'together')
  renderCheckinPhotoPreview()
  els.checkinDialog.showModal()
}

async function saveCheckin(event) {
  event.preventDefault()
  const pending = state.pendingCheckin
  if (!pending) return

  if (pending.mode === 'edit') {
    const record = state.checkins.find((item) => item.id === pending.recordId)
    if (!record) return
    await put(STORES.checkins, {
      ...record,
      date: els.checkinDate.value || state.recordDate,
      rating: Number(els.checkinRating.value),
      cook: els.checkinCook.value,
      photos: state.pendingCheckinPhotos,
      comment: els.checkinComment.value.trim(),
      updatedAt: new Date().toISOString()
    })
    showToast('打卡记录已更新')
  } else {
    const dish = state.dishes.find((item) => item.id === pending.dishId)
    if (!dish) return
    const date = els.checkinDate.value || state.recordDate
    const duplicated = state.checkins.some((item) => item.dishId === dish.id && item.mealType === pending.mealType && item.date === date)
    if (duplicated && !confirm('这一天这个餐次已经记录过这道菜，还要再记一次吗？')) return
    await put(STORES.checkins, {
      id: crypto.randomUUID(),
      dishId: dish.id,
      dishName: dish.name,
      mealType: pending.mealType,
      date,
      rating: Number(els.checkinRating.value),
      cook: els.checkinCook.value,
      photos: state.pendingCheckinPhotos,
      comment: els.checkinComment.value.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    showToast(`已记为${mealLabel(pending.mealType)}`)
  }

  els.checkinDialog.close()
  state.pendingCheckin = null
  state.pendingCheckinPhotos = []
  syncSelectedDate(els.checkinDate.value || state.recordDate)
  await refresh()
}

async function deleteCheckin(id) {
  if (!id || !confirm('确定删除这条打卡记录吗？')) return
  await remove(STORES.checkins, id)
  showToast('打卡记录已删除')
  await refresh()
}

function setRating(value) {
  const rating = Math.min(5, Math.max(1, value || 5))
  els.checkinRating.value = String(rating)
  document.querySelectorAll('[data-star]').forEach((button) => {
    button.classList.toggle('is-active', Number(button.dataset.star) <= rating)
  })
}

function setCook(value) {
  els.checkinCook.value = value
  document.querySelectorAll('[data-cook]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.cook === value)
  })
}

function setMessageAuthor(value) {
  state.messageAuthor = value
  document.querySelectorAll('[data-message-author]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.messageAuthor === value)
  })
}

function renderCheckinPhotoPreview() {
  if (!state.pendingCheckinPhotos.length) {
    els.checkinPhotoPreview.innerHTML = '<span>还没有为这次打卡添加图片</span>'
    return
  }
  els.checkinPhotoPreview.innerHTML = state.pendingCheckinPhotos.map((src, index) => `
    <button type="button" data-remove-photo="${index}" aria-label="移除第${index + 1}张图片">
      <img src="${src}" alt="" />
    </button>
  `).join('')
  els.checkinPhotoPreview.querySelectorAll('[data-remove-photo]').forEach((button) => {
    button.addEventListener('click', () => {
      state.pendingCheckinPhotos.splice(Number(button.dataset.removePhoto), 1)
      renderCheckinPhotoPreview()
    })
  })
}

function openRecordDetail(id) {
  const record = state.checkins.find((item) => item.id === id)
  if (!record) return
  const dish = state.dishes.find((item) => item.id === record.dishId)
  const photos = recordPhotos(record)
  const allPhotos = photos.length ? photos : dish?.imageData ? [dish.imageData] : []
  els.recordDetailTitle.textContent = `${record.dishName} · ${mealLabel(record.mealType)}`
  els.recordDetailContent.innerHTML = `
    <div class="detail-meta">
      <span>${escapeHtml(record.date)}</span>
      <span>${starsText(record.rating)}</span>
      <span>${escapeHtml(COOKS[record.cook] || '未记录做饭人')}</span>
    </div>
    <div class="detail-photos ${allPhotos.length > 1 ? 'stacked' : ''}">
      ${allPhotos.length ? allPhotos.map((src) => `<img src="${src}" alt="" />`).join('') : '<div class="empty-state"><p>这次打卡还没有图片</p></div>'}
    </div>
    <div class="detail-comment">
      <strong>完整评价</strong>
      <p>${escapeHtml(record.comment || '还没有填写评价')}</p>
    </div>
  `
  els.recordDetailDialog.showModal()
}

function openMessageDialog() {
  clearMessageDraft()
  setMessageAuthor(state.messageAuthor)
  renderMessageHistory()
  els.messageDialog.showModal()
}

function renderMessageHistory() {
  const threads = messageThreads()
  els.messageHistory.innerHTML = threads.length
    ? threads.map(messageThreadItem).join('')
    : '<div class="message-empty"><strong>还没有留言</strong><span>从下面开始写第一条厨房小纸条。</span></div>'
  els.messageHistory.querySelectorAll('[data-reply-message]').forEach((button) => {
    button.addEventListener('click', () => setReplyTarget(button.dataset.replyMessage))
  })
  els.messageHistory.querySelectorAll('[data-edit-message]').forEach((button) => {
    button.addEventListener('click', () => setEditTarget(button.dataset.editMessage))
  })
  els.messageHistory.querySelectorAll('[data-delete-message]').forEach((button) => {
    button.addEventListener('click', () => deleteMessage(button.dataset.deleteMessage))
  })
}

function threadPreviewItem(thread) {
  const latest = thread.messages.at(-1)
  const starter = thread.messages[0]
  return `
    <article class="message-chip ${latest.author}">
      <img src="${authorAvatar(latest.author)}" alt="" />
      <div>
        <strong>${escapeHtml(COOKS[latest.author] || '留言')} · ${thread.messages.length} 条</strong>
        <span>${escapeHtml(timeText(latest.createdAt))}</span>
        <p>${starter.id === latest.id ? escapeHtml(truncateText(latest.text, 38)) : `回复：${escapeHtml(truncateText(latest.text, 34))}`}</p>
      </div>
    </article>
  `
}

function messageThreadItem(thread) {
  const starter = thread.messages[0]
  return `
    <section class="message-thread">
      <div class="thread-title">
        <strong>${escapeHtml(truncateText(starter.text, 26))}</strong>
        <span>${thread.messages.length} 条对话</span>
      </div>
      <div class="thread-bubbles">
        ${thread.messages.map(messageBubble).join('')}
      </div>
    </section>
  `
}

function messageBubble(message) {
  const parent = message.replyTo ? state.messages.find((item) => item.id === message.replyTo) : null
  return `
    <article class="message-history-item ${message.author}">
      <img src="${authorAvatar(message.author)}" alt="" />
      <div>
        <div class="message-line">
          <strong>${escapeHtml(COOKS[message.author] || '留言')}</strong>
          <span>${escapeHtml(timeText(message.createdAt))}${message.updatedAt ? ' · 已修改' : ''}</span>
        </div>
        ${parent ? `<em>回复：${escapeHtml(truncateText(parent.text, 34))}</em>` : ''}
        <p>${escapeHtml(message.text)}</p>
        <div class="message-actions">
          <button type="button" data-reply-message="${message.id}">回复</button>
          <button type="button" data-edit-message="${message.id}">修改</button>
          <button type="button" data-delete-message="${message.id}">删除</button>
        </div>
      </div>
    </article>
  `
}

async function saveMessage(event) {
  event.preventDefault()
  const text = els.messageText.value.trim()
  if (!text) {
    showToast('先写一点留言内容')
    return
  }
  const editingId = els.editingMessageId.value
  if (editingId) {
    const message = state.messages.find((item) => item.id === editingId)
    if (!message) return
    await put(STORES.messages, {
      ...message,
      author: state.messageAuthor,
      text,
      updatedAt: new Date().toISOString()
    })
    clearMessageDraft()
    showToast('留言已修改')
    await refresh()
    return
  }

  const replyTo = els.replyToMessage.value
  const parent = replyTo ? state.messages.find((item) => item.id === replyTo) : null
  await put(STORES.messages, createMessage({
    author: state.messageAuthor,
    text,
    replyTo: parent?.id || '',
    threadId: parent?.threadId || parent?.id || ''
  }))
  els.messageText.value = ''
  clearMessageDraft()
  showToast('留言已保存')
  await refresh()
}

function setReplyTarget(id) {
  const message = state.messages.find((item) => item.id === id)
  if (!message) return
  els.editingMessageId.value = ''
  els.replyToMessage.value = id
  els.messageText.value = ''
  els.replyHint.textContent = `正在回复：${truncateText(message.text, 36)}`
  els.replyHint.classList.remove('is-hidden')
  els.cancelReply.classList.remove('is-hidden')
  els.cancelReply.textContent = '取消回复'
  els.saveMessageButton.textContent = '发布回复'
  els.messageText.focus()
}

function clearReplyTarget() {
  els.replyToMessage.value = ''
  els.replyHint.textContent = ''
  els.replyHint.classList.add('is-hidden')
  els.cancelReply.classList.add('is-hidden')
  els.cancelReply.textContent = '取消回复'
  els.saveMessageButton.textContent = els.editingMessageId.value ? '保存修改' : '发布留言'
}

function setEditTarget(id) {
  const message = state.messages.find((item) => item.id === id)
  if (!message) return
  els.editingMessageId.value = id
  els.replyToMessage.value = ''
  els.messageText.value = message.text
  setMessageAuthor(message.author)
  els.replyHint.textContent = `正在修改：${truncateText(message.text, 36)}`
  els.replyHint.classList.remove('is-hidden')
  els.cancelReply.classList.remove('is-hidden')
  els.cancelReply.textContent = '取消修改'
  els.saveMessageButton.textContent = '保存修改'
  els.messageText.focus()
}

function clearMessageDraft() {
  els.editingMessageId.value = ''
  els.messageText.value = ''
  clearReplyTarget()
}

async function deleteMessage(id) {
  if (!id || !confirm('确定删除这条留言吗？后续回复会保留在原对话里。')) return
  await remove(STORES.messages, id)
  clearMessageDraft()
  showToast('留言已删除')
  await refresh()
}

function recommendedDishes() {
  return state.dishes
    .map((dish) => {
      const availability = availabilityForDish(dish)
      const urgentHits = dish.ingredientUsages.filter((usageItem) => {
        const ingredient = findIngredientByUsage(usageItem)
        return ingredient && daysUntil(ingredient.expiryDate) <= 3
      }).length
      return {
        dish,
        missing: availability.missing,
        urgentHits,
        score: urgentHits * 5 + availability.available.length * 2 - availability.missing.length * 4
      }
    })
    .sort((a, b) => b.score - a.score || a.missing.length - b.missing.length || comparePinyin(a.dish.name, b.dish.name))
}

function recommendationReason(item) {
  if (item.urgentHits > 0 && item.missing.length === 0) {
    return `这道菜可以消耗快过期食材，冰箱里现在就能做。`
  }
  if (item.missing.length === 0) return '冰箱里的食材已经足够，可以直接安排。'
  return `还缺 ${item.missing.join('、')}，补齐后就能做。`
}

function availabilityForDish(dish) {
  const available = []
  const missing = []
  dish.ingredientUsages.forEach((item) => {
    if (findIngredientByUsage(item)) available.push(item.name)
    else missing.push(item.name)
  })
  return { available, missing }
}

function findIngredientByUsage(usageItem) {
  return state.ingredients.find((ingredient) => sameName(ingredient.name, usageItem.name))
}

function getUrgentIngredients() {
  return state.ingredients
    .filter((item) => item.expiryDate && daysUntil(item.expiryDate) <= 3)
    .sort((a, b) => expiryValue(a.expiryDate) - expiryValue(b.expiryDate))
}

function createDish(input) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: input.name,
    category: input.category || '',
    mealTypes: input.mealTypes || ['lunch', 'dinner'],
    ingredientUsages: input.ingredientUsages || [],
    note: input.note || '',
    imageData: input.imageData || '',
    createdAt: now,
    updatedAt: now
  }
}

function createIngredient(input) {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: input.name,
    quantity: input.quantity || '',
    unit: input.unit || '',
    expiryDate: input.expiryDate || '',
    note: input.note || '',
    imageData: input.imageData || '',
    color: input.color || randomColor(input.name),
    createdAt: now,
    updatedAt: now
  }
}

function createMessage(input) {
  const id = input.id || crypto.randomUUID()
  return {
    id,
    threadId: input.threadId || id,
    author: input.author || 'rabbit',
    text: input.text || '',
    replyTo: input.replyTo || '',
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || ''
  }
}

function normalizeDishes(dishes) {
  return dishes.map((dish) => ({
    ...dish,
    mealTypes: dish.mealTypes?.length ? dish.mealTypes : ['lunch', 'dinner'],
    ingredientUsages: dish.ingredientUsages?.length
      ? dish.ingredientUsages
      : (dish.ingredients || []).map((name) => ({ ingredientId: '', name, quantity: '', unit: '' }))
  }))
}

function normalizeCheckins(checkins) {
  return checkins.map((record) => ({
    ...record,
    photos: recordPhotos(record)
  }))
}

function normalizeMessages(messages) {
  const sorted = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const normalized = []
  sorted.forEach((message) => {
    const replyParent = message.replyTo
      ? normalized.find((item) => item.id === message.replyTo || item.text === message.replyTo)
      : null
    const threadId = message.threadId || replyParent?.threadId || replyParent?.id || message.id
    normalized.push({
      ...message,
      threadId,
      replyTo: replyParent ? replyParent.id : message.replyTo && normalized.some((item) => item.id === message.replyTo) ? message.replyTo : '',
      updatedAt: message.updatedAt || ''
    })
  })
  return normalized
}

function messageThreads() {
  const groups = new Map()
  state.messages.forEach((message) => {
    const threadId = message.threadId || message.id
    if (!groups.has(threadId)) groups.set(threadId, [])
    groups.get(threadId).push(message)
  })

  return [...groups.entries()]
    .map(([id, messages]) => ({
      id,
      messages: messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    }))
    .sort((a, b) => new Date(b.messages.at(-1).createdAt) - new Date(a.messages.at(-1).createdAt))
}

function usage(ingredient, quantity, unit) {
  return {
    ingredientId: ingredient?.id || '',
    name: ingredient?.name || '',
    quantity,
    unit
  }
}

function parseIngredientUsages(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/)
      const name = parts[0]
      const ingredient = state.ingredients.find((item) => sameName(item.name, name))
      return {
        ingredientId: ingredient?.id || '',
        name,
        quantity: parts[1] || '',
        unit: parts.slice(2).join('') || ''
      }
    })
}

function loadAppTitle() {
  els.appTitleInput.value = localStorage.getItem(TITLE_KEY) || '电子厨房'
  updateDocumentTitle()
}

function updateAppTitle() {
  const title = els.appTitleInput.value.trim() || '电子厨房'
  localStorage.setItem(TITLE_KEY, title)
  updateDocumentTitle()
}

function updateDocumentTitle() {
  document.title = els.appTitleInput.value.trim() || '电子厨房'
}

function exportData() {
  const payload = {
    app: '电子厨房',
    version: 3,
    exportedAt: new Date().toISOString(),
    title: els.appTitleInput.value.trim() || '电子厨房',
    dishes: state.dishes,
    ingredients: state.ingredients,
    checkins: state.checkins,
    messages: state.messages
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
    const payload = JSON.parse(await file.text())
    if (!Array.isArray(payload.dishes) || !Array.isArray(payload.checkins)) throw new Error('Invalid backup')
    if (!confirm('导入会覆盖当前本地数据，确定继续吗？')) return
    await clearStore(STORES.dishes)
    await clearStore(STORES.ingredients)
    await clearStore(STORES.checkins)
    await clearStore(STORES.messages)
    await Promise.all(payload.dishes.map((dish) => put(STORES.dishes, dish)))
    await Promise.all((payload.ingredients || []).map((item) => put(STORES.ingredients, item)))
    await Promise.all(payload.checkins.map((record) => put(STORES.checkins, record)))
    await Promise.all((payload.messages || []).map((message) => put(STORES.messages, message)))
    if (payload.title) {
      els.appTitleInput.value = payload.title
      updateAppTitle()
    }
    showToast('备份已导入')
    await refresh()
  } catch (error) {
    console.error(error)
    showToast('备份文件无法导入')
  } finally {
    event.target.value = ''
  }
}

function syncSelectedDate(value) {
  state.recordDate = value || formatDate(new Date())
  els.recordDate.value = state.recordDate
  els.checkinDate.value = state.recordDate
}

async function imageFromEvent(event) {
  const file = event.target.files[0]
  if (!file) return ''
  return fileToDataUrl(file)
}

async function imagesFromEvent(event) {
  const files = [...event.target.files]
  return Promise.all(files.map(fileToDataUrl))
}

function updateImagePreview(imageEl, hintEl, value) {
  imageEl.src = value
  imageEl.hidden = !value
  hintEl.hidden = Boolean(value)
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function emptyState(title, text) {
  return `
    <div class="empty-state">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(text)}</p>
    </div>
  `
}

function quantityText(item) {
  return `${item.quantity || '-'}${item.unit || ''}`
}

function expiryText(value) {
  if (!value) return '未设置保质期'
  const days = daysUntil(value)
  if (days < 0) return `已过期 ${Math.abs(days)} 天`
  if (days === 0) return '今天到期'
  if (days === 1) return '明天到期'
  return `${days}天后到期`
}

function expiryValue(value) {
  return value ? new Date(`${value}T00:00:00`).getTime() : Number.POSITIVE_INFINITY
}

function daysUntil(value) {
  if (!value) return Number.POSITIVE_INFINITY
  const today = new Date(`${formatDate(new Date())}T00:00:00`)
  const date = new Date(`${value}T00:00:00`)
  return Math.round((date - today) / 86400000)
}

function addDays(date, days) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return formatDate(copy)
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function mealLabel(key) {
  return MEALS.find((meal) => meal.key === key)?.label || ''
}

function sortByPinyin(items) {
  return [...items].sort((a, b) => comparePinyin(a.name, b.name))
}

function comparePinyin(a, b) {
  return String(a).localeCompare(String(b), 'zh-Hans-CN')
}

function sameName(a, b) {
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase()
}

function starsText(value) {
  const rating = Math.min(5, Math.max(0, Number(value) || 0))
  return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`
}

function randomColor(seed = '') {
  const colors = ['#6ea577', '#d95a38', '#e8c569', '#8fa7c8', '#d78998']
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length
  return colors[index]
}

function recordPhotos(record) {
  if (Array.isArray(record.photos)) return record.photos.filter(Boolean)
  if (record.photo) return [record.photo]
  return []
}

function authorAvatar(author) {
  return author === 'tiger' ? './assets/tiger-chef.png' : './assets/rabbit-spatula.png'
}

function truncateText(value, maxLength) {
  const text = String(value || '')
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function timeText(value) {
  if (!value) return ''
  const date = new Date(value)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}/${day} ${hour}:${minute}`
}

function escapeHtml(value) {
  return String(value ?? '')
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
