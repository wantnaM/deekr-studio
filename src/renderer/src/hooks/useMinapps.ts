import { allMinApps } from '@renderer/config/minapps'
import type { RootState } from '@renderer/store'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { setDisabledMinApps, setMinApps, setPinnedMinApps } from '@renderer/store/minapps'
import type { MinAppType } from '@renderer/types'
import { useCallback, useMemo } from 'react'

export const useMinapps = () => {
  const { enabled, disabled, pinned } = useAppSelector((state: RootState) => state.minapps)
  const dispatch = useAppDispatch()

  const mapApps = useCallback(
    (apps: MinAppType[]) => apps.map((app) => allMinApps.find((item) => item.id === app.id) || app),
    []
  )

  const getAllApps = useCallback(
    (apps: MinAppType[], disabledApps: MinAppType[]) => {
      const mappedApps = mapApps(apps)
      const existingIds = new Set(mappedApps.map((app) => app.id))
      const disabledIds = new Set(disabledApps.map((app) => app.id))
      const missingApps = allMinApps.filter((app) => !existingIds.has(app.id) && !disabledIds.has(app.id))
      return [...mappedApps, ...missingApps]
    },
    [mapApps]
  )

  const minapps = useMemo(() => {
    const allApps = getAllApps(enabled, disabled)
    const disabledIds = new Set(disabled.map((app) => app.id))
    return allApps.filter((app) => !disabledIds.has(app.id))
  }, [enabled, disabled, getAllApps])

  const disabledApps = useMemo(() => mapApps(disabled), [disabled, mapApps])
  const pinnedApps = useMemo(() => mapApps(pinned), [pinned, mapApps])

  const updateMinapps = useCallback(
    (apps: MinAppType[]) => {
      const disabledIds = new Set(disabled.map((app) => app.id))
      const withoutDisabled = apps.filter((app) => !disabledIds.has(app.id))

      const existingIds = new Set(withoutDisabled.map((app) => app.id))
      const missingApps = allMinApps.filter((app) => !existingIds.has(app.id) && !disabledIds.has(app.id))

      dispatch(setMinApps([...withoutDisabled, ...missingApps]))
    },
    [dispatch, disabled]
  )

  const updateDisabledMinapps = useCallback(
    (apps: MinAppType[]) => {
      dispatch(setDisabledMinApps(apps))
    },
    [dispatch]
  )

  const updatePinnedMinapps = useCallback(
    (apps: MinAppType[]) => {
      dispatch(setPinnedMinApps(apps))
    },
    [dispatch]
  )

  return {
    minapps,
    disabled: disabledApps,
    pinned: pinnedApps,
    updateMinapps,
    updateDisabledMinapps,
    updatePinnedMinapps
  }
}
