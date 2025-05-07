import { Input, Tooltip } from 'antd'
import { Search } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ModelListSearchBarProps {
  onSearch: (text: string) => void
}

/**
 * A collapsible search bar for the model list
 * Renders as an icon initially, expands to full search input when clicked
 */
const ModelListSearchBar: React.FC<ModelListSearchBarProps> = ({ onSearch }) => {
  const { t } = useTranslation()
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchText, setSearchText] = useState('')

  const handleTextChange = (text: string) => {
    setSearchText(text)
    onSearch(text)
  }

  const handleClear = () => {
    setSearchText('')
    setSearchVisible(false)
    onSearch('')
  }

  return searchVisible ? (
    <Input
      type="text"
      placeholder={t('models.search')}
      size="small"
      style={{ width: '160px' }}
      suffix={<Search size={14} />}
      onChange={(e) => handleTextChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          handleTextChange('')
          if (!searchText) setSearchVisible(false)
        }
      }}
      onBlur={() => {
        if (!searchText) setSearchVisible(false)
      }}
      autoFocus
      allowClear
      onClear={handleClear}
    />
  ) : (
    <Tooltip title={t('models.search')} mouseEnterDelay={0.5}>
      <Search
        size={14}
        color="var(--color-icon)"
        onClick={() => setSearchVisible(true)}
        style={{ cursor: 'pointer' }}
      />
    </Tooltip>
  )
}

export default ModelListSearchBar
