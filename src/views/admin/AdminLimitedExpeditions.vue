<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFirebaseDb, initFirebase } from '@/lib/firebase'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore'
import { FALLBACK_LIMITED_EXPEDITIONS } from '@/composables/useLimitedExpeditionData'

interface LimitedExpedition {
  id: string
  slug: string
  vesselName: string
  title: string
  subtitle: string
  nights: number
  dateLabel: string
  host: string
  icon: string
  priceAud: number
  priceLabel: string
  description: string
  shortDescription: string
  heroImageUrl: string
  heroVideoUrl: string
  isPublished: boolean
  sortOrder: number
  rezdyProductId: string
}

interface ItineraryDay {
  id: string
  tripId: string
  dayNumber: number
  title: string
  description: string
  imageUrl: string
  activityLabel: string
  mealsLabel: string
}

const ICON_OPTIONS = ['freedive', 'surf', 'whale', 'camera', 'jellyfish', 'lotus', 'shark', 'flask', 'compass']

const DEFAULT_EXPEDITIONS: Omit<LimitedExpedition, 'id'>[] = Object.values(FALLBACK_LIMITED_EXPEDITIONS).map((e) => ({
  slug: e.slug,
  vesselName: e.vesselName,
  title: e.title,
  subtitle: e.subtitle,
  nights: e.nights,
  dateLabel: e.dateLabel,
  host: e.host,
  icon: e.icon,
  priceAud: e.priceAud,
  priceLabel: e.priceLabel,
  description: e.description,
  shortDescription: e.shortDescription,
  heroImageUrl: '',
  heroVideoUrl: '',
  isPublished: true,
  sortOrder: e.sortOrder,
  rezdyProductId: '',
}))

const trips = ref<LimitedExpedition[]>([])
const selectedTrip = ref<LimitedExpedition | null>(null)
const itinerary = ref<ItineraryDay[]>([])
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const newDay = ref({ dayNumber: 1, title: '', description: '', imageUrl: '', activityLabel: '', mealsLabel: '' })

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}

async function loadTrips() {
  initFirebase()
  loading.value = true
  try {
    const db = getFirebaseDb()
    const snap = await getDocs(query(collection(db, 'cms_limited_expeditions'), orderBy('sortOrder')))
    if (snap.empty) {
      for (const t of DEFAULT_EXPEDITIONS) await addDoc(collection(db, 'cms_limited_expeditions'), t)
      const reSnap = await getDocs(query(collection(db, 'cms_limited_expeditions'), orderBy('sortOrder')))
      trips.value = reSnap.docs.map(d => ({ id: d.id, ...d.data() } as LimitedExpedition))
    } else {
      trips.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as LimitedExpedition))
    }
  } catch (e) {
    console.warn('Firestore unavailable, using default limited expeditions:', e)
    trips.value = DEFAULT_EXPEDITIONS.map((t, i) => ({ id: `local-${i}`, ...t } as LimitedExpedition))
  }
  loading.value = false
}

async function selectTrip(trip: LimitedExpedition) {
  selectedTrip.value = { ...trip }
  editing.value = false
  await loadItinerary(trip.id)
}

async function loadItinerary(tripId: string) {
  try {
    const db = getFirebaseDb()
    const snap = await getDocs(query(collection(db, 'cms_limited_expedition_itinerary'), where('tripId', '==', tripId)))
    itinerary.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as ItineraryDay))
      .sort((a, b) => a.dayNumber - b.dayNumber)
  } catch (e) {
    console.warn('Firestore unavailable, cannot load itinerary:', e)
    itinerary.value = []
  }
}

async function saveTrip() {
  if (!selectedTrip.value) return
  saving.value = true
  try {
    const db = getFirebaseDb()
    const { id, ...updates } = selectedTrip.value
    await updateDoc(doc(db, 'cms_limited_expeditions', id), updates)
    showMessage('Expedition saved successfully', 'success')
    editing.value = false
    await loadTrips()
  } catch (e) {
    console.warn('Failed to save expedition:', e)
    showMessage('Failed to save — check connection', 'error')
  }
  saving.value = false
}

async function addItineraryDay() {
  if (!selectedTrip.value) return
  try {
    const db = getFirebaseDb()
    const ref = await addDoc(collection(db, 'cms_limited_expedition_itinerary'), {
      tripId: selectedTrip.value.id,
      ...newDay.value,
    })
    itinerary.value.push({ id: ref.id, tripId: selectedTrip.value.id, ...newDay.value })
    newDay.value = { dayNumber: itinerary.value.length + 1, title: '', description: '', imageUrl: '', activityLabel: '', mealsLabel: '' }
  } catch (e) {
    showMessage('Failed to add day', 'error')
  }
}

async function removeItineraryDay(dayId: string) {
  try {
    const db = getFirebaseDb()
    await deleteDoc(doc(db, 'cms_limited_expedition_itinerary', dayId))
    itinerary.value = itinerary.value.filter(d => d.id !== dayId)
  } catch (e) {
    showMessage('Failed to remove day', 'error')
  }
}

async function updateItineraryDay(day: ItineraryDay) {
  try {
    const db = getFirebaseDb()
    const { id, ...updates } = day
    await updateDoc(doc(db, 'cms_limited_expedition_itinerary', id), updates)
    showMessage('Day updated', 'success')
  } catch (e) {
    showMessage('Failed to update day', 'error')
  }
}

async function togglePublished() {
  if (!selectedTrip.value) return
  try {
    const db = getFirebaseDb()
    const newVal = !selectedTrip.value.isPublished
    await updateDoc(doc(db, 'cms_limited_expeditions', selectedTrip.value.id), { isPublished: newVal })
    selectedTrip.value.isPublished = newVal
    const idx = trips.value.findIndex(t => t.id === selectedTrip.value!.id)
    if (idx !== -1) trips.value[idx].isPublished = newVal
    showMessage(newVal ? 'Expedition published' : 'Expedition unpublished', 'success')
  } catch (e) {
    showMessage('Failed to update status', 'error')
  }
}

onMounted(loadTrips)
</script>

<template>
  <div class="trips-manager">
    <div v-if="message" class="alert" :class="`alert-${messageType}`">{{ message }}</div>

    <p class="manager-intro">
      Manage hosted &amp; specialty departures shown on <code>/limited-expeditions</code>. Each card here links to its own detail page at <code>/limited-expeditions/&lt;slug&gt;</code>. Use the <router-link to="/admin/images">Images</router-link> page to set card thumbnails, hero images and gallery photos.
    </p>

    <div class="manager-grid">
      <div class="trip-list">
        <h3 class="list-title">Limited Expeditions ({{ trips.length }})</h3>
        <div v-if="loading" class="loading-state">Loading...</div>
        <div v-else class="trips-scroll">
          <button
            v-for="trip in trips"
            :key="trip.id"
            @click="selectTrip(trip)"
            class="trip-item"
            :class="{ 'trip-selected': selectedTrip?.id === trip.id }"
          >
            <div class="trip-meta">
              <p class="trip-name">{{ trip.title }}</p>
              <p class="trip-duration">{{ trip.nights }} Nights · {{ trip.vesselName }}</p>
              <span class="trip-status" :class="trip.isPublished ? 'status-published' : 'status-draft'">
                {{ trip.isPublished ? 'Published' : 'Draft' }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div class="trip-editor">
        <div v-if="!selectedTrip" class="empty-editor">
          <p>Select a limited expedition to edit</p>
        </div>

        <div v-else class="editor-content">
          <div class="editor-header">
            <h3 class="editor-title">{{ selectedTrip.title }}</h3>
            <div class="header-actions">
              <button @click="togglePublished" class="pub-btn" :class="selectedTrip.isPublished ? 'pub-active' : 'pub-inactive'">
                {{ selectedTrip.isPublished ? 'Published' : 'Draft' }}
              </button>
              <button @click="editing = !editing" class="edit-btn">{{ editing ? 'Cancel' : 'Edit' }}</button>
              <button v-if="editing" @click="saveTrip" class="save-btn" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </div>

          <div class="form-grid" :class="{ 'form-readonly': !editing }">
            <div class="form-group">
              <label class="form-label">Slug (URL)</label>
              <input v-model="selectedTrip.slug" :readonly="!editing" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Title</label>
              <input v-model="selectedTrip.title" :readonly="!editing" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Subtitle</label>
              <input v-model="selectedTrip.subtitle" :readonly="!editing" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Vessel</label>
              <input v-model="selectedTrip.vesselName" :readonly="!editing" class="form-input" placeholder="Sylfia or Millennium" />
            </div>
            <div class="form-group">
              <label class="form-label">Nights</label>
              <input v-model.number="selectedTrip.nights" type="number" :readonly="!editing" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Departure Dates Label</label>
              <input v-model="selectedTrip.dateLabel" :readonly="!editing" class="form-input" placeholder="e.g. 18 – 21 OCTOBER 2026" />
            </div>
            <div class="form-group">
              <label class="form-label">Host (optional)</label>
              <input v-model="selectedTrip.host" :readonly="!editing" class="form-input" placeholder="Leave blank if not hosted" />
            </div>
            <div class="form-group">
              <label class="form-label">Icon</label>
              <select v-model="selectedTrip.icon" :disabled="!editing" class="form-input">
                <option v-for="opt in ICON_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Price (AUD)</label>
              <input v-model.number="selectedTrip.priceAud" type="number" step="0.01" :readonly="!editing" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Price Label</label>
              <input v-model="selectedTrip.priceLabel" :readonly="!editing" class="form-input" placeholder="e.g. From $3,200 AUD" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Short Description (card grid)</label>
              <textarea v-model="selectedTrip.shortDescription" :readonly="!editing" class="form-input" rows="2"></textarea>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Full Description (detail page)</label>
              <textarea v-model="selectedTrip.description" :readonly="!editing" class="form-input" rows="4"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Hero Image URL</label>
              <input v-model="selectedTrip.heroImageUrl" :readonly="!editing" class="form-input" placeholder="Optional — overrides Images page hero slot" />
            </div>
            <div class="form-group">
              <label class="form-label">Rezdy Product ID</label>
              <input v-model="selectedTrip.rezdyProductId" :readonly="!editing" class="form-input" placeholder="Optional" />
            </div>
          </div>

          <div class="sub-section">
            <h4 class="sub-title">Itinerary ({{ itinerary.length }} days)</h4>
            <p class="sub-hint">Optional — if left empty, the detail page falls back to generic day placeholders from the Images page.</p>
            <div class="itinerary-list">
              <div v-for="day in itinerary" :key="day.id" class="itinerary-item">
                <div class="day-header">
                  <span class="day-number">Day {{ day.dayNumber }}</span>
                  <input v-model="day.title" class="day-title-input" @change="updateItineraryDay(day)" />
                  <button @click="removeItineraryDay(day.id)" class="remove-btn" title="Remove day">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <textarea v-model="day.description" class="form-input" rows="2" @change="updateItineraryDay(day)"></textarea>
                <div class="day-meta-row">
                  <input v-model="day.imageUrl" class="form-input sm" placeholder="Image URL" @change="updateItineraryDay(day)" />
                </div>
              </div>
            </div>
            <div class="add-day-form">
              <p class="add-day-label">Add Day</p>
              <div class="add-row">
                <input v-model.number="newDay.dayNumber" type="number" class="form-input sm" placeholder="Day #" />
                <input v-model="newDay.title" class="form-input" placeholder="Title" />
                <button @click="addItineraryDay" class="add-btn">Add Day</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alert { padding: 0.75rem 1rem; font-size: 0.8rem; margin-bottom: 1rem; border: 1px solid; }
.alert-success { background: rgba(76,175,80,0.1); border-color: rgba(76,175,80,0.3); color: #4caf50; }
.alert-error { background: rgba(224,123,90,0.1); border-color: rgba(224,123,90,0.3); color: #e07b5a; }

.manager-intro { font-size: 0.8rem; color: rgba(248,245,239,0.6); margin-bottom: 1.25rem; line-height: 1.6; max-width: 760px; }
.manager-intro code { background: rgba(201,168,76,0.1); padding: 0.1rem 0.35rem; border-radius: 2px; color: #c9a84c; font-size: 0.75rem; }
.manager-intro a { color: #c9a84c; }

.manager-grid { display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; min-height: 500px; }

.trip-list { background: rgba(10,46,74,0.3); border: 1px solid rgba(201,168,76,0.1); overflow: hidden; display: flex; flex-direction: column; }
.list-title { font-family: var(--font-heading); font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.5); padding: 1rem; border-bottom: 1px solid rgba(201,168,76,0.1); }
.trips-scroll { overflow-y: auto; max-height: 600px; }

.trip-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: none; border: none; border-bottom: 1px solid rgba(201,168,76,0.05); color: rgba(248,245,239,0.7); cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; }
.trip-item:hover { background: rgba(201,168,76,0.05); }
.trip-selected { background: rgba(201,168,76,0.1); border-left: 2px solid #c9a84c; }
.trip-name { font-size: 0.8rem; font-weight: 500; }
.trip-duration { font-size: 0.6rem; color: rgba(248,245,239,0.35); }
.trip-status { font-size: 0.5rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.125rem 0.375rem; display: inline-block; margin-top: 0.25rem; }
.status-published { background: rgba(76,175,80,0.15); color: #4caf50; }
.status-draft { background: rgba(201,168,76,0.15); color: #c9a84c; }

.trip-editor { background: rgba(10,46,74,0.3); border: 1px solid rgba(201,168,76,0.1); padding: 1.5rem; }
.empty-editor { display: flex; align-items: center; justify-content: center; min-height: 400px; color: rgba(248,245,239,0.35); }

.editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
.editor-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 300; color: #f8f5ef; }
.header-actions { display: flex; gap: 0.5rem; }
.pub-btn, .edit-btn, .save-btn { padding: 0.375rem 0.75rem; font-family: var(--font-heading); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border: 1px solid; transition: all 0.2s; }
.pub-active { background: rgba(76,175,80,0.15); border-color: rgba(76,175,80,0.3); color: #4caf50; }
.pub-inactive { background: rgba(201,168,76,0.15); border-color: rgba(201,168,76,0.3); color: #c9a84c; }
.edit-btn { background: rgba(10,46,74,0.5); border-color: rgba(201,168,76,0.2); color: rgba(248,245,239,0.7); }
.edit-btn:hover { border-color: #c9a84c; color: #c9a84c; }
.save-btn { background: #c9a84c; border-color: #c9a84c; color: #071a2b; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
.form-readonly .form-input { opacity: 0.7; cursor: default; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.col-span-2 { grid-column: span 2; }
.form-label { font-family: var(--font-heading); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.5); }
.form-input { background: rgba(7,26,43,0.6); border: 1px solid rgba(201,168,76,0.2); color: #f8f5ef; padding: 0.625rem 0.75rem; font-family: var(--font-body); font-size: 0.8rem; outline: none; transition: border-color 0.3s; -webkit-appearance: none; }
.form-input:focus { border-color: #c9a84c; }
.form-input.sm { padding: 0.5rem 0.625rem; font-size: 0.7rem; }

.sub-section { margin-bottom: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(201,168,76,0.1); }
.sub-title { font-family: var(--font-heading); font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.5); margin-bottom: 0.5rem; }
.sub-hint { font-size: 0.7rem; color: rgba(248,245,239,0.35); margin-bottom: 1rem; }

.itinerary-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
.itinerary-item { padding: 0.75rem; background: rgba(7,26,43,0.4); border: 1px solid rgba(201,168,76,0.08); }
.day-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
.day-number { font-family: var(--font-heading); font-size: 0.65rem; font-weight: 700; color: #c9a84c; letter-spacing: 0.1em; white-space: nowrap; }
.day-title-input { background: transparent; border: none; border-bottom: 1px solid rgba(201,168,76,0.15); color: #f8f5ef; font-family: var(--font-display); font-size: 1rem; flex: 1; outline: none; }
.day-meta-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }

.remove-btn { background: none; border: none; color: rgba(224,123,90,0.5); cursor: pointer; padding: 0.25rem; transition: color 0.2s; }
.remove-btn:hover { color: #e07b5a; }

.add-row { display: flex; gap: 0.5rem; }
.add-btn { padding: 0.5rem 1rem; background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.3); color: #c9a84c; font-family: var(--font-heading); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.add-btn:hover { background: rgba(201,168,76,0.25); }

.add-day-form { padding-top: 0.75rem; border-top: 1px dashed rgba(201,168,76,0.15); }
.add-day-label { font-size: 0.65rem; color: rgba(248,245,239,0.4); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; }

.loading-state { padding: 2rem; text-align: center; color: rgba(248,245,239,0.4); }

@media (max-width: 768px) {
  .manager-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .col-span-2 { grid-column: span 1; }
}
</style>
