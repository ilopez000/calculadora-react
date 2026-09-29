import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ibjstqsquxfwouiuuhji.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseAnonKey.trim().length > 10
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Obtener las operaciones más recientes guardadas en Supabase
 */
export async function fetchHistoryFromSupabase() {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('calculations')
      .select('id, expression, result, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.warn('Supabase: Error al cargar historial:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.warn('Supabase: Error de conexión:', err)
    return null
  }
}

/**
 * Guardar una nueva operación en la tabla calculations de Supabase
 */
export async function saveCalculationToSupabase(expression, result) {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('calculations')
      .insert([{ expression, result }])
      .select()
      .single()

    if (error) {
      console.warn('Supabase: Error al guardar cálculo:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.warn('Supabase: Error de red al guardar:', err)
    return null
  }
}

/**
 * Borrar el historial en Supabase
 */
export async function clearHistoryInSupabase() {
  if (!supabase) return false

  try {
    // Elimina todos los registros de la tabla calculations
    const { error } = await supabase
      .from('calculations')
      .delete()
      .neq('id', 0)

    if (error) {
      console.warn('Supabase: Error al limpiar historial:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.warn('Supabase: Error al limpiar:', err)
    return false
  }
}
