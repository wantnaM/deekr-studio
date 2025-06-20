import { FC } from 'react'
import { Route, Routes } from 'react-router-dom'

import DoubaoPage from './DoubaoPage'
// import AihubmixPage from './AihubmixPage'
import SiliconPage from './PaintingsPage'

const Options = ['doubao', 'silicon']

const PaintingsRoutePage: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DoubaoPage Options={Options} />} />
      {/* <Route path="/aihubmix" element={<AihubmixPage Options={Options} />} /> */}
      <Route path="/silicon" element={<SiliconPage Options={Options} />} />
      <Route path="/doubao" element={<DoubaoPage Options={Options} />} />
    </Routes>
  )
}

export default PaintingsRoutePage
