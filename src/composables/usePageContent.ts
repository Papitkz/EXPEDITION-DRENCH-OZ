import { ref } from 'vue'

let _fb: any = null
async function getFirebase() {
  if (_fb) return _fb
  const [{ getFirebaseDb, initFirebase }, firestore] = await Promise.all([
    import('@/lib/firebase'),
    import('firebase/firestore'),
  ])
  initFirebase()
  _fb = {
    db: getFirebaseDb(),
    collection: firestore.collection,
    doc: firestore.doc,
    getDocs: firestore.getDocs,
    getDoc: firestore.getDoc,
    setDoc: firestore.setDoc,
    updateDoc: firestore.updateDoc,
    deleteDoc: firestore.deleteDoc,
    query: firestore.query,
    where: firestore.where,
    orderBy: firestore.orderBy,
    serverTimestamp: firestore.serverTimestamp,
    writeBatch: firestore.writeBatch,
  }
  return _fb
}

export interface PageContentItem {
  id: string
  page: string
  section: string
  key: string
  value: string
  label: string
  updatedAt: any
}

// Admin: Load all content for a page
export async function loadPageContent(page: string): Promise<PageContentItem[]> {
  try {
    const { db, collection, query, where, orderBy, getDocs } = await getFirebase()
    const q = query(
      collection(db, 'cms_page_content'),
      where('page', '==', page),
      orderBy('section'),
      orderBy('key')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PageContentItem))
  } catch (e) {
    console.warn(`Failed to load content for page ${page}:`, e)
    return []
  }
}

// Admin: Load ALL page content
export async function loadAllPageContent(): Promise<PageContentItem[]> {
  try {
    const { db, collection, orderBy, query, getDocs } = await getFirebase()
    const q = query(
      collection(db, 'cms_page_content'),
      orderBy('page'),
      orderBy('section'),
      orderBy('key')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PageContentItem))
  } catch (e) {
    console.warn('Failed to load all page content:', e)
    return []
  }
}

// Admin: Save or update a content item
export async function savePageContent(
  page: string,
  section: string,
  key: string,
  value: string,
  label: string
): Promise<string> {
  const { db, collection, doc, setDoc, updateDoc, query, where, getDocs, serverTimestamp } = await getFirebase()

  // Check if item already exists
  const q = query(
    collection(db, 'cms_page_content'),
    where('page', '==', page),
    where('section', '==', section),
    where('key', '==', key)
  )
  const snap = await getDocs(q)

  if (!snap.empty) {
    const id = snap.docs[0].id
    await updateDoc(doc(db, 'cms_page_content', id), {
      value,
      label,
      updatedAt: serverTimestamp(),
    })
    return id
  } else {
    const id = `pc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    await setDoc(doc(db, 'cms_page_content', id), {
      page,
      section,
      key,
      value,
      label,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return id
  }
}

// Admin: Delete a content item
export async function deletePageContent(id: string): Promise<void> {
  const { db, doc, deleteDoc } = await getFirebase()
  await deleteDoc(doc(db, 'cms_page_content', id))
}

// Admin: Batch save multiple content items
export async function batchSavePageContent(
  items: { page: string; section: string; key: string; value: string; label: string }[]
): Promise<void> {
  const { db, collection, doc, setDoc, updateDoc, query, where, getDocs, serverTimestamp, writeBatch } = await getFirebase()

  const batch = writeBatch(db)

  for (const item of items) {
    const q = query(
      collection(db, 'cms_page_content'),
      where('page', '==', item.page),
      where('section', '==', item.section),
      where('key', '==', item.key)
    )
    const snap = await getDocs(q)

    if (!snap.empty) {
      const ref = doc(db, 'cms_page_content', snap.docs[0].id)
      batch.update(ref, {
        value: item.value,
        label: item.label,
        updatedAt: serverTimestamp(),
      })
    } else {
      const id = `pc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      const ref = doc(db, 'cms_page_content', id)
      batch.set(ref, {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  }

  await batch.commit()
}

// Frontend: Reactive composable for page content
export function usePageContent(page: string) {
  const items = ref<PageContentItem[]>([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    items.value = await loadPageContent(page)
    loading.value = false
  }

  function getValue(section: string, key: string, fallback: string = ''): string {
    return items.value.find((i) => i.section === section && i.key === key)?.value || fallback
  }

  function getSectionValues(section: string): Record<string, string> {
    const result: Record<string, string> = {}
    items.value
      .filter((i) => i.section === section)
      .forEach((i) => { result[i.key] = i.value })
    return result
  }

  return {
    items,
    loading,
    load,
    getValue,
    getSectionValues,
  }
}

// Content registry: defines what content keys exist for each page
export interface ContentDef {
  section: string
  label: string
  keys: { key: string; label: string; type?: 'text' | 'textarea' }[]
}

export const PAGE_CONTENT_REGISTRY: Record<string, ContentDef[]> = {
  home: [
    {
      section: 'hero',
      label: 'Hero Section',
      keys: [
        { key: 'title', label: 'Main Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'text' },
        { key: 'ctaText', label: 'CTA Button Text', type: 'text' },
        { key: 'ctaLink', label: 'CTA Button Link', type: 'text' },
      ],
    },
    {
      section: 'intro',
      label: 'Intro Section',
      keys: [
        { key: 'overline', label: 'Overline Text', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'ctaText', label: 'CTA Text', type: 'text' },
      ],
    },
    {
      section: 'tours',
      label: 'Tours Section',
      keys: [
        { key: 'overline', label: 'Overline', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'text' },
      ],
    },
    {
      section: 'experience',
      label: 'Experience Section',
      keys: [
        { key: 'overline', label: 'Overline', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
      ],
    },
    {
      section: 'inclusions',
      label: 'Inclusions Section',
      keys: [
        { key: 'overline', label: 'Overline', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
      ],
    },
    {
      section: 'testimonials',
      label: 'Testimonials Section',
      keys: [
        { key: 'overline', label: 'Overline', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
      ],
    },
    {
      section: 'cta',
      label: 'CTA Section',
      keys: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'text' },
        { key: 'buttonText', label: 'Button Text', type: 'text' },
      ],
    },
  ],
  about: [
    {
      section: 'hero',
      label: 'Hero Section',
      keys: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'text' },
      ],
    },
    {
      section: 'story',
      label: 'Our Story',
      keys: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'content', label: 'Content', type: 'textarea' },
      ],
    },
    {
      section: 'mission',
      label: 'Mission',
      keys: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'content', label: 'Content', type: 'textarea' },
      ],
    },
    {
      section: 'team',
      label: 'Team Section',
      keys: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'text' },
      ],
    },
  ],
  expeditions: [
    {
      section: 'hero',
      label: 'Hero Section',
      keys: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'text' },
      ],
    },
    {
      section: 'intro',
      label: 'Introduction',
      keys: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
      ],
    },
  ],
  contact: [
    {
      section: 'hero',
      label: 'Hero Section',
      keys: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'text' },
      ],
    },
    {
      section: 'form',
      label: 'Contact Form',
      keys: [
        { key: 'title', label: 'Form Title', type: 'text' },
        { key: 'description', label: 'Form Description', type: 'textarea' },
      ],
    },
    {
      section: 'info',
      label: 'Contact Info',
      keys: [
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'address', label: 'Address', type: 'textarea' },
      ],
    },
  ],
  faq: [
    {
      section: 'hero',
      label: 'Hero Section',
      keys: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'text' },
      ],
    },
  ],
  blog: [
    {
      section: 'hero',
      label: 'Hero Section',
      keys: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'text' },
      ],
    },
  ],
}

export function getPageContentDefs(page: string): ContentDef[] {
  return PAGE_CONTENT_REGISTRY[page] || []
}

export function getAllPagesWithContent(): string[] {
  return Object.keys(PAGE_CONTENT_REGISTRY)
}
