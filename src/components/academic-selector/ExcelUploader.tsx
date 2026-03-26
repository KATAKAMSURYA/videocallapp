import * as XLSX from 'xlsx'
import { FileSpreadsheet, Upload } from 'lucide-react'
import type { UploadRow } from './types'

interface ExcelUploaderProps {
  onParsedRows: (rows: UploadRow[]) => void
  onError: (message: string) => void
}

const EXPECTED_HEADERS = ['name', 'student id', 'branch', 'year']

const normalizeHeader = (value: unknown) => String(value || '').trim().toLowerCase()

const parseYear = (value: unknown) => {
  const raw = String(value || '').toLowerCase().trim()
  const numeric = Number.parseInt(raw.replace(/[^0-9]/g, ''), 10)
  if (!Number.isNaN(numeric) && numeric > 0) return Math.min(4, numeric)
  if (raw.includes('first') || raw.includes('1st')) return 1
  if (raw.includes('second') || raw.includes('2nd')) return 2
  if (raw.includes('third') || raw.includes('3rd')) return 3
  if (raw.includes('fourth') || raw.includes('4th')) return 4
  return 1
}

export default function ExcelUploader({ onParsedRows, onError }: ExcelUploaderProps) {
  const readRows = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        onError('No worksheet found in file.')
        return
      }

      const sheet = workbook.Sheets[sheetName]
      const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, blankrows: false })

      if (matrix.length < 2) {
        onError('File is empty or missing student rows.')
        return
      }

      const headerRow = matrix[0].map(normalizeHeader)
      const hasExpectedHeaders = EXPECTED_HEADERS.every((header) => headerRow.includes(header))
      if (!hasExpectedHeaders) {
        onError('Invalid format. Use: Name | Student ID | Branch | Year')
        return
      }

      const getIndex = (header: string) => headerRow.indexOf(header)

      const parsedRows: UploadRow[] = matrix
        .slice(1)
        .map((row) => ({
          name: String(row[getIndex('name')] || '').trim(),
          studentId: String(row[getIndex('student id')] || '').trim(),
          branch: String(row[getIndex('branch')] || '').trim(),
          year: parseYear(row[getIndex('year')]),
        }))
        .filter((row) => row.name && row.studentId && row.branch)

      if (parsedRows.length === 0) {
        onError('No valid rows found in file.')
        return
      }

      onParsedRows(parsedRows)
    } catch {
      onError('Failed to parse file. Please upload a valid .xlsx or .csv file.')
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur shadow-lg">
      <div className="flex items-center gap-2 mb-3 text-slate-200">
        <FileSpreadsheet className="h-4 w-4 text-cyan-300" />
        <span className="text-sm font-medium">Bulk Upload</span>
      </div>

      <label className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 cursor-pointer text-sm text-slate-200">
        <Upload className="h-4 w-4" />
        Upload Excel / CSV
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void readRows(file)
            }
            event.currentTarget.value = ''
          }}
          className="hidden"
        />
      </label>

      <p className="mt-2 text-xs text-slate-500">Expected headers: Name, Student ID, Branch, Year</p>
    </div>
  )
}
