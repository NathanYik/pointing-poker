import { $ } from '@builder.io/qwik'
import { usePointingPokerSession } from './usePointingPokerSession'

interface SendWebSocketMessageOptions {
  type: string
  payload?: any
}

export const useSendWebSocketMessage = () => {
  const store = usePointingPokerSession()

  return $(({ type, payload }: SendWebSocketMessageOptions) =>
    store.ws?.send(
      JSON.stringify({
        type,
        payload,
      })
    )
  )
}
