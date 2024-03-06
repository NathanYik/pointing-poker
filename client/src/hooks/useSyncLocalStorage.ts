import { useVisibleTask$ } from '@builder.io/qwik'
import { usePointingPokerSession } from './usePointingPokerSession'
import { useNavigate } from '@builder.io/qwik-city'

export const useSyncLocalStorage = ({ navigate }: { navigate: boolean }) => {
  const nav = useNavigate()
  const store = usePointingPokerSession()

  useVisibleTask$(({ track }) => {
    track(() => store.channelId)
    const previousSessionData = localStorage.getItem(store.channelId)
    if (
      store?.ws?.readyState === 1 &&
      !store.error &&
      store.channelId &&
      !previousSessionData
    ) {
      console.log('setting localStorage', store.channelId)
      window.localStorage.setItem(
        store.channelId,
        JSON.stringify({
          channelId: store.channelId,
          playerId: store.playerId,
        })
      )
      if (navigate) {
        nav(store.channelId)
      }
    }
  })
}
