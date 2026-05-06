// src/pages/tenants/TenantImportPage.tsx
// Bulk import existing tenants — for owners switching from notebook/Excel

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload, Download, CheckCircle2, XCircle,
  AlertCircle, FileSpreadsheet, ArrowLeft, Users,
} from 'lucide-react'
import { Button }   from '@/components/ui/Button'
import { Badge }    from '@/components/ui/Badge'
import api          from '@/api/axios'
import { handleApiError } from '@/lib/apiError'
import toast from 'react-hot-toast'

interface ImportResult {
  rowNumber:  number
  tenantName: string
  phone:      string
  roomNumber: string
  success:    boolean
  status:     'IMPORTED' | 'FAILED' | 'SKIPPED'
  message:    string
  tenantId:   string | null
}

interface ImportResponse {
  totalRows:    number
  successCount: number
  failedCount:  number
  skippedCount: number
  results:      ImportResult[]
}

export function TenantImportPage() {
  const navigate  = useNavigate()
  const qc        = useQueryClient()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [results, setResults] = useState<ImportResponse | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // ── Download template ──────────────────────────────────────
  const downloadTemplate = async () => {
    try {
      const res = await api.get('/tenants/import/template', {
        responseType: 'blob',
      })
      const url  = URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href     = url
      link.download = 'ownant_tenant_import_template.xlsx'
      link.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      handleApiError(e)
    }
  }

  // ── Upload Excel ───────────────────────────────────────────
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/tenants/import/excel', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data.data as ImportResponse
    },
    onSuccess: (data) => {
      setResults(data)
      void qc.invalidateQueries({ queryKey: ['tenants'] })
      if (data.successCount > 0) {
        toast.success(`${data.successCount} tenants imported!`)
      }
    },
    onError: handleApiError,
  })

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please upload an Excel file (.xlsx or .xls)')
      return
    }
    setResults(null)
    upload.mutate(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-5 pb-20">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/tenants')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:border-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-textSecondary" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-textPrimary">Import Existing Tenants</h1>
          <p className="text-xs text-textSecondary mt-0.5">
            Add all your current tenants at once from Excel
          </p>
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-background/50">
          <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">
            How it works
          </p>
        </div>
        <div className="divide-y divide-border">
          {[
            { step: '1', text: 'Download the Excel template below', icon: Download       },
            { step: '2', text: 'Fill in your tenants — name, phone, room number', icon: FileSpreadsheet },
            { step: '3', text: 'Upload the filled file — done in seconds', icon: Upload  },
          ].map(({ step, text, icon: Icon }) => (
            <div key={step} className="flex items-center gap-3 px-4 py-3">
              <div className="h-7 w-7 rounded-full bg-primaryLight flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">{step}</span>
              </div>
              <Icon className="h-4 w-4 text-textSecondary flex-shrink-0" />
              <p className="text-sm text-textSecondary">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Download template ─────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primaryLight flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">1</span>
          </div>
          <p className="text-sm font-semibold text-textPrimary">Download Template</p>
        </div>
        <p className="text-xs text-textSecondary">
          Open in Excel or Google Sheets. Fill in one tenant per row.
          Required: Name, Phone, Room Number. Rest is optional.
        </p>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => void downloadTemplate()}
        >
          <Download className="h-4 w-4" />
          Download Excel Template
        </Button>
      </div>

      {/* ── Step 2: Upload ────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primaryLight flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">2</span>
          </div>
          <p className="text-sm font-semibold text-textPrimary">Upload Filled File</p>
        </div>

        {/* Drop zone */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            dragOver
              ? 'border-primary bg-primaryLight'
              : 'border-border hover:border-primary/50 hover:bg-background/50'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true)  }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />

          <div className="flex flex-col items-center gap-2 px-4 py-8">
            {upload.isPending ? (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                <p className="text-sm font-medium text-textPrimary">Importing tenants…</p>
                <p className="text-xs text-textSecondary">Please wait</p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-10 w-10 text-textSecondary" />
                <p className="text-sm font-medium text-textPrimary">
                  Tap to select Excel file
                </p>
                <p className="text-xs text-textSecondary">
                  Or drag and drop here · .xlsx or .xls
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────── */}
      {results && (
        <div className="space-y-3">

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-successLight border border-success/20 px-3 py-3 text-center">
              <p className="text-2xl font-bold text-success">{results.successCount}</p>
              <p className="text-xs text-success/80 mt-0.5">Imported</p>
            </div>
            <div className={`rounded-xl border px-3 py-3 text-center ${
              results.failedCount > 0
                ? 'bg-dangerLight border-danger/20'
                : 'bg-background border-border'
            }`}>
              <p className={`text-2xl font-bold ${results.failedCount > 0 ? 'text-danger' : 'text-textSecondary'}`}>
                {results.failedCount}
              </p>
              <p className={`text-xs mt-0.5 ${results.failedCount > 0 ? 'text-danger/80' : 'text-textSecondary'}`}>
                Failed
              </p>
            </div>
            <div className="rounded-xl bg-background border border-border px-3 py-3 text-center">
              <p className="text-2xl font-bold text-textSecondary">{results.skippedCount}</p>
              <p className="text-xs text-textSecondary mt-0.5">Skipped</p>
            </div>
          </div>

          {/* Go to tenants button if any succeeded */}
          {results.successCount > 0 && (
            <Button className="w-full gap-2" onClick={() => navigate('/tenants')}>
              <Users className="h-4 w-4" />
              View {results.successCount} imported tenants
            </Button>
          )}

          {/* Row-by-row results */}
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-background/50">
              <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">
                Import Details — {results.totalRows} rows processed
              </p>
            </div>
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {results.results.map(r => (
                <div key={r.rowNumber} className="flex items-start gap-3 px-4 py-3">
                  {r.status === 'IMPORTED' && <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />}
                  {r.status === 'FAILED'   && <XCircle      className="h-4 w-4 text-danger  flex-shrink-0 mt-0.5" />}
                  {r.status === 'SKIPPED'  && <AlertCircle  className="h-4 w-4 text-warning  flex-shrink-0 mt-0.5" />}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-textPrimary truncate">
                        Row {r.rowNumber}: {r.tenantName}
                      </p>
                      <Badge
                        variant={
                          r.status === 'IMPORTED' ? 'success'   :
                          r.status === 'FAILED'   ? 'danger'    : 'warning'
                        }
                        className="text-[10px] px-1.5 py-0 flex-shrink-0"
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-textSecondary mt-0.5">{r.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Retry failed rows hint */}
          {results.failedCount > 0 && (
            <div className="rounded-xl bg-warningLight border border-warning/20 px-4 py-3">
              <p className="text-xs font-semibold text-warning mb-1">
                {results.failedCount} rows failed
              </p>
              <p className="text-xs text-warning/80">
                Fix the errors above in your Excel file and upload again.
                Already imported tenants will be skipped automatically.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}