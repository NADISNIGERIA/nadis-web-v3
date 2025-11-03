import { ref } from 'vue'

export default () => {
  const months = ref([
    {
      full: 'January',
      short: 'Jan',
      days: 31
    },
    {
      full: 'Febuary',
      short: 'Feb',
      days: 29
    },
    {
      full: 'March',
      short: 'March',
      days: 31
    },
    {
      full: 'April',
      short: 'April',
      days: 30
    },
    {
      full: 'May',
      short: 'May',
      days: 31
    },
    {
      full: 'June',
      short: 'Jun',
      days: 30
    },
    {
      full: 'July',
      short: 'Jul',
      days: 31
    },
    {
      full: 'August',
      short: 'Aug',
      days: 31
    },
    {
      full: 'September',
      short: 'Sept',
      days: 30
    },
    {
      full: 'October',
      short: 'Oct',
      days: 31
    },
    {
      full: 'November',
      short: 'Nov',
      days: 30
    },
    {
      full: 'December',
      short: 'Dec',
      days: 31
    }
  ])

  return { months }
}
