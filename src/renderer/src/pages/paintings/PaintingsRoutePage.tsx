import { useAppDispatch } from '@renderer/store'
import { setDefaultPaintingProvider } from '@renderer/store/settings'
import { PaintingProvider } from '@renderer/types'
import { FC, useEffect } from 'react'
import { Route, Routes, useParams } from 'react-router-dom'

// import TokenFluxPage from './TokenFluxPage'
import DoubaoPage from './DoubaoPage'
// import AihubmixPage from './AihubmixPage'
// import DmxapiPage from './DmxapiPage'
import SiliconPage from './SiliconPage'

const Options = ['doubao', 'silicon']

const PaintingsRoutePage: FC = () => {
  const params = useParams()
  const provider = params['*']
  const dispatch = useAppDispatch()

  useEffect(() => {
    console.debug('defaultPaintingProvider', provider)
    if (provider && Options.includes(provider)) {
      dispatch(setDefaultPaintingProvider(provider as PaintingProvider))
    }
  }, [provider, dispatch])

  return (
    <Routes>
      <Route path="*" element={<DoubaoPage Options={Options} />} />
      {/* <Route path="/aihubmix" element={<AihubmixPage Options={Options} />} /> */}
      <Route path="/doubao" element={<DoubaoPage Options={Options} />} />
      <Route path="/silicon" element={<SiliconPage Options={Options} />} />
      {/* <Route path="/dmxapi" element={<DmxapiPage Options={Options} />} />
      <Route path="/tokenflux" element={<TokenFluxPage Options={Options} />} /> */}
    </Routes>
  )
}

export default PaintingsRoutePage
