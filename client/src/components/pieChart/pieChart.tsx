import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { Chart } from 'chart.js/auto'
import { usePointingPokerSession } from '~/hooks/usePointingPokerSession'
import styles from './pieChart.module.css'

export default component$(() => {
  const store = usePointingPokerSession()
  const canvasRef = useSignal<Element>()
  const chartData: Record<number, number> = {}

  Object.values(store.playerPoints).forEach((points) =>
    chartData[points] ? chartData[points]++ : (chartData[points] = 1)
  )

  useVisibleTask$(({ cleanup }) => {
    const chart = new Chart(canvasRef.value as HTMLCanvasElement, {
      type: 'pie',
      data: {
        labels: Object.keys(chartData),
        datasets: [
          {
            label: 'Votes',
            data: Object.values(chartData),
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
    })
    cleanup(() => chart.destroy())
  })
  return (
    <div class={styles['pie-chart-container']}>
      <canvas class={styles['pie-chart']} ref={canvasRef}></canvas>
    </div>
  )
})
