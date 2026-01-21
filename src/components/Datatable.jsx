import { useState, useMemo } from 'react'

/**
 * Reusable Datatable Component
 * @param {Object} props
 * @param {Array} props.data - Array of data objects
 * @param {Array} props.columns - Array of column definitions [{ key, label, sortable, render }]
 * @param {boolean} props.loading - Loading state
 * @param {string} props.searchPlaceholder - Search input placeholder
 * @param {Array} props.filters - Array of filter definitions [{ key, label, type, options }]
 * @param {Function} props.onSearch - Search callback
 * @param {Function} props.onFilter - Filter callback
 * @param {boolean} props.showPagination - Show pagination controls
 * @param {number} props.defaultPageSize - Default page size
 * @param {boolean} props.showPageSize - Show page size selector
 * @param {string} props.emptyMessage - Message when no data
 * @param {React.ReactNode} props.actions - Action buttons to show above table
 * @param {Function} props.onDownloadPDF - Function to handle PDF download
 * @param {Function} props.onDownloadExcel - Function to handle Excel download
 * @param {boolean} props.showDownloads - Show download buttons (default: true if handlers provided)
 * @param {boolean} props.downloadingPDF - Loading state for PDF download
 * @param {boolean} props.downloadingExcel - Loading state for Excel download
 */
function Datatable({
  data = [],
  columns = [],
  loading = false,
  searchPlaceholder = 'Search...',
  filters = [],
  onSearch,
  onFilter,
  showPagination = true,
  defaultPageSize = 10,
  showPageSize = true,
  emptyMessage = 'No data found',
  actions = null,
  onDownloadPDF = null,
  onDownloadExcel = null,
  showDownloads = true,
  downloadingPDF = false,
  downloadingExcel = false
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterValues, setFilterValues] = useState({})
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  // Filter and sort data
  const filteredAndSorted = useMemo(() => {
    let filtered = [...data]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((row) => {
        return columns.some((col) => {
          const value = row[col.key]
          return value && value.toString().toLowerCase().includes(query)
        })
      })
    }

    // Custom filters
    filters.forEach((filter) => {
      const filterValue = filterValues[filter.key]
      if (filterValue) {
        if (filter.type === 'date') {
          const filterDate = new Date(filterValue)
          if (filter.range === 'from') {
            filtered = filtered.filter((row) => {
              // For date filters, check the dateTime or date field
              const rowValue = row.dateTime || row.date || row.createdAt || row[filter.key]
              if (!rowValue) return false
              const rowDate = new Date(rowValue)
              return rowDate >= filterDate
            })
          } else if (filter.range === 'to') {
            const toDate = new Date(filterValue)
            toDate.setHours(23, 59, 59, 999)
            filtered = filtered.filter((row) => {
              const rowValue = row.dateTime || row.date || row.createdAt || row[filter.key]
              if (!rowValue) return false
              const rowDate = new Date(rowValue)
              return rowDate <= toDate
            })
          }
        } else if (filter.type === 'select') {
          filtered = filtered.filter((row) => {
            const value = row[filter.key]
            return value === filterValue
          })
        }
      }
    })

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        // Handle dates
        if (aVal instanceof Date || (typeof aVal === 'string' && !isNaN(Date.parse(aVal)))) {
          aVal = new Date(aVal).getTime()
          bVal = new Date(bVal).getTime()
        }

        // Handle numbers
        if (typeof aVal === 'number' || !isNaN(Number(aVal))) {
          aVal = Number(aVal)
          bVal = Number(bVal)
        }

        // Handle strings
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchQuery, filterValues, sortConfig, columns, filters])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAndSorted.slice(start, start + pageSize)
  }, [filteredAndSorted, currentPage, pageSize])

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-[#00A896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-[#00A896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const resetFilters = () => {
    setSearchQuery('')
    setFilterValues({})
    setSortConfig({ key: null, direction: 'asc' })
    setCurrentPage(1)
  }

  // Determine if download buttons should be shown - show by default if handlers are provided
  const shouldShowDownloads = (showDownloads !== false) && (onDownloadPDF || onDownloadExcel)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Actions Bar with Download Buttons - Always show if handlers provided */}
      {(actions || shouldShowDownloads) && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Custom Actions */}
            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
            
            {/* Download Buttons - Always visible when handlers are provided */}
            {shouldShowDownloads && (
              <div className="flex flex-wrap gap-3 ml-auto">
                {onDownloadPDF && (
                  <button
                    onClick={onDownloadPDF}
                    disabled={loading || data.length === 0 || downloadingPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
                  >
                    {downloadingPDF ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                      </>
                    )}
                  </button>
                )}
                {onDownloadExcel && (
                  <button
                    onClick={onDownloadExcel}
                    disabled={loading || data.length === 0 || downloadingExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
                  >
                    {downloadingExcel ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Excel
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                  if (onSearch) onSearch(e.target.value)
                }}
                placeholder={searchPlaceholder}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A896] focus:border-transparent outline-none"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Dropdowns */}
          {filters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                filter.type === 'select' ? (
                  <select
                    key={filter.key}
                    value={filterValues[filter.key] || ''}
                    onChange={(e) => {
                      setFilterValues({ ...filterValues, [filter.key]: e.target.value })
                      setCurrentPage(1)
                      if (onFilter) onFilter(filter.key, e.target.value)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A896] focus:border-transparent outline-none text-sm"
                  >
                    <option value="">{filter.label}</option>
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <input
                    key={filter.key}
                    type="date"
                    value={filterValues[filter.key] || ''}
                    onChange={(e) => {
                      setFilterValues({ ...filterValues, [filter.key]: e.target.value })
                      setCurrentPage(1)
                      if (onFilter) onFilter(filter.key, e.target.value)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A896] focus:border-transparent outline-none text-sm"
                    placeholder={filter.label}
                  />
                ) : null
              ))}

              {(searchQuery || Object.values(filterValues).some(v => v)) && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results count and page size */}
        {showPageSize && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {paginatedData.length} of {filteredAndSorted.length} entries
            </span>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#00A896] outline-none text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase ${
                        col.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{col.label}</span>
                        {col.sortable !== false && getSortIcon(col.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={columns.length}>
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-600 font-medium">{emptyMessage}</p>
                        <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id || idx} className="border-t border-gray-100 hover:bg-gray-50">
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                          {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100 bg-white">
            {paginatedData.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600 font-medium">{emptyMessage}</p>
                <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              paginatedData.map((row, idx) => (
                <div key={row.id || idx} className="p-4 hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <div key={col.key} className="mb-2 last:mb-0">
                      <div className="text-xs text-gray-500 font-medium mb-1">{col.label}</div>
                      <div className="text-sm text-gray-900">
                        {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {showPagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 gap-3">
              <div className="text-sm text-gray-600 order-2 sm:order-1">
                Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, filteredAndSorted.length)}</span> of{' '}
                <span className="font-medium">{filteredAndSorted.length}</span> entries
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white hover:border-gray-400 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-50 text-sm font-medium"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition ${
                          currentPage === pageNum
                            ? 'bg-[#00A896] text-white border-[#00A896] shadow-sm'
                            : 'border-gray-300 hover:bg-white hover:border-gray-400'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white hover:border-gray-400 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-50 text-sm font-medium"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Datatable

