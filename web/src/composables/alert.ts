import Swal from 'sweetalert2'

export default () => {
  const exposeAlert = (timer: number, icon: string, title: string) => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'center',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    })

    Toast.fire({
      icon: icon as any,
      title: title
    })
  }
  const confirmBeforeAction = (message: string, functionVariable: any, param = '') => {
    Swal.fire({
      title: message,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#005304',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, please!'
    }).then((result) => {
      if (result.isConfirmed) {
        if (param == '') {
          functionVariable()
        } else {
          functionVariable(param)
        }
      }
    })
  }
  return { exposeAlert, confirmBeforeAction }
}
