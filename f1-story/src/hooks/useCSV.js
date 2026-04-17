import { useState, useEffect } from 'react'
import Papa from 'papaparse'

/**
 * useCSV — loads and parses a CSV from /public/data/
 * @param {string} filename  e.g. 'rq1_constructor_dominance.csv'
 * @returns {{ data, loading, error }}
 */
export function useCSV(filename) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!filename) return
    setLoading(true)
    setError(null)

    Papa.parse(`/data/${filename}`, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data)
        setLoading(false)
      },
      error: (err) => {
        setError(err.message)
        setLoading(false)
      },
    })
  }, [filename])

  return { data, loading, error }
}
